/**
 * Сервис email-аутентификации
 * Регистрация, вход, верификация email, сброс пароля, связывание аккаунтов
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import {
  User,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
} from "../database/entities";
import { TelegramService, TelegramUser } from "./telegram.service";
import { MaxService } from "./max.service";
import { EmailService } from "../email/email.service";
import { formatFullName } from "../shared/utils";

type UserRole = "teacher" | "student" | "parent";

function generateReferralCode(prefix: string): string {
  return `${prefix}_${nanoid(12)}`;
}

interface JwtPayload {
  sub: string;
  telegramId: number | null;
  role: UserRole;
  profileId: string;
  isBetaTester: boolean;
}

@Injectable()
export class EmailAuthService {
  private readonly logger = new Logger(EmailAuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  /** Время жизни ссылки верификации/сброса пароля (часы) */
  private readonly TOKEN_EXPIRY_HOURS = 24;
  /** Время жизни 4-значного кода верификации (минуты) */
  private readonly CODE_EXPIRY_MINUTES = 10;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeacherProfile)
    private readonly teacherProfileRepository: Repository<TeacherProfile>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(ParentProfile)
    private readonly parentProfileRepository: Repository<ParentProfile>,
    private readonly telegramService: TelegramService,
    private readonly maxService: MaxService,
    private readonly emailService: EmailService,
  ) {}

  // ============================================
  // РЕГИСТРАЦИЯ ПО EMAIL
  // ============================================

  /**
   * Регистрация нового пользователя.
   * Создаёт юзера без профиля, отправляет 4-значный код на email.
   * Профиль и JWT выдаются только после верификации кода (verifyCode).
   */
  async registerEmail(
    email: string,
    password: string,
    firstName: string,
    role: UserRole,
    lastName?: string,
    referralSource?: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const codeExpires = new Date();
    codeExpires.setMinutes(codeExpires.getMinutes() + this.CODE_EXPIRY_MINUTES);

    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName: lastName || null,
      emailVerified: false,
      emailVerificationToken: code,
      emailTokenExpiresAt: codeExpires,
      referralSource: referralSource || null,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`Email register: ${normalizedEmail} role=${role} (pending verification)`);

    this.emailService
      .sendVerificationCode(normalizedEmail, code, firstName)
      .catch((err) => this.logger.error(`Verification code email error: ${err.message}`));

    return {
      pendingVerification: true,
      userId: savedUser.id,
      email: normalizedEmail,
      role,
    };
  }

  // ============================================
  // ВЕРИФИКАЦИЯ ПО КОДУ
  // ============================================

  /**
   * Подтвердить email по 4-значному коду и завершить регистрацию.
   */
  async verifyCode(userId: string, code: string, role: UserRole) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (!user) {
      throw new BadRequestException("USER_NOT_FOUND");
    }

    if (user.emailVerified) {
      throw new BadRequestException("ALREADY_VERIFIED");
    }

    if (!user.emailVerificationToken) {
      throw new BadRequestException("NO_PENDING_CODE");
    }

    if (user.emailTokenExpiresAt && user.emailTokenExpiresAt < new Date()) {
      throw new BadRequestException("CODE_EXPIRED");
    }

    if (user.emailVerificationToken !== code) {
      throw new BadRequestException("INVALID_CODE");
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailTokenExpiresAt = null;
    await this.userRepository.save(user);

    this.logger.log(`Email verified by code: ${user.email}`);

    const profile = await this.createProfile(
      user.id,
      role,
      user.firstName,
      user.lastName ?? undefined,
    );
    const userWithProfile = { ...user, [`${role}Profile`]: profile };
    const token = this.generateToken(userWithProfile, role);

    return {
      token,
      user: this.formatUser(user),
      roles: [role],
      currentRole: role,
    };
  }

  /**
   * Переотправить код верификации.
   */
  async resendCode(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException("USER_NOT_FOUND");
    }

    if (user.emailVerified) {
      throw new BadRequestException("ALREADY_VERIFIED");
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const codeExpires = new Date();
    codeExpires.setMinutes(codeExpires.getMinutes() + this.CODE_EXPIRY_MINUTES);

    user.emailVerificationToken = code;
    user.emailTokenExpiresAt = codeExpires;
    await this.userRepository.save(user);

    this.logger.log(`Resend code: ${user.email}`);

    this.emailService
      .sendVerificationCode(user.email!, code, user.firstName)
      .catch((err) => this.logger.error(`Resend code email error: ${err.message}`));

    return { success: true };
  }

  // ============================================
  // ВХОД ПО EMAIL
  // ============================================

  async loginEmail(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    this.logger.log(`Email login: ${normalizedEmail}`);

    const roles = this.getUserRoles(user);
    if (roles.length === 0) {
      throw new BadRequestException("NO_ROLES");
    }

    const currentRole = roles[0];
    const token = this.generateToken(user, currentRole);

    return {
      token,
      user: this.formatUser(user),
      roles,
      currentRole,
      isNewUser: false,
    };
  }

  // ============================================
  // ПОЛУЧЕНИЕ ПРОФИЛЯ (для автологина по JWT)
  // ============================================

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    const roles = this.getUserRoles(user);

    return {
      user: this.formatUser(user),
      roles,
    };
  }

  // ============================================
  // ВЕРИФИКАЦИЯ EMAIL
  // ============================================

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException("INVALID_TOKEN");
    }

    if (user.emailTokenExpiresAt && user.emailTokenExpiresAt < new Date()) {
      throw new BadRequestException("TOKEN_EXPIRED");
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailTokenExpiresAt = null;
    await this.userRepository.save(user);

    this.logger.log(`Email verified: ${user.email}`);

    return { success: true };
  }

  // ============================================
  // СБРОС ПАРОЛЯ
  // ============================================

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    // Не раскрываем существование email
    if (!user) {
      return { success: true };
    }

    const resetToken = nanoid(48);
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1); // 1 час на сброс

    user.emailVerificationToken = resetToken;
    user.emailTokenExpiresAt = tokenExpires;
    await this.userRepository.save(user);

    this.logger.log(`Password reset requested: ${normalizedEmail}`);

    this.emailService
      .sendPasswordResetEmail(normalizedEmail, resetToken, user.firstName)
      .catch((err) => this.logger.error(`Password reset email error: ${err.message}`));

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException("INVALID_TOKEN");
    }

    if (user.emailTokenExpiresAt && user.emailTokenExpiresAt < new Date()) {
      throw new BadRequestException("TOKEN_EXPIRED");
    }

    user.passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    user.emailVerificationToken = null;
    user.emailTokenExpiresAt = null;
    await this.userRepository.save(user);

    this.logger.log(`Password reset: ${user.email}`);

    return { success: true };
  }

  // ============================================
  // СВЯЗЫВАНИЕ АККАУНТОВ
  // ============================================

  /**
   * Привязать email к существующему аккаунту (для TG-пользователей)
   * Вызывается авторизованным пользователем (JWT)
   */
  async linkEmail(userId: string, email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingEmail = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new ConflictException("EMAIL_ALREADY_EXISTS");
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    if (user.email) {
      throw new ConflictException("EMAIL_ALREADY_LINKED");
    }

    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    const verificationToken = nanoid(48);
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + this.TOKEN_EXPIRY_HOURS);

    user.email = normalizedEmail;
    user.passwordHash = passwordHash;
    user.emailVerified = false;
    user.emailVerificationToken = verificationToken;
    user.emailTokenExpiresAt = tokenExpires;
    await this.userRepository.save(user);

    this.logger.log(`Email linked: userId=${userId} email=${normalizedEmail}`);

    this.emailService
      .sendVerificationEmail(normalizedEmail, verificationToken, user.firstName)
      .catch((err) => this.logger.error(`Link email verification error: ${err.message}`));

    return { success: true };
  }

  /**
   * Привязать Telegram к существующему email-аккаунту
   * Вызывается из Mini App: передаёт initData + email + password
   */
  async linkTelegram(initData: string, email: string, password: string) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      throw new UnauthorizedException("INVALID_INIT_DATA");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Проверяем, не занят ли telegramId
    const existingTg = await this.userRepository.findOne({
      where: { telegramId: String(telegramUser.id) },
    });
    if (existingTg) {
      throw new ConflictException("TELEGRAM_ALREADY_LINKED");
    }

    // Находим email-аккаунт
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    // Привязываем Telegram
    user.telegramId = String(telegramUser.id);
    user.username = telegramUser.username || user.username;
    await this.userRepository.save(user);

    this.logger.log(`Telegram linked: userId=${user.id} tg=${telegramUser.id}`);

    return { success: true };
  }

  // ============================================
  // AUTO-LINK (привязка платформы после email-логина в Mini App)
  // ============================================

  /**
   * Автоматически привязать Telegram к текущему аккаунту.
   * Вызывается авторизованным пользователем (JWT) из Telegram Mini App.
   * Не требует пароль -- пользователь уже аутентифицирован + initData валидируется.
   */
  async autoLinkTelegram(userId: string, initData: string) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      throw new UnauthorizedException("INVALID_INIT_DATA");
    }

    const telegramId = String(telegramUser.id);

    const existingTg = await this.userRepository.findOne({
      where: { telegramId },
    });
    if (existingTg && existingTg.id !== userId) {
      throw new ConflictException("TELEGRAM_ALREADY_LINKED");
    }
    if (existingTg && existingTg.id === userId) {
      return { success: true, alreadyLinked: true };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    user.telegramId = telegramId;
    if (telegramUser.username && !user.username) {
      user.username = telegramUser.username;
    }
    if (telegramUser.first_name && !user.firstName) {
      user.firstName = telegramUser.first_name;
    }
    await this.userRepository.save(user);

    this.logger.log(`Auto-link Telegram: userId=${userId} tg=${telegramId}`);

    return { success: true };
  }

  /**
   * Автоматически привязать MAX к текущему аккаунту.
   * Вызывается авторизованным пользователем (JWT) из MAX Mini App.
   */
  async autoLinkMax(userId: string, initData: string) {
    const maxUser = this.maxService.validateInitData(initData);
    if (!maxUser) {
      throw new UnauthorizedException("INVALID_MAX_INIT_DATA");
    }

    const maxId = String(maxUser.id);

    const existingMax = await this.userRepository.findOne({
      where: { maxId },
    });
    if (existingMax && existingMax.id !== userId) {
      throw new ConflictException("MAX_ALREADY_LINKED");
    }
    if (existingMax && existingMax.id === userId) {
      return { success: true, alreadyLinked: true };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    user.maxId = maxId;
    if (maxUser.username && !user.username) {
      user.username = maxUser.username;
    }
    if (maxUser.first_name && !user.firstName) {
      user.firstName = maxUser.first_name;
    }
    await this.userRepository.save(user);

    this.logger.log(`Auto-link MAX: userId=${userId} maxId=${maxId}`);

    return { success: true };
  }

  // ============================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ============================================

  private getUserRoles(user: User): UserRole[] {
    const roles: UserRole[] = [];
    if (user.teacherProfile) roles.push("teacher");
    if (user.studentProfile) roles.push("student");
    if (user.parentProfile) roles.push("parent");
    return roles;
  }

  private async createProfile(
    userId: string,
    role: UserRole,
    firstName?: string,
    lastName?: string,
  ) {
    switch (role) {
      case "teacher": {
        const profile = this.teacherProfileRepository.create({
          userId,
          displayName: formatFullName(firstName, lastName) || "Учитель",
          referralCode: generateReferralCode("T"),
        });
        return this.teacherProfileRepository.save(profile);
      }
      case "student": {
        const profile = this.studentProfileRepository.create({
          userId,
          parentInviteCode: generateReferralCode("P"),
        });
        return this.studentProfileRepository.save(profile);
      }
      case "parent": {
        const profile = this.parentProfileRepository.create({ userId });
        return this.parentProfileRepository.save(profile);
      }
    }
  }

  private generateToken(user: any, role: UserRole): string {
    const profile =
      user.teacherProfile || user.studentProfile || user.parentProfile;
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId ? Number(user.telegramId) : null,
      role,
      profileId: profile?.id || "",
      isBetaTester: user.isBetaTester || false,
    };
    return this.jwtService.sign(payload);
  }

  private formatUser(user: User) {
    return {
      id: user.id,
      telegramId: user.telegramId ? Number(user.telegramId) : null,
      maxId: user.maxId || null,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email || null,
      emailVerified: user.emailVerified || false,
      isBetaTester: user.isBetaTester || false,
    };
  }
}
