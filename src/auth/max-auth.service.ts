/**
 * Сервис аутентификации через MAX messenger
 * init (через initData), привязка MAX к существующему аккаунту
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  User,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
} from "../database/entities";
import { MaxService, MaxUser } from "./max.service";
import { formatFullName } from "../shared/utils";

type UserRole = "teacher" | "student" | "parent";

@Injectable()
export class MaxAuthService {
  private readonly logger = new Logger(MaxAuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeacherProfile)
    private readonly teacherProfileRepository: Repository<TeacherProfile>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(ParentProfile)
    private readonly parentProfileRepository: Repository<ParentProfile>,
    private readonly jwtService: JwtService,
    private readonly maxService: MaxService,
  ) {}

  /**
   * Инициализация через MAX initData (аналог Telegram init)
   * Если пользователь с maxId существует -- возвращаем токен
   * Если нет -- возвращаем isNewUser: true
   */
  async initMax(initData: string) {
    const maxUser = this.maxService.validateInitData(initData);
    if (!maxUser) {
      this.logger.warn(`initMax: invalid initData (length=${initData?.length})`);
      throw new UnauthorizedException("INVALID_MAX_INIT_DATA");
    }

    const maxId = String(maxUser.id);
    this.logger.log(`initMax: maxId=${maxId} name=${maxUser.first_name} ${maxUser.last_name || ""}`);

    const user = await this.userRepository.findOne({
      where: { maxId },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (user) {
      const roles = this.getUserRoles(user);
      const currentRole = roles[0] || null;
      const profile =
        user.teacherProfile || user.studentProfile || user.parentProfile;
      this.logger.log(
        `initMax: found user=${user.id} email=${user.email} name=${user.firstName} ` +
        `roles=[${roles}] profileId=${profile?.id || "NONE"}`
      );
      const token = this.generateToken(user, currentRole);
      return {
        isNewUser: false,
        user: this.formatUser(user),
        roles,
        currentRole,
        token,
      };
    }

    this.logger.log(`initMax: no user with maxId=${maxId}, isNewUser=true`);
    return {
      isNewUser: true,
      user: null,
      roles: [],
      currentRole: null,
      token: null,
    };
  }

  /**
   * Регистрация нового пользователя через MAX
   */
  async registerMax(initData: string, role: UserRole) {
    const maxUser = this.maxService.validateInitData(initData);
    if (!maxUser) {
      throw new UnauthorizedException("INVALID_MAX_INIT_DATA");
    }

    const maxId = String(maxUser.id);

    const existing = await this.userRepository.findOne({ where: { maxId } });
    if (existing) {
      throw new ConflictException("MAX_ACCOUNT_ALREADY_REGISTERED");
    }

    const user = this.userRepository.create({
      maxId,
      firstName: maxUser.first_name || "MAX User",
      lastName: maxUser.last_name || "",
      username: maxUser.username || null,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`MAX register: maxId=${maxId} role=${role}`);

    const profile = await this.createProfile(
      savedUser.id,
      role,
      maxUser.first_name,
      maxUser.last_name,
    );
    const userWithProfile = { ...savedUser, [`${role}Profile`]: profile };
    const token = this.generateToken(userWithProfile, role);

    return {
      token,
      user: this.formatUser(savedUser),
      roles: [role],
      currentRole: role,
    };
  }

  /**
   * Привязка MAX к существующему аккаунту
   * (вызывается авторизованным пользователем из MAX Mini App)
   */
  async linkMax(userId: string, initData: string) {
    const maxUser = this.maxService.validateInitData(initData);
    if (!maxUser) {
      this.logger.warn(`linkMax: invalid initData for userId=${userId}`);
      throw new UnauthorizedException("INVALID_MAX_INIT_DATA");
    }

    const maxId = String(maxUser.id);
    this.logger.log(`linkMax: userId=${userId} maxId=${maxId}`);

    const existingMaxUser = await this.userRepository.findOne({
      where: { maxId },
    });
    if (existingMaxUser && existingMaxUser.id !== userId) {
      this.logger.warn(
        `linkMax: maxId=${maxId} already linked to user=${existingMaxUser.id} (${existingMaxUser.email}), ` +
        `rejecting for userId=${userId}`
      );
      throw new ConflictException("MAX_ACCOUNT_ALREADY_LINKED");
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("USER_NOT_FOUND");
    }

    user.maxId = maxId;
    await this.userRepository.save(user);
    this.logger.log(`linkMax: OK userId=${userId} email=${user.email} maxId=${maxId}`);

    return { success: true };
  }

  // ============================================
  // ПРИВАТНЫЕ ХЕЛПЕРЫ
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
    const displayName = formatFullName(firstName || "Пользователь", lastName);

    if (role === "teacher") {
      const profile = this.teacherProfileRepository.create({
        userId,
        displayName,
      });
      return this.teacherProfileRepository.save(profile);
    }
    if (role === "student") {
      const profile = this.studentProfileRepository.create({ userId });
      return this.studentProfileRepository.save(profile);
    }
    const profile = this.parentProfileRepository.create({ userId });
    return this.parentProfileRepository.save(profile);
  }

  private generateToken(user: any, currentRole: UserRole | null): string {
    const profile =
      user.teacherProfile || user.studentProfile || user.parentProfile;
    return this.jwtService.sign({
      sub: user.id,
      telegramId: user.telegramId ? Number(user.telegramId) : null,
      maxId: user.maxId ? Number(user.maxId) : null,
      role: currentRole,
      profileId: profile?.id || "",
      isBetaTester: user.isBetaTester || false,
    });
  }

  private formatUser(user: User) {
    return {
      id: user.id,
      telegramId: user.telegramId ? Number(user.telegramId) : null,
      maxId: user.maxId ? Number(user.maxId) : null,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  }
}
