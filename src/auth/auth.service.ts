/**
 * Сервис авторизации
 * Управляет регистрацией, аутентификацией и связыванием пользователей
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  GoneException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { nanoid } from "nanoid";
import { TelegramService, TelegramUser } from "./telegram.service";
import {
  User,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
  Invitation,
  TeacherStudentLink,
  ParentStudentRelation,
  Lesson,
  LessonSeries,
  Subject,
  Subscription,
  UserNotificationSettings,
  AnalyticsEvent,
  LessonStudent,
  LessonSeriesStudent,
} from "../database/entities";
import {
  generateInviteUrl,
  formatFullName,
  getBotUsername,
} from "../shared/utils";
import { BotService } from "../bot/bot.service";

type UserRole = "teacher" | "student" | "parent";

/**
 * Генерирует уникальный реферальный код с префиксом
 */
function generateReferralCode(prefix: string): string {
  return `${prefix}_${nanoid(12)}`;
}

interface JwtPayload {
  sub: string;
  telegramId: number;
  role: UserRole;
  profileId: string;
  isBetaTester: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TeacherProfile)
    private teacherProfileRepository: Repository<TeacherProfile>,
    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(ParentProfile)
    private parentProfileRepository: Repository<ParentProfile>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(TeacherStudentLink)
    private teacherStudentLinkRepository: Repository<TeacherStudentLink>,
    @InjectRepository(ParentStudentRelation)
    private parentStudentRelationRepository: Repository<ParentStudentRelation>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonSeries)
    private lessonSeriesRepository: Repository<LessonSeries>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(UserNotificationSettings)
    private notificationSettingsRepository: Repository<UserNotificationSettings>,
    @InjectRepository(AnalyticsEvent)
    private analyticsEventRepository: Repository<AnalyticsEvent>,
    @InjectRepository(LessonStudent)
    private lessonStudentRepository: Repository<LessonStudent>,
    @InjectRepository(LessonSeriesStudent)
    private lessonSeriesStudentRepository: Repository<LessonSeriesStudent>,
    private jwtService: JwtService,
    private telegramService: TelegramService,
    private botService: BotService
  ) {}

  // ============================================
  // ОСНОВНЫЕ МЕТОДЫ АВТОРИЗАЦИИ
  // ============================================

  /** Количество дней для восстановления удалённого аккаунта */
  private readonly ACCOUNT_RESTORE_DAYS = 7;

  /**
   * Инициализация пользователя через Telegram initData
   * Проверяет существует ли пользователь и возвращает его данные или информацию для регистрации
   */
  async init(initData: string) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      this.logger.warn(`Init failed: invalid initData`);
      throw new UnauthorizedException("INVALID_INIT_DATA");
    }

    this.logger.log(
      `Init: tg=${telegramUser.id} @${telegramUser.username || "no_username"}`
    );

    // Ищем пользователя включая удалённых (soft delete)
    const user = await this.userRepository
      .createQueryBuilder("user")
      .withDeleted()
      .leftJoinAndSelect("user.teacherProfile", "teacherProfile")
      .leftJoinAndSelect("user.studentProfile", "studentProfile")
      .leftJoinAndSelect("user.parentProfile", "parentProfile")
      .where("user.telegramId = :telegramId", { telegramId: String(telegramUser.id) })
      .getOne();

    if (!user) {
      this.logger.log(`Init: new user tg=${telegramUser.id}`);
      return {
        isNewUser: true,
        telegramUser: {
          id: telegramUser.id,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
        },
      };
    }

    // Проверяем, удалён ли аккаунт
    if (user.deletedAt) {
      const deletedDate = new Date(user.deletedAt);
      const now = new Date();
      const daysSinceDelete = Math.floor(
        (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceDelete < this.ACCOUNT_RESTORE_DAYS) {
        // Аккаунт можно восстановить
        const daysLeft = this.ACCOUNT_RESTORE_DAYS - daysSinceDelete;
        this.logger.log(
          `Init: deleted user tg=${telegramUser.id}, can restore, ${daysLeft} days left`
        );
        return {
          isNewUser: false,
          isDeleted: true,
          canRestore: true,
          daysLeft,
          deletedAt: user.deletedAt.toISOString(),
          telegramUser: {
            id: telegramUser.id,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            username: telegramUser.username,
          },
        };
      } else {
        // Срок восстановления истёк — полностью удаляем данные и создаём нового пользователя
        this.logger.log(
          `Init: deleted user tg=${telegramUser.id}, restore period expired, purging data`
        );
        await this.purgeDeletedUser(user);
        return {
          isNewUser: true,
          telegramUser: {
            id: telegramUser.id,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            username: telegramUser.username,
          },
        };
      }
    }

    const roles = this.getUserRoles(user);
    this.logger.log(
      `Init: existing user tg=${telegramUser.id} roles=${roles.join(",")}`
    );

    if (roles.length === 1) {
      const token = this.generateToken(user, roles[0]);
      return {
        isNewUser: false,
        user: this.formatUser(user),
        roles,
        currentRole: roles[0],
        token,
      };
    }

    return {
      isNewUser: false,
      user: this.formatUser(user),
      roles,
      currentRole: null,
      token: null,
    };
  }

  /**
   * Регистрация нового пользователя с выбранной ролью
   */
  async register(initData: string, role: UserRole, referralSource?: string) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      this.logger.warn(`Register failed: invalid initData`);
      throw new UnauthorizedException("INVALID_INIT_DATA");
    }

    const existing = await this.userRepository.findOne({
      where: { telegramId: String(telegramUser.id) },
    });

    if (existing) {
      this.logger.warn(`Register failed: user exists tg=${telegramUser.id}`);
      throw new ConflictException("USER_EXISTS");
    }

    const user = this.userRepository.create({
      telegramId: String(telegramUser.id),
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
      referralSource: referralSource || null,
    });
    await this.userRepository.save(user);

    const profile = await this.createProfile(user.id, role, telegramUser);
    const userWithProfile = { ...user, [`${role}Profile`]: profile };
    const token = this.generateToken(userWithProfile, role);

    this.logger.log(
      `Register: tg=${telegramUser.id} role=${role} userId=${user.id}` +
        (referralSource ? ` referral=${referralSource}` : "")
    );

    // Отправляем приветственное уведомление
    this.botService.notifyUserWelcome(telegramUser.id, role).catch((err) => {
      this.logger.warn(`Failed to send welcome notification: ${err.message}`);
    });

    return {
      user: this.formatUser(user),
      roles: [role],
      currentRole: role,
      profile: this.formatProfile(profile, role),
      token,
    };
  }

  /**
   * Выбор роли для пользователя с несколькими ролями
   */
  async selectRole(initData: string, role: UserRole) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      throw new UnauthorizedException("INVALID_INIT_DATA");
    }

    const user = await this.userRepository.findOne({
      where: { telegramId: String(telegramUser.id) },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (!user) {
      throw new UnauthorizedException("USER_NOT_FOUND");
    }

    const roles = this.getUserRoles(user);
    if (!roles.includes(role)) {
      throw new ForbiddenException("ROLE_NOT_AVAILABLE");
    }

    const token = this.generateToken(user, role);

    return {
      user: this.formatUser(user),
      roles,
      currentRole: role,
      token,
    };
  }

  /**
   * Добавление новой роли существующему пользователю
   */
  async addRole(userId: string, role: UserRole) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (!user) {
      throw new UnauthorizedException("USER_NOT_FOUND");
    }

    const existingRoles = this.getUserRoles(user);
    if (existingRoles.includes(role)) {
      throw new ConflictException("ROLE_EXISTS");
    }

    const profile = await this.createProfile(userId, role, {
      id: Number(user.telegramId),
      first_name: user.firstName || undefined,
      last_name: user.lastName || undefined,
      username: user.username || undefined,
    });

    // Обновляем user с новым профилем для генерации токена
    const updatedUser = { ...user, [`${role}Profile`]: profile };
    const newRoles = [...existingRoles, role];
    const token = this.generateToken(updatedUser, role);

    this.logger.log(`AddRole: userId=${userId} role=${role}`);

    return {
      user: this.formatUser(user),
      roles: newRoles,
      currentRole: role,
      token,
    };
  }

  /**
   * Получение информации о текущем пользователе
   */
  async getMe(userId: string, role: UserRole) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (!user) {
      throw new UnauthorizedException("USER_NOT_FOUND");
    }

    const roles = this.getUserRoles(user);

    const profiles: Record<string, any> = {};
    if (user.teacherProfile) {
      profiles.teacher = {
        id: user.teacherProfile.id,
        displayName: user.teacherProfile.displayName,
        bio: user.teacherProfile.bio,
      };
    }
    if (user.studentProfile) {
      profiles.student = {
        id: user.studentProfile.id,
        customFields: user.studentProfile.customFields,
      };
    }
    if (user.parentProfile) {
      profiles.parent = {
        id: user.parentProfile.id,
      };
    }

    return {
      user: {
        ...this.formatUser(user),
        createdAt: user.createdAt.toISOString(),
      },
      roles,
      currentRole: role,
      profiles,
    };
  }

  /**
   * Обновление JWT токена
   */
  async refresh(userId: string, role: UserRole) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (!user) {
      throw new UnauthorizedException("USER_NOT_FOUND");
    }

    const token = this.generateToken(user, role);
    const decoded = this.jwtService.decode(token) as { exp: number };

    return {
      token,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    };
  }

  /**
   * Установка статуса бета-тестера
   * Только для администраторов или по специальному коду
   */
  async setBetaTester(
    userId: string,
    isBetaTester: boolean,
    adminCode?: string
  ) {
    const validAdminCode = process.env.ADMIN_CODE || "admin_secret_code";

    if (adminCode !== validAdminCode) {
      this.logger.warn(
        `SetBetaTester failed: invalid admin code for user=${userId}`
      );
      throw new ForbiddenException("INVALID_ADMIN_CODE");
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    user.isBetaTester = isBetaTester;
    await this.userRepository.save(user);

    this.logger.log(
      `SetBetaTester: user=${userId} isBetaTester=${isBetaTester}`
    );

    return {
      userId: user.id,
      isBetaTester: user.isBetaTester,
      message: isBetaTester
        ? "Бета-тестер активирован"
        : "Бета-тестер деактивирован",
    };
  }

  /**
   * Активация бета-тестера по коду (для самостоятельной активации)
   */
  async activateBetaTester(userId: string, betaCode: string) {
    const validBetaCode = process.env.BETA_CODE || "beta_2025";

    if (betaCode !== validBetaCode) {
      this.logger.warn(
        `ActivateBetaTester failed: invalid code for user=${userId}`
      );
      throw new BadRequestException("INVALID_BETA_CODE");
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    if (user.isBetaTester) {
      return {
        userId: user.id,
        isBetaTester: true,
        message: "Вы уже бета-тестер",
      };
    }

    user.isBetaTester = true;
    await this.userRepository.save(user);

    this.logger.log(`ActivateBetaTester: user=${userId} activated`);

    return {
      userId: user.id,
      isBetaTester: true,
      message: "Добро пожаловать в программу бета-тестирования!",
    };
  }

  // ============================================
  // ПРИГЛАШЕНИЯ (LEGACY - временные ссылки)
  // ============================================

  /**
   * Принятие временного приглашения
   * @deprecated Используйте joinByReferral с постоянными ссылками
   */
  async acceptInvitation(
    initData: string | null,
    invitationToken: string,
    userId?: string
  ) {
    const invitation = await this.invitationRepository.findOne({
      where: { token: invitationToken },
      relations: ["teacher", "teacher.user"],
    });

    if (!invitation) {
      throw new BadRequestException("INVALID_INVITATION");
    }

    if (invitation.usedAt) {
      throw new GoneException("INVITATION_USED");
    }

    if (new Date() > invitation.expiresAt) {
      throw new GoneException("INVITATION_EXPIRED");
    }

    let user: User | null = null;
    let telegramUser: TelegramUser | null = null;

    if (userId) {
      user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["teacherProfile", "studentProfile", "parentProfile"],
      });
    } else if (initData) {
      telegramUser = this.telegramService.validateInitData(initData);
      if (!telegramUser) {
        throw new UnauthorizedException("INVALID_INIT_DATA");
      }

      user = await this.userRepository.findOne({
        where: { telegramId: String(telegramUser.id) },
        relations: ["teacherProfile", "studentProfile", "parentProfile"],
      });

      if (!user) {
        const newUser = this.userRepository.create({
          telegramId: String(telegramUser.id),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
        });
        await this.userRepository.save(newUser);
        user = await this.userRepository.findOne({
          where: { id: newUser.id },
          relations: ["teacherProfile", "studentProfile", "parentProfile"],
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException("USER_NOT_FOUND");
    }

    const role = invitation.type as UserRole;
    let profile = this.getProfile(user, role);

    if (!profile) {
      profile = await this.createProfile(
        user.id,
        role,
        telegramUser || {
          id: Number(user.telegramId),
          first_name: user.firstName || undefined,
          last_name: user.lastName || undefined,
          username: user.username || undefined,
        }
      );
      (user as any)[`${role}Profile`] = profile;
    }

    let isNewConnection = false;

    if (role === "student" && profile) {
      const result = await this.ensureTeacherStudentLink(
        invitation.teacherId,
        profile.id
      );
      isNewConnection = result.isNew;
    } else if (role === "parent" && invitation.studentId && profile) {
      const result = await this.ensureParentStudentRelation(
        profile.id,
        invitation.studentId,
        invitation.teacherId
      );
      isNewConnection = result.isNew;
    }

    invitation.usedAt = new Date();
    await this.invitationRepository.save(invitation);

    const roles = this.getUserRoles(user);
    const token = this.generateToken(user, role);

    // Отправляем уведомления ТОЛЬКО если связь новая
    if (isNewConnection && telegramUser) {
      this.botService
        .notifyUserWelcome(
          telegramUser.id,
          role,
          role === "student" ? invitation.teacher.displayName : undefined
        )
        .catch((err) => {
          this.logger.warn(
            `Failed to send welcome notification: ${err.message}`
          );
        });

      // Уведомляем учителя о новом ученике
      if (role === "student" && invitation.teacher.user?.telegramId) {
        const studentName = formatFullName(
          telegramUser.first_name,
          telegramUser.last_name
        );
        this.botService
          .notifyTeacherNewStudent(
            invitation.teacher.user.telegramId,
            studentName || "Новый ученик"
          )
          .catch((err) => {
            this.logger.warn(`Failed to notify teacher: ${err.message}`);
          });
      }
    }

    return {
      user: this.formatUser(user),
      roles,
      currentRole: role,
      token,
      isNewConnection,
      invitation: {
        type: invitation.type,
        teacher: {
          id: invitation.teacher.id,
          displayName: invitation.teacher.displayName,
        },
      },
    };
  }

  // ============================================
  // ПОСТОЯННЫЕ ССЫЛКИ (РЕКОМЕНДУЕМЫЙ СПОСОБ)
  // ============================================

  /**
   * Присоединение по постоянной ссылке (referralCode)
   * T_xxx - ссылка учителя для учеников
   * P_xxx - ссылка ученика для родителей
   */
  async joinByReferral(initData: string, referralCode: string) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      this.logger.warn(`Join failed: invalid initData code=${referralCode}`);
      throw new UnauthorizedException("INVALID_INIT_DATA");
    }

    this.logger.log(`Join: tg=${telegramUser.id} code=${referralCode}`);

    if (referralCode.startsWith("T_")) {
      return this.joinTeacher(telegramUser, referralCode);
    } else if (referralCode.startsWith("P_")) {
      return this.joinAsParent(telegramUser, referralCode);
    } else {
      this.logger.warn(`Join failed: invalid code format code=${referralCode}`);
      throw new BadRequestException("INVALID_REFERRAL_CODE");
    }
  }

  /**
   * Присоединение ученика к учителю по T_xxx коду
   */
  private async joinTeacher(telegramUser: TelegramUser, referralCode: string) {
    const teacher = await this.teacherProfileRepository.findOne({
      where: { referralCode },
      relations: ["user"],
    });

    if (!teacher) {
      this.logger.warn(
        `JoinTeacher failed: teacher not found code=${referralCode}`
      );
      throw new NotFoundException("TEACHER_NOT_FOUND");
    }

    let user = await this.findOrCreateUser(telegramUser);

    let studentProfile = user.studentProfile;
    if (!studentProfile) {
      studentProfile = (await this.createProfile(
        user.id,
        "student",
        telegramUser
      )) as StudentProfile;
      user.studentProfile = studentProfile;
    }

    const { isNew: isNewConnection } = await this.ensureTeacherStudentLink(
      teacher.id,
      studentProfile.id
    );

    const roles = this.getUserRoles(user);
    const token = this.generateToken(user, "student");

    this.logger.log(
      `JoinTeacher: tg=${telegramUser.id} linked to teacher=${teacher.id}, isNewConnection=${isNewConnection}`
    );

    // Отправляем уведомления ТОЛЬКО если связь новая
    if (isNewConnection) {
      // Приветственное уведомление ученику
      this.botService
        .notifyUserWelcome(telegramUser.id, "student", teacher.displayName)
        .catch((err) => {
          this.logger.warn(
            `Failed to send welcome notification: ${err.message}`
          );
        });

      // Уведомляем учителя о новом ученике
      if (teacher.user?.telegramId) {
        const studentName = formatFullName(
          telegramUser.first_name,
          telegramUser.last_name
        );
        this.botService
          .notifyTeacherNewStudent(
            teacher.user.telegramId,
            studentName || "Новый ученик"
          )
          .catch((err) => {
            this.logger.warn(`Failed to notify teacher: ${err.message}`);
          });
      }
    }

    return {
      user: this.formatUser(user),
      roles,
      currentRole: "student" as UserRole,
      token,
      isNewConnection,
      teacher: {
        id: teacher.id,
        displayName: teacher.displayName,
      },
      parentInviteCode: studentProfile.parentInviteCode,
      parentInviteUrl: generateInviteUrl(studentProfile.parentInviteCode),
    };
  }

  /**
   * Присоединение родителя к ученику по P_xxx коду
   */
  private async joinAsParent(
    telegramUser: TelegramUser,
    parentInviteCode: string
  ) {
    const student = await this.studentProfileRepository.findOne({
      where: { parentInviteCode },
      relations: ["user", "teacherStudentLinks", "teacherStudentLinks.teacher"],
    });

    if (!student) {
      this.logger.warn(
        `JoinAsParent failed: student not found code=${parentInviteCode}`
      );
      throw new NotFoundException("STUDENT_NOT_FOUND");
    }

    let user = await this.findOrCreateUser(telegramUser);

    // Проверяем что у ученика есть хотя бы один учитель
    // (связь parent-student требует teacherId в текущей архитектуре)
    if (!student.teacherStudentLinks || student.teacherStudentLinks.length === 0) {
      this.logger.warn(
        `JoinAsParent failed: student has no teachers code=${parentInviteCode}`
      );
      throw new BadRequestException("STUDENT_HAS_NO_TEACHERS");
    }

    let parentProfile = user.parentProfile;
    if (!parentProfile) {
      parentProfile = (await this.createProfile(
        user.id,
        "parent",
        telegramUser
      )) as ParentProfile;
      user.parentProfile = parentProfile;
    }

    // Проверяем, есть ли хотя бы одна новая связь
    let isNewConnection = false;
    for (const link of student.teacherStudentLinks) {
      const result = await this.ensureParentStudentRelation(
        parentProfile.id,
        student.id,
        link.teacherId
      );
      if (result.isNew) {
        isNewConnection = true;
      }
    }

    const roles = this.getUserRoles(user);
    const token = this.generateToken(user, "parent");

    this.logger.log(
      `JoinAsParent: tg=${telegramUser.id} linked to student=${student.id}, isNewConnection=${isNewConnection}`
    );

    // Отправляем уведомление ТОЛЬКО если связь новая
    if (isNewConnection) {
      this.botService
        .notifyUserWelcome(telegramUser.id, "parent")
        .catch((err) => {
          this.logger.warn(
            `Failed to send welcome notification: ${err.message}`
          );
        });
    }

    return {
      user: this.formatUser(user),
      roles,
      currentRole: "parent" as UserRole,
      token,
      isNewConnection,
      student: {
        id: student.id,
        name: formatFullName(student.user.firstName, student.user.lastName),
      },
    };
  }

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================

  /**
   * Находит или создаёт пользователя по Telegram данным
   */
  private async findOrCreateUser(telegramUser: TelegramUser): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { telegramId: String(telegramUser.id) },
      relations: ["teacherProfile", "studentProfile", "parentProfile"],
    });

    if (!user) {
      const newUser = this.userRepository.create({
        telegramId: String(telegramUser.id),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
      });
      await this.userRepository.save(newUser);
      user = await this.userRepository.findOne({
        where: { id: newUser.id },
        relations: ["teacherProfile", "studentProfile", "parentProfile"],
      });
    }

    if (!user) {
      throw new UnauthorizedException("USER_NOT_FOUND");
    }

    return user;
  }

  /**
   * Создаёт связь учитель-ученик, если не существует
   * @returns { isNew: boolean } - true если связь была создана, false если уже существовала
   */
  private async ensureTeacherStudentLink(
    teacherId: string,
    studentId: string
  ): Promise<{ isNew: boolean }> {
    const existingLink = await this.teacherStudentLinkRepository.findOne({
      where: { teacherId, studentId },
    });

    if (!existingLink) {
      const link = this.teacherStudentLinkRepository.create({
        teacherId,
        studentId,
      });
      await this.teacherStudentLinkRepository.save(link);
      return { isNew: true };
    }

    return { isNew: false };
  }

  /**
   * Создаёт связь родитель-ученик-учитель, если не существует
   * @returns { isNew: boolean } - true если связь была создана, false если уже существовала
   */
  private async ensureParentStudentRelation(
    parentId: string,
    studentId: string,
    teacherId: string
  ): Promise<{ isNew: boolean }> {
    const existingRelation = await this.parentStudentRelationRepository.findOne(
      {
        where: { parentId, studentId, teacherId },
      }
    );

    if (!existingRelation) {
      const relation = this.parentStudentRelationRepository.create({
        parentId,
        studentId,
        teacherId,
        notificationsEnabled: true,
      });
      await this.parentStudentRelationRepository.save(relation);
      return { isNew: true };
    }

    return { isNew: false };
  }

  /**
   * Получает список ролей пользователя
   */
  private getUserRoles(user: User): UserRole[] {
    const roles: UserRole[] = [];
    if (user.teacherProfile) roles.push("teacher");
    if (user.studentProfile) roles.push("student");
    if (user.parentProfile) roles.push("parent");
    return roles;
  }

  /**
   * Получает профиль пользователя по роли
   */
  private getProfile(user: User, role: UserRole) {
    switch (role) {
      case "teacher":
        return user.teacherProfile;
      case "student":
        return user.studentProfile;
      case "parent":
        return user.parentProfile;
    }
  }

  /**
   * Создаёт профиль для указанной роли
   */
  private async createProfile(
    userId: string,
    role: UserRole,
    telegramUser: TelegramUser
  ) {
    switch (role) {
      case "teacher": {
        const profile = this.teacherProfileRepository.create({
          userId,
          displayName:
            formatFullName(telegramUser.first_name, telegramUser.last_name) ||
            "Учитель",
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

  /**
   * Генерирует JWT токен
   */
  private generateToken(user: any, role: UserRole): string {
    const profile = this.getProfile(user, role);
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: Number(user.telegramId),
      role,
      profileId: profile?.id || "",
      isBetaTester: user.isBetaTester || false,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Форматирует данные пользователя для ответа
   */
  private formatUser(user: User) {
    return {
      id: user.id,
      telegramId: Number(user.telegramId),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      isBetaTester: user.isBetaTester || false,
    };
  }

  /**
   * Форматирует профиль для ответа
   */
  private formatProfile(profile: any, role: UserRole) {
    if (role === "teacher") {
      return {
        id: profile.id,
        displayName: profile.displayName,
      };
    }
    return { id: profile.id };
  }

  /**
   * Soft delete аккаунта пользователя
   * Данные сохраняются 7 дней для возможности восстановления
   */
  async deleteAccount(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    this.logger.log(`DeleteAccount: soft delete for userId=${userId}`);

    // Устанавливаем дату удаления (soft delete)
    user.deletedAt = new Date();
    await this.userRepository.save(user);

    this.logger.log(`DeleteAccount: completed for userId=${userId}`);

    return {
      success: true,
      message: "Аккаунт помечен для удаления",
      deletedAt: user.deletedAt.toISOString(),
      restoreDays: this.ACCOUNT_RESTORE_DAYS,
    };
  }

  /**
   * Восстановление удалённого аккаунта
   */
  async restoreAccount(initData: string) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      throw new UnauthorizedException("INVALID_INIT_DATA");
    }

    // Ищем удалённого пользователя
    const user = await this.userRepository
      .createQueryBuilder("user")
      .withDeleted()
      .leftJoinAndSelect("user.teacherProfile", "teacherProfile")
      .leftJoinAndSelect("user.studentProfile", "studentProfile")
      .leftJoinAndSelect("user.parentProfile", "parentProfile")
      .where("user.telegramId = :telegramId", { telegramId: String(telegramUser.id) })
      .andWhere("user.deletedAt IS NOT NULL")
      .getOne();

    if (!user) {
      throw new NotFoundException("DELETED_USER_NOT_FOUND");
    }

    // Проверяем срок восстановления
    const deletedDate = new Date(user.deletedAt!);
    const now = new Date();
    const daysSinceDelete = Math.floor(
      (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelete >= this.ACCOUNT_RESTORE_DAYS) {
      throw new GoneException("RESTORE_PERIOD_EXPIRED");
    }

    // Восстанавливаем аккаунт
    user.deletedAt = null;
    await this.userRepository.save(user);

    const roles = this.getUserRoles(user);
    this.logger.log(`RestoreAccount: restored userId=${user.id} roles=${roles.join(",")}`);

    if (roles.length === 1) {
      const token = this.generateToken(user, roles[0]);
      return {
        success: true,
        message: "Аккаунт восстановлен",
        user: this.formatUser(user),
        roles,
        currentRole: roles[0],
        token,
      };
    }

    return {
      success: true,
      message: "Аккаунт восстановлен",
      user: this.formatUser(user),
      roles,
      currentRole: null,
      token: null,
    };
  }

  /**
   * Полное удаление данных пользователя (после истечения срока восстановления)
   */
  private async purgeDeletedUser(user: User) {
    this.logger.log(`PurgeDeletedUser: starting for userId=${user.id}`);

    // Загружаем профили если не загружены
    const fullUser = await this.userRepository
      .createQueryBuilder("user")
      .withDeleted()
      .leftJoinAndSelect("user.teacherProfile", "teacherProfile")
      .leftJoinAndSelect("user.studentProfile", "studentProfile")
      .leftJoinAndSelect("user.parentProfile", "parentProfile")
      .where("user.id = :id", { id: user.id })
      .getOne();

    if (!fullUser) return;

    // Удаляем данные учителя
    if (fullUser.teacherProfile) {
      const teacherId = fullUser.teacherProfile.id;
      this.logger.log(`PurgeDeletedUser: deleting teacher data for teacherId=${teacherId}`);

      await this.lessonRepository.delete({ teacherId });
      await this.lessonSeriesRepository.delete({ teacherId });
      await this.subjectRepository.delete({ teacherId });
      await this.subscriptionRepository.delete({ teacherId });
      await this.invitationRepository.delete({ teacherId });
      await this.teacherStudentLinkRepository.delete({ teacherId });
      await this.parentStudentRelationRepository.delete({ teacherId });
      await this.teacherProfileRepository.delete({ id: teacherId });
    }

    // Удаляем данные ученика
    if (fullUser.studentProfile) {
      const studentId = fullUser.studentProfile.id;
      this.logger.log(`PurgeDeletedUser: deleting student data for studentId=${studentId}`);

      await this.lessonStudentRepository.delete({ studentId });
      await this.lessonSeriesStudentRepository.delete({ studentId });
      await this.subscriptionRepository.delete({ studentId });
      await this.teacherStudentLinkRepository.delete({ studentId });
      await this.parentStudentRelationRepository.delete({ studentId });
      await this.studentProfileRepository.delete({ id: studentId });
    }

    // Удаляем данные родителя
    if (fullUser.parentProfile) {
      const parentId = fullUser.parentProfile.id;
      this.logger.log(`PurgeDeletedUser: deleting parent data for parentId=${parentId}`);

      await this.parentStudentRelationRepository.delete({ parentId });
      await this.parentProfileRepository.delete({ id: parentId });
    }

    // Удаляем настройки уведомлений
    await this.notificationSettingsRepository.delete({ userId: fullUser.id });

    // Удаляем события аналитики
    await this.analyticsEventRepository.delete({ userId: fullUser.id });

    // Полностью удаляем пользователя (hard delete)
    await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where("id = :id", { id: fullUser.id })
      .execute();

    this.logger.log(`PurgeDeletedUser: completed for userId=${fullUser.id}`);
  }
}
