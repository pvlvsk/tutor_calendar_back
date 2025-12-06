/**
 * Сервис авторизации
 * Управляет регистрацией, аутентификацией и связыванием пользователей
 */

import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, BadRequestException, GoneException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { TelegramService, TelegramUser } from './telegram.service';
import {
  User,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
  Invitation,
  TeacherStudentLink,
  ParentStudentRelation,
} from '../database/entities';
import { generateInviteUrl, formatFullName, getBotUsername } from '../shared/utils';

type UserRole = 'teacher' | 'student' | 'parent';

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
    private jwtService: JwtService,
    private telegramService: TelegramService,
  ) {}

  // ============================================
  // ОСНОВНЫЕ МЕТОДЫ АВТОРИЗАЦИИ
  // ============================================

  /**
   * Инициализация пользователя через Telegram initData
   * Проверяет существует ли пользователь и возвращает его данные или информацию для регистрации
   */
  async init(initData: string) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      this.logger.warn(`Init failed: invalid initData`);
      throw new UnauthorizedException('INVALID_INIT_DATA');
    }

    this.logger.log(`Init: tg=${telegramUser.id} @${telegramUser.username || 'no_username'}`);

    const user = await this.userRepository.findOne({
      where: { telegramId: String(telegramUser.id) },
      relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
    });

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

    const roles = this.getUserRoles(user);
    this.logger.log(`Init: existing user tg=${telegramUser.id} roles=${roles.join(',')}`);

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
  async register(initData: string, role: UserRole) {
    const telegramUser = this.telegramService.validateInitData(initData);
    if (!telegramUser) {
      this.logger.warn(`Register failed: invalid initData`);
      throw new UnauthorizedException('INVALID_INIT_DATA');
    }

    const existing = await this.userRepository.findOne({
      where: { telegramId: String(telegramUser.id) },
    });

    if (existing) {
      this.logger.warn(`Register failed: user exists tg=${telegramUser.id}`);
      throw new ConflictException('USER_EXISTS');
    }

    const user = this.userRepository.create({
      telegramId: String(telegramUser.id),
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
    });
    await this.userRepository.save(user);

    const profile = await this.createProfile(user.id, role, telegramUser);
    const userWithProfile = { ...user, [`${role}Profile`]: profile };
    const token = this.generateToken(userWithProfile, role);

    this.logger.log(`Register: tg=${telegramUser.id} role=${role} userId=${user.id}`);

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
      throw new UnauthorizedException('INVALID_INIT_DATA');
    }

    const user = await this.userRepository.findOne({
      where: { telegramId: String(telegramUser.id) },
      relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
    });

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    const roles = this.getUserRoles(user);
    if (!roles.includes(role)) {
      throw new ForbiddenException('ROLE_NOT_AVAILABLE');
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
      relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
    });

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    const roles = this.getUserRoles(user);
    if (roles.includes(role)) {
      throw new ConflictException('ROLE_EXISTS');
    }

    const profile = await this.createProfile(userId, role, {
      id: Number(user.telegramId),
      first_name: user.firstName || undefined,
      last_name: user.lastName || undefined,
      username: user.username || undefined,
    });

    return {
      user: this.formatUser(user),
      roles: [...roles, role],
      newRole: role,
      profile: this.formatProfile(profile, role),
      message: `Роль '${role}' успешно добавлена`,
    };
  }

  /**
   * Получение информации о текущем пользователе
   */
  async getMe(userId: string, role: UserRole) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
    });

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
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
      relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
    });

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
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
  async setBetaTester(userId: string, isBetaTester: boolean, adminCode?: string) {
    const validAdminCode = process.env.ADMIN_CODE || 'admin_secret_code';
    
    if (adminCode !== validAdminCode) {
      this.logger.warn(`SetBetaTester failed: invalid admin code for user=${userId}`);
      throw new ForbiddenException('INVALID_ADMIN_CODE');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    user.isBetaTester = isBetaTester;
    await this.userRepository.save(user);

    this.logger.log(`SetBetaTester: user=${userId} isBetaTester=${isBetaTester}`);

    return {
      userId: user.id,
      isBetaTester: user.isBetaTester,
      message: isBetaTester ? 'Бета-тестер активирован' : 'Бета-тестер деактивирован',
    };
  }

  /**
   * Активация бета-тестера по коду (для самостоятельной активации)
   */
  async activateBetaTester(userId: string, betaCode: string) {
    const validBetaCode = process.env.BETA_CODE || 'beta_2025';
    
    if (betaCode !== validBetaCode) {
      this.logger.warn(`ActivateBetaTester failed: invalid code for user=${userId}`);
      throw new BadRequestException('INVALID_BETA_CODE');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    if (user.isBetaTester) {
      return {
        userId: user.id,
        isBetaTester: true,
        message: 'Вы уже бета-тестер',
      };
    }

    user.isBetaTester = true;
    await this.userRepository.save(user);

    this.logger.log(`ActivateBetaTester: user=${userId} activated`);

    return {
      userId: user.id,
      isBetaTester: true,
      message: 'Добро пожаловать в программу бета-тестирования!',
    };
  }

  // ============================================
  // ПРИГЛАШЕНИЯ (LEGACY - временные ссылки)
  // ============================================

  /**
   * Принятие временного приглашения
   * @deprecated Используйте joinByReferral с постоянными ссылками
   */
  async acceptInvitation(initData: string | null, invitationToken: string, userId?: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token: invitationToken },
      relations: ['teacher', 'teacher.user'],
    });

    if (!invitation) {
      throw new BadRequestException('INVALID_INVITATION');
    }

    if (invitation.usedAt) {
      throw new GoneException('INVITATION_USED');
    }

    if (new Date() > invitation.expiresAt) {
      throw new GoneException('INVITATION_EXPIRED');
    }

    let user: User | null = null;
    let telegramUser: TelegramUser | null = null;

    if (userId) {
      user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
      });
    } else if (initData) {
      telegramUser = this.telegramService.validateInitData(initData);
      if (!telegramUser) {
        throw new UnauthorizedException('INVALID_INIT_DATA');
      }

      user = await this.userRepository.findOne({
        where: { telegramId: String(telegramUser.id) },
        relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
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
          relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    const role = invitation.type as UserRole;
    let profile = this.getProfile(user, role);

    if (!profile) {
      profile = await this.createProfile(user.id, role, telegramUser || {
        id: Number(user.telegramId),
        first_name: user.firstName || undefined,
        last_name: user.lastName || undefined,
        username: user.username || undefined,
      });
      (user as any)[`${role}Profile`] = profile;
    }

    if (role === 'student' && profile) {
      const existingLink = await this.teacherStudentLinkRepository.findOne({
        where: { teacherId: invitation.teacherId, studentId: profile.id },
      });
      if (!existingLink) {
        const link = this.teacherStudentLinkRepository.create({
          teacherId: invitation.teacherId,
          studentId: profile.id,
        });
        await this.teacherStudentLinkRepository.save(link);
      }
    } else if (role === 'parent' && invitation.studentId && profile) {
      const existingRelation = await this.parentStudentRelationRepository.findOne({
        where: { parentId: profile.id, studentId: invitation.studentId, teacherId: invitation.teacherId },
      });
      if (!existingRelation) {
        const relation = this.parentStudentRelationRepository.create({
          parentId: profile.id,
          studentId: invitation.studentId,
          teacherId: invitation.teacherId,
          notificationsEnabled: true,
        });
        await this.parentStudentRelationRepository.save(relation);
      }
    }

    invitation.usedAt = new Date();
    await this.invitationRepository.save(invitation);

    const roles = this.getUserRoles(user);
    const token = this.generateToken(user, role);

    return {
      user: this.formatUser(user),
      roles,
      currentRole: role,
      token,
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
      throw new UnauthorizedException('INVALID_INIT_DATA');
    }

    this.logger.log(`Join: tg=${telegramUser.id} code=${referralCode}`);

    if (referralCode.startsWith('T_')) {
      return this.joinTeacher(telegramUser, referralCode);
    } else if (referralCode.startsWith('P_')) {
      return this.joinAsParent(telegramUser, referralCode);
    } else {
      this.logger.warn(`Join failed: invalid code format code=${referralCode}`);
      throw new BadRequestException('INVALID_REFERRAL_CODE');
    }
  }

  /**
   * Присоединение ученика к учителю по T_xxx коду
   */
  private async joinTeacher(telegramUser: TelegramUser, referralCode: string) {
    const teacher = await this.teacherProfileRepository.findOne({
      where: { referralCode },
      relations: ['user'],
    });

    if (!teacher) {
      this.logger.warn(`JoinTeacher failed: teacher not found code=${referralCode}`);
      throw new NotFoundException('TEACHER_NOT_FOUND');
    }

    let user = await this.findOrCreateUser(telegramUser);

    let studentProfile = user.studentProfile;
    if (!studentProfile) {
      studentProfile = await this.createProfile(user.id, 'student', telegramUser) as StudentProfile;
      user.studentProfile = studentProfile;
    }

    await this.ensureTeacherStudentLink(teacher.id, studentProfile.id);

    const roles = this.getUserRoles(user);
    const token = this.generateToken(user, 'student');

    this.logger.log(`JoinTeacher: tg=${telegramUser.id} linked to teacher=${teacher.id}`);

    const botUsername = getBotUsername();
    return {
      user: this.formatUser(user),
      roles,
      currentRole: 'student' as UserRole,
      token,
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
  private async joinAsParent(telegramUser: TelegramUser, parentInviteCode: string) {
    const student = await this.studentProfileRepository.findOne({
      where: { parentInviteCode },
      relations: ['user', 'teacherStudentLinks', 'teacherStudentLinks.teacher'],
    });

    if (!student) {
      this.logger.warn(`JoinAsParent failed: student not found code=${parentInviteCode}`);
      throw new NotFoundException('STUDENT_NOT_FOUND');
    }

    let user = await this.findOrCreateUser(telegramUser);

    let parentProfile = user.parentProfile;
    if (!parentProfile) {
      parentProfile = await this.createProfile(user.id, 'parent', telegramUser) as ParentProfile;
      user.parentProfile = parentProfile;
    }

    for (const link of student.teacherStudentLinks) {
      await this.ensureParentStudentRelation(parentProfile.id, student.id, link.teacherId);
    }

    const roles = this.getUserRoles(user);
    const token = this.generateToken(user, 'parent');

    this.logger.log(`JoinAsParent: tg=${telegramUser.id} linked to student=${student.id}`);

    return {
      user: this.formatUser(user),
      roles,
      currentRole: 'parent' as UserRole,
      token,
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
      relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
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
        relations: ['teacherProfile', 'studentProfile', 'parentProfile'],
      });
    }

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Создаёт связь учитель-ученик, если не существует
   */
  private async ensureTeacherStudentLink(teacherId: string, studentId: string) {
    const existingLink = await this.teacherStudentLinkRepository.findOne({
      where: { teacherId, studentId },
    });

    if (!existingLink) {
      const link = this.teacherStudentLinkRepository.create({
        teacherId,
        studentId,
      });
      await this.teacherStudentLinkRepository.save(link);
    }
  }

  /**
   * Создаёт связь родитель-ученик-учитель, если не существует
   */
  private async ensureParentStudentRelation(parentId: string, studentId: string, teacherId: string) {
    const existingRelation = await this.parentStudentRelationRepository.findOne({
      where: { parentId, studentId, teacherId },
    });

    if (!existingRelation) {
      const relation = this.parentStudentRelationRepository.create({
        parentId,
        studentId,
        teacherId,
        notificationsEnabled: true,
      });
      await this.parentStudentRelationRepository.save(relation);
    }
  }

  /**
   * Получает список ролей пользователя
   */
  private getUserRoles(user: User): UserRole[] {
    const roles: UserRole[] = [];
    if (user.teacherProfile) roles.push('teacher');
    if (user.studentProfile) roles.push('student');
    if (user.parentProfile) roles.push('parent');
    return roles;
  }

  /**
   * Получает профиль пользователя по роли
   */
  private getProfile(user: User, role: UserRole) {
    switch (role) {
      case 'teacher': return user.teacherProfile;
      case 'student': return user.studentProfile;
      case 'parent': return user.parentProfile;
    }
  }

  /**
   * Создаёт профиль для указанной роли
   */
  private async createProfile(userId: string, role: UserRole, telegramUser: TelegramUser) {
    switch (role) {
      case 'teacher': {
        const profile = this.teacherProfileRepository.create({
          userId,
          displayName: formatFullName(telegramUser.first_name, telegramUser.last_name) || 'Учитель',
          referralCode: generateReferralCode('T'),
        });
        return this.teacherProfileRepository.save(profile);
      }
      case 'student': {
        const profile = this.studentProfileRepository.create({ 
          userId,
          parentInviteCode: generateReferralCode('P'),
        });
        return this.studentProfileRepository.save(profile);
      }
      case 'parent': {
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
      profileId: profile?.id || '',
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
    if (role === 'teacher') {
      return {
        id: profile.id,
        displayName: profile.displayName,
      };
    }
    return { id: profile.id };
  }
}
