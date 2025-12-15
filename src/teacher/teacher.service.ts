/**
 * Сервис для работы с функционалом учителя
 * Управление профилем, учениками, предметами, уроками
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, Between, IsNull } from "typeorm";
import { randomBytes } from "crypto";
import {
  TeacherProfile,
  StudentProfile,
  Subject,
  TeacherStudentLink,
  Lesson,
  LessonSeries,
  LessonStudent,
  LessonSeriesStudent,
  Invitation,
  ParentStudentRelation,
} from "../database/entities";
import { StatsService, DebtService } from "../shared";
import { LessonFilters } from "../shared/types";
import { generateInviteUrl, generateFallbackUrl } from "../shared/utils";
import { BotService } from "../bot/bot.service";

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(TeacherProfile)
    private teacherProfileRepo: Repository<TeacherProfile>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    @InjectRepository(TeacherStudentLink)
    private linkRepo: Repository<TeacherStudentLink>,
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(LessonSeries)
    private seriesRepo: Repository<LessonSeries>,
    @InjectRepository(LessonStudent)
    private lessonStudentRepo: Repository<LessonStudent>,
    @InjectRepository(LessonSeriesStudent)
    private seriesStudentRepo: Repository<LessonSeriesStudent>,
    @InjectRepository(Invitation)
    private invitationRepo: Repository<Invitation>,
    @InjectRepository(ParentStudentRelation)
    private parentRelationRepo: Repository<ParentStudentRelation>,
    @InjectRepository(StudentProfile)
    private studentProfileRepo: Repository<StudentProfile>,
    private statsService: StatsService,
    private debtService: DebtService,
    private botService: BotService
  ) {}

  // ============================================
  // ПРОФИЛЬ УЧИТЕЛЯ
  // ============================================

  /**
   * Получает профиль учителя по ID
   */
  async getProfile(teacherId: string) {
    const profile = await this.teacherProfileRepo.findOne({
      where: { id: teacherId },
      relations: ["user"],
    });
    if (!profile) throw new NotFoundException("TEACHER_NOT_FOUND");
    return {
      id: profile.id,
      displayName: profile.displayName,
      bio: profile.bio,
      referralCode: profile.referralCode,
      inviteUrl: generateInviteUrl(profile.referralCode),
      city: profile.user?.city,
      timezone: profile.user?.timezone,
    };
  }

  /**
   * Получает постоянную ссылку для приглашения учеников
   */
  async getInviteLink(teacherId: string) {
    const profile = await this.teacherProfileRepo.findOne({
      where: { id: teacherId },
    });
    if (!profile) throw new NotFoundException("TEACHER_NOT_FOUND");

    return {
      referralCode: profile.referralCode,
      inviteUrl: generateInviteUrl(profile.referralCode),
      fallbackUrl: generateFallbackUrl(profile.referralCode),
    };
  }

  /**
   * Обновляет профиль учителя
   */
  async updateProfile(
    teacherId: string,
    data: { displayName?: string; bio?: string }
  ) {
    await this.teacherProfileRepo.update({ id: teacherId }, data);
    return this.getProfile(teacherId);
  }

  // ============================================
  // ПРЕДМЕТЫ
  // ============================================

  /**
   * Получает список активных (неархивированных) предметов учителя
   */
  async getSubjects(teacherId: string) {
    return this.subjectRepo.find({
      where: { teacherId, archivedAt: IsNull() },
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Получает список архивированных предметов учителя
   */
  async getArchivedSubjects(teacherId: string) {
    const subjects = await this.subjectRepo.find({
      where: { teacherId },
      order: { archivedAt: "DESC" },
    });
    return subjects.filter((s) => s.archivedAt !== null);
  }

  /**
   * Создаёт новый предмет
   */
  async createSubject(
    teacherId: string,
    data: { name: string; code?: string; colorHex: string }
  ) {
    // Проверка на дубликат названия
    const existingByName = await this.subjectRepo.findOne({
      where: { teacherId, name: data.name },
    });
    if (existingByName) throw new ConflictException("SUBJECT_NAME_EXISTS");

    // Автогенерация code из name если не передан
    const code = data.code || this.generateCode(data.name);

    const existingByCode = await this.subjectRepo.findOne({
      where: { teacherId, code },
    });
    if (existingByCode) throw new ConflictException("SUBJECT_CODE_EXISTS");

    const subject = this.subjectRepo.create({
      name: data.name,
      code,
      colorHex: data.colorHex,
      teacherId,
    });
    return this.subjectRepo.save(subject);
  }

  private generateCode(name: string): string {
    // Транслитерация и очистка
    const translitMap: Record<string, string> = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
    };

    return name
      .toLowerCase()
      .split("")
      .map((char) => translitMap[char] || char)
      .join("")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 50);
  }

  /**
   * Обновляет предмет
   */
  async updateSubject(
    teacherId: string,
    subjectId: string,
    data: { name?: string; colorHex?: string }
  ) {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId, teacherId },
    });
    if (!subject) throw new NotFoundException("SUBJECT_NOT_FOUND");

    // Проверка на дубликат названия (если меняем name)
    if (data.name && data.name !== subject.name) {
      const existingByName = await this.subjectRepo.findOne({
        where: { teacherId, name: data.name },
      });
      if (existingByName) throw new ConflictException("SUBJECT_NAME_EXISTS");
    }

    await this.subjectRepo.update({ id: subjectId }, data);
    return this.subjectRepo.findOne({ where: { id: subjectId } });
  }

  /**
   * Удаляет предмет:
   * - Если нет уроков → полное удаление
   * - Если есть уроки → архивация
   */
  async deleteSubject(teacherId: string, subjectId: string) {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId, teacherId },
    });
    if (!subject) throw new NotFoundException("SUBJECT_NOT_FOUND");

    const lessonsCount = await this.lessonRepo.count({ where: { subjectId } });

    if (lessonsCount > 0) {
      // Есть уроки — архивируем
      subject.archivedAt = new Date();
      await this.subjectRepo.save(subject);
      return { success: true, action: "archived", lessonsCount };
    }

    // Нет уроков — удаляем полностью
    await this.subjectRepo.delete({ id: subjectId });
    return { success: true, action: "deleted" };
  }

  /**
   * Восстанавливает архивированный предмет
   */
  async restoreSubject(teacherId: string, subjectId: string) {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId, teacherId },
    });
    if (!subject) throw new NotFoundException("SUBJECT_NOT_FOUND");

    if (!subject.archivedAt) {
      throw new ConflictException("SUBJECT_NOT_ARCHIVED");
    }

    subject.archivedAt = null;
    await this.subjectRepo.save(subject);
    return { success: true };
  }

  // ============================================
  // УЧЕНИКИ
  // ============================================

  /**
   * Получает список всех учеников учителя
   */
  async getStudents(teacherId: string) {
    const links = await this.linkRepo.find({
      where: { teacherId },
      relations: ["student", "student.user"],
    });

    const allSubjects = await this.subjectRepo.find({ where: { teacherId } });

    const students = [];
    for (const link of links) {
      const stats = await this.statsService.getStudentStatsForTeacher(
        teacherId,
        link.studentId
      );
      const debt = await this.debtService.getStudentDebtForTeacher(
        teacherId,
        link.studentId
      );

      const lessonStudentRecords = await this.lessonStudentRepo.find({
        where: { studentId: link.studentId },
        relations: ["lesson"],
      });
      const teacherLessons = lessonStudentRecords.filter(
        (ls) => ls.lesson?.teacherId === teacherId
      );
      const uniqueSubjectIds = [
        ...new Set(teacherLessons.map((ls) => ls.lesson?.subjectId)),
      ];
      const subjects = allSubjects
        .filter((s) => uniqueSubjectIds.includes(s.id))
        .map((s) => ({
          subjectId: s.id,
          name: s.name,
          colorHex: s.colorHex,
        }));

      students.push({
        studentId: link.studentId,
        studentUser: this.formatUserInfo(link.student.user),
        customFields: link.customFields,
        subjects,
        stats,
        debt,
        createdAt: link.createdAt.toISOString(),
      });
    }

    return students;
  }

  /**
   * Получает детальную информацию об ученике
   */
  async getStudentDetails(teacherId: string, studentId: string) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
      relations: ["student", "student.user"],
    });

    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    const stats = await this.statsService.getStudentStatsForTeacher(
      teacherId,
      studentId
    );
    const debt = await this.debtService.getStudentDebtForTeacher(
      teacherId,
      studentId
    );

    return {
      studentId,
      studentUser: this.formatUserInfo(link.student.user),
      customFields: link.customFields || link.student.customFields,
      stats,
      debt,
      parentInvite: {
        code: link.student.parentInviteCode,
        url: generateInviteUrl(link.student.parentInviteCode),
      },
      createdAt: link.createdAt.toISOString(),
    };
  }

  /**
   * Обновляет кастомные поля ученика
   */
  async updateStudentCustomFields(
    teacherId: string,
    studentId: string,
    customFields: Record<string, string>
  ) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    link.customFields = customFields;
    await this.linkRepo.save(link);
    return this.getStudentDetails(teacherId, studentId);
  }

  /**
   * Удаляет связь с учеником
   */
  async deleteStudent(teacherId: string, studentId: string) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    await this.linkRepo.delete({ teacherId, studentId });
    return { success: true };
  }

  /**
   * Создаёт временное приглашение для ученика (legacy, используйте getInviteLink)
   */
  async createStudentInvitation(teacherId: string) {
    const token = "INV_" + randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = this.invitationRepo.create({
      type: "student",
      teacherId,
      token,
      expiresAt,
    });
    await this.invitationRepo.save(invitation);

    return {
      invitationId: invitation.id,
      token,
      inviteUrl: generateInviteUrl(token),
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  /**
   * Создаёт приглашение для родителя ученика (legacy)
   */
  async createParentInvitation(teacherId: string, studentId: string) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    const token = "PARENT_" + randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = this.invitationRepo.create({
      type: "parent",
      teacherId,
      studentId,
      token,
      expiresAt,
    });
    await this.invitationRepo.save(invitation);

    return {
      invitationId: invitation.id,
      token,
      inviteUrl: generateInviteUrl(token),
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  // ============================================
  // РОДИТЕЛИ УЧЕНИКОВ
  // ============================================

  /**
   * Получает список родителей ученика
   */
  async getStudentParents(teacherId: string, studentId: string) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    const relations = await this.parentRelationRepo.find({
      where: { teacherId, studentId },
      relations: ["parent", "parent.user"],
    });

    return relations.map((r) => ({
      parentId: r.parent.id,
      parentUser: this.formatUserInfo(r.parent.user),
      notificationsEnabled: r.notificationsEnabled,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Обновляет настройки уведомлений родителя
   */
  async updateParentNotifications(
    teacherId: string,
    studentId: string,
    parentId: string,
    notificationsEnabled: boolean
  ) {
    const relation = await this.parentRelationRepo.findOne({
      where: { teacherId, studentId, parentId },
    });
    if (!relation) throw new NotFoundException("PARENT_RELATION_NOT_FOUND");

    relation.notificationsEnabled = notificationsEnabled;
    await this.parentRelationRepo.save(relation);
    return { success: true, notificationsEnabled };
  }

  // ============================================
  // УРОКИ
  // ============================================

  /**
   * Получает уроки за период с фильтрацией
   */
  async getLessons(
    teacherId: string,
    from: string,
    to: string,
    filters?: LessonFilters
  ) {
    const whereClause: any = {
      teacherId,
      startAt: Between(new Date(from), new Date(to)),
    };
    if (filters?.subjectId) whereClause.subjectId = filters.subjectId;
    if (filters?.status) whereClause.status = filters.status;

    let lessons = await this.lessonRepo.find({
      where: whereClause,
      relations: [
        "subject",
        "lessonStudents",
        "lessonStudents.student",
        "lessonStudents.student.user",
      ],
      order: { startAt: "ASC" },
    });

    if (filters?.studentId) {
      lessons = lessons.filter((l) =>
        l.lessonStudents.some((ls) => ls.studentId === filters.studentId)
      );
    }

    return lessons.map((l) => this.formatLessonWithStudents(l));
  }

  /**
   * Получает детали урока
   */
  async getLessonDetails(teacherId: string, lessonId: string) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, teacherId },
      relations: [
        "subject",
        "series",
        "lessonStudents",
        "lessonStudents.student",
        "lessonStudents.student.user",
      ],
    });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    return {
      ...this.formatLessonWithStudents(lesson),
      series: lesson.series
        ? {
            id: lesson.series.id,
            recurrence: {
              frequency: lesson.series.frequency,
              dayOfWeek: lesson.series.dayOfWeek,
            },
          }
        : null,
    };
  }

  /**
   * Создаёт урок (разовый или серию)
   */
  async createLesson(teacherId: string, data: any) {
    const studentIds: string[] =
      data.studentIds || (data.studentId ? [data.studentId] : []);

    for (const studentId of studentIds) {
      const link = await this.linkRepo.findOne({
        where: { teacherId, studentId },
      });
      if (!link) throw new ForbiddenException("STUDENT_NOT_LINKED");
    }

    const subject = await this.subjectRepo.findOne({
      where: { id: data.subjectId, teacherId },
    });
    if (!subject) throw new NotFoundException("SUBJECT_NOT_FOUND");

    if (data.recurrence && data.recurrence.frequency !== "none") {
      return this.createRecurringLessons(teacherId, data);
    }

    const isFree = data.isFree || false;
    const priceRub = data.priceRub || 0;

    const lesson = this.lessonRepo.create({
      teacherId,
      subjectId: data.subjectId,
      startAt: new Date(data.startAt),
      durationMinutes: data.durationMinutes,
      priceRub,
      isFree,
      teacherNote: data.teacherNote,
      reminderMinutesBefore: data.reminderMinutesBefore,
    });
    const saved = await this.lessonRepo.save(lesson);

    for (const studentId of studentIds) {
      const lessonStudent = this.lessonStudentRepo.create({
        lessonId: saved.id,
        studentId,
        priceRub: isFree ? 0 : priceRub,
      });
      await this.lessonStudentRepo.save(lessonStudent);
    }

    // Отправляем уведомления ученикам о новом уроке
    await this.notifyStudentsAboutNewLesson(
      teacherId,
      studentIds,
      subject.name,
      new Date(data.startAt)
    );

    return this.getLessonWithDetails(saved.id);
  }

  /**
   * Создаёт серию повторяющихся уроков
   */
  private async createRecurringLessons(teacherId: string, data: any) {
    const startDate = new Date(data.startAt);
    const timeOfDay = startDate.toTimeString().slice(0, 5);
    const dayOfWeek = startDate.getDay();
    const studentIds: string[] =
      data.studentIds || (data.studentId ? [data.studentId] : []);
    const isFree = data.isFree || false;
    const priceRub = data.priceRub || 0;

    const series = new LessonSeries();
    series.teacherId = teacherId;
    series.subjectId = data.subjectId;
    series.frequency = data.recurrence.frequency;
    series.dayOfWeek = dayOfWeek;
    series.timeOfDay = timeOfDay;
    series.durationMinutes = data.durationMinutes;
    series.priceRub = priceRub;
    series.isFree = isFree;
    series.maxOccurrences = data.recurrence.count || 10;
    if (data.recurrence.endDate) {
      series.endDate = new Date(data.recurrence.endDate);
    }
    await this.seriesRepo.save(series);

    for (const studentId of studentIds) {
      const seriesStudent = this.seriesStudentRepo.create({
        seriesId: series.id,
        studentId,
        priceRub: isFree ? 0 : priceRub,
      });
      await this.seriesStudentRepo.save(seriesStudent);
    }

    const lessons: Lesson[] = [];
    let currentDate = new Date(startDate);
    const endDate = data.recurrence.endDate
      ? new Date(data.recurrence.endDate)
      : null;
    const maxCount = data.recurrence.count || (endDate ? 200 : 10);
    const intervalDays = data.recurrence.frequency === "biweekly" ? 14 : 7;

    while (lessons.length < maxCount) {
      if (endDate && currentDate > endDate) break;

      const lesson = this.lessonRepo.create({
        seriesId: series.id,
        teacherId,
        subjectId: data.subjectId,
        startAt: new Date(currentDate),
        durationMinutes: data.durationMinutes,
        priceRub,
        isFree,
        teacherNote: data.teacherNote,
        reminderMinutesBefore: data.reminderMinutesBefore,
      });
      await this.lessonRepo.save(lesson);

      for (const studentId of studentIds) {
        const lessonStudent = this.lessonStudentRepo.create({
          lessonId: lesson.id,
          studentId,
          priceRub: isFree ? 0 : priceRub,
        });
        await this.lessonStudentRepo.save(lessonStudent);
      }

      lessons.push(lesson);
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    return {
      series: {
        id: series.id,
        frequency: series.frequency,
        dayOfWeek: series.dayOfWeek,
        timeOfDay: series.timeOfDay,
      },
      lessonsCreated: lessons.length,
      lessons: lessons.map((l) => ({
        id: l.id,
        startAt: l.startAt.toISOString(),
        status: l.status,
      })),
    };
  }

  /**
   * Конвертирует одиночный урок в серию
   */
  private async convertToSeries(
    teacherId: string,
    existingLesson: Lesson,
    data: any
  ) {
    const startDate = data.startAt
      ? new Date(data.startAt)
      : existingLesson.startAt;
    const dayOfWeek = startDate.getDay();
    const timeOfDay = `${startDate
      .getHours()
      .toString()
      .padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;

    // Создаём серию
    const series = new LessonSeries();
    series.teacherId = teacherId;
    series.subjectId = data.subjectId ?? existingLesson.subjectId;
    series.frequency = data.recurrence.frequency;
    series.dayOfWeek = dayOfWeek;
    series.timeOfDay = timeOfDay;
    series.durationMinutes =
      data.durationMinutes ?? existingLesson.durationMinutes;
    series.priceRub = data.priceRub ?? existingLesson.priceRub;
    series.isFree = data.isFree ?? existingLesson.isFree;
    series.maxOccurrences = data.recurrence.count || 10;
    if (data.recurrence.endDate) {
      series.endDate = new Date(data.recurrence.endDate);
    }
    await this.seriesRepo.save(series);

    // Обновляем существующий урок - привязываем к серии
    existingLesson.seriesId = series.id;
    existingLesson.startAt = startDate;
    if (data.subjectId !== undefined) existingLesson.subjectId = data.subjectId;
    if (data.durationMinutes !== undefined)
      existingLesson.durationMinutes = data.durationMinutes;
    if (data.priceRub !== undefined) existingLesson.priceRub = data.priceRub;
    await this.lessonRepo.save(existingLesson);

    // Создаём дополнительные уроки
    const lessons: Lesson[] = [existingLesson];
    let currentDate = new Date(startDate);
    const endDate = data.recurrence.endDate
      ? new Date(data.recurrence.endDate)
      : null;
    // Если указан count - используем его, иначе если указан endDate - большой лимит, иначе 10
    const maxCount = data.recurrence.count || (endDate ? 200 : 10);
    const intervalDays = data.recurrence.frequency === "biweekly" ? 14 : 7;

    // Пропускаем первый урок (он уже есть)
    currentDate.setDate(currentDate.getDate() + intervalDays);

    while (lessons.length < maxCount) {
      if (endDate && currentDate > endDate) break;

      const lesson = this.lessonRepo.create({
        seriesId: series.id,
        teacherId,
        subjectId: data.subjectId ?? existingLesson.subjectId,
        startAt: new Date(currentDate),
        durationMinutes: data.durationMinutes ?? existingLesson.durationMinutes,
        priceRub: data.priceRub ?? existingLesson.priceRub,
      });
      await this.lessonRepo.save(lesson);
      lessons.push(lesson);

      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    return {
      series: {
        id: series.id,
        frequency: series.frequency,
      },
      lessonsCreated: lessons.length,
      lessons: lessons.map((l) => ({
        id: l.id,
        startAt: l.startAt.toISOString(),
        status: l.status,
      })),
    };
  }

  /**
   * Обновляет урок
   */
  async updateLesson(
    teacherId: string,
    lessonId: string,
    data: any,
    applyToSeries?: string
  ) {
    // DEBUG: логируем входящие данные
    console.log(`[updateLesson] lessonId: ${lessonId}`);
    console.log(`[updateLesson] applyToSeries: ${applyToSeries}`);
    console.log(`[updateLesson] data:`, JSON.stringify(data, null, 2));

    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, teacherId },
      relations: ["series"],
    });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    console.log(`[updateLesson] lesson.seriesId: ${lesson.seriesId}`);

    if (data.studentId !== undefined && data.studentId !== null) {
      const link = await this.linkRepo.findOne({
        where: { teacherId, studentId: data.studentId },
      });
      if (!link) throw new ForbiddenException("STUDENT_NOT_LINKED");
    }

    // Validate subjectId if provided
    if (data.subjectId !== undefined) {
      const subject = await this.subjectRepo.findOne({
        where: { id: data.subjectId, teacherId },
      });
      if (!subject) throw new NotFoundException("SUBJECT_NOT_FOUND");
    }

    // Если передан recurrence и урок не в серии - конвертируем в серию
    if (
      data.recurrence &&
      data.recurrence.frequency &&
      data.recurrence.frequency !== "none" &&
      !lesson.seriesId
    ) {
      return this.convertToSeries(teacherId, lesson, data);
    }

    // Fields that can be applied to series (shared across all lessons)
    const seriesUpdateData: any = {};
    if (data.subjectId !== undefined)
      seriesUpdateData.subjectId = data.subjectId;
    if (data.durationMinutes !== undefined)
      seriesUpdateData.durationMinutes = data.durationMinutes;
    if (data.isFree !== undefined) seriesUpdateData.isFree = data.isFree;
    if (data.priceRub !== undefined) seriesUpdateData.priceRub = data.priceRub;
    // If isFree is true, set priceRub to 0
    if (data.isFree === true) seriesUpdateData.priceRub = 0;

    // Fields that apply only to individual lesson
    const singleLessonData: any = { ...seriesUpdateData };
    if (data.startAt !== undefined)
      singleLessonData.startAt = new Date(data.startAt);
    if (data.status !== undefined) singleLessonData.status = data.status;
    if (data.attendance !== undefined)
      singleLessonData.attendance = data.attendance;
    if (data.paymentStatus !== undefined)
      singleLessonData.paymentStatus = data.paymentStatus;
    if (data.cancelledBy !== undefined)
      singleLessonData.cancelledBy = data.cancelledBy;
    if (data.rescheduledTo !== undefined)
      singleLessonData.rescheduledTo = data.rescheduledTo;
    if (data.teacherNote !== undefined) {
      singleLessonData.teacherNote = data.teacherNote;
      singleLessonData.teacherNoteUpdatedAt = new Date();
    }
    if (data.lessonReport !== undefined && !lesson.lessonReport) {
      singleLessonData.lessonReport = data.lessonReport;
    }
    if (data.studentNotePrivate !== undefined)
      singleLessonData.studentNotePrivate = data.studentNotePrivate;

    if (applyToSeries && applyToSeries !== "this" && lesson.seriesId) {
      console.log(`[updateLesson] Applying to series: ${applyToSeries}`);

      const whereClause: any = { seriesId: lesson.seriesId, teacherId };
      if (applyToSeries === "future") {
        whereClause.startAt = MoreThanOrEqual(lesson.startAt);
      }
      console.log(`[updateLesson] whereClause:`, whereClause);

      // Apply only series-safe fields to all lessons in series
      if (Object.keys(seriesUpdateData).length > 0) {
        console.log(`[updateLesson] seriesUpdateData:`, seriesUpdateData);
        await this.lessonRepo.update(whereClause, seriesUpdateData);
      } else {
        console.log(`[updateLesson] seriesUpdateData is empty`);
      }

      // Apply individual fields to current lesson only
      const individualFields: any = {};
      if (data.startAt !== undefined)
        individualFields.startAt = new Date(data.startAt);
      if (data.status !== undefined) individualFields.status = data.status;
      if (data.attendance !== undefined)
        individualFields.attendance = data.attendance;
      if (data.paymentStatus !== undefined)
        individualFields.paymentStatus = data.paymentStatus;
      if (data.teacherNote !== undefined) {
        individualFields.teacherNote = data.teacherNote;
        individualFields.teacherNoteUpdatedAt = new Date();
      }
      if (Object.keys(individualFields).length > 0) {
        await this.lessonRepo.update({ id: lessonId }, individualFields);
      }

      // Update series record if subject changed
      const seriesUpdate: any = {};
      if (data.subjectId !== undefined) seriesUpdate.subjectId = data.subjectId;
      if (Object.keys(seriesUpdate).length > 0) {
        await this.seriesRepo.update({ id: lesson.seriesId }, seriesUpdate);
      }

      // Update students for all lessons in series if studentIds provided
      if (data.studentIds && Array.isArray(data.studentIds)) {
        console.log(
          `[updateLesson] Updating students for series: ${data.studentIds}`
        );

        // Get all lessons in series that match the criteria
        const lessonsToUpdate = await this.lessonRepo.find({
          where: whereClause,
        });
        console.log(
          `[updateLesson] Found ${lessonsToUpdate.length} lessons to update students`
        );

        const priceRub = data.isFree ? 0 : data.priceRub ?? lesson.priceRub;

        // Get existing students from series BEFORE deleting
        const existingSeriesStudents = await this.seriesStudentRepo.find({
          where: { seriesId: lesson.seriesId },
        });
        const existingStudentIds = existingSeriesStudents.map(ss => ss.studentId);

        for (const lessonToUpdate of lessonsToUpdate) {
          // Delete existing lesson_student records for this lesson
          await this.lessonStudentRepo.delete({ lessonId: lessonToUpdate.id });

          // Create new lesson_student records for each student
          for (const studentId of data.studentIds) {
            const lessonStudent = this.lessonStudentRepo.create({
              lessonId: lessonToUpdate.id,
              studentId,
              priceRub,
            });
            await this.lessonStudentRepo.save(lessonStudent);
          }
        }

        // Also update lesson_series_student table
        await this.seriesStudentRepo.delete({ seriesId: lesson.seriesId });
        for (const studentId of data.studentIds) {
          const seriesStudent = this.seriesStudentRepo.create({
            seriesId: lesson.seriesId,
            studentId,
            priceRub,
          });
          await this.seriesStudentRepo.save(seriesStudent);
        }

        // Find NEW students (added, not existing before)
        const newStudentIds = data.studentIds.filter(
          (id: string) => !existingStudentIds.includes(id)
        );

        // Send notifications to new students
        if (newStudentIds.length > 0) {
          console.log(`[updateLesson] New students added to series: ${newStudentIds}`);
          const subject = await this.subjectRepo.findOne({
            where: { id: lesson.subjectId },
          });
          if (subject) {
            await this.notifyStudentsAboutNewLesson(
              teacherId,
              newStudentIds,
              subject.name,
              lesson.startAt
            );
          }
        }

        console.log(`[updateLesson] Students updated successfully`);
      }
    } else {
      await this.lessonRepo.update({ id: lessonId }, singleLessonData);

      // Update students for single lesson if studentIds provided
      if (data.studentIds && Array.isArray(data.studentIds)) {
        console.log(
          `[updateLesson] Updating students for single lesson: ${data.studentIds}`
        );

        const priceRub = data.isFree ? 0 : data.priceRub ?? lesson.priceRub;

        // Get existing students BEFORE deleting
        const existingLessonStudents = await this.lessonStudentRepo.find({
          where: { lessonId },
        });
        const existingStudentIds = existingLessonStudents.map(ls => ls.studentId);

        // Delete existing lesson_student records
        await this.lessonStudentRepo.delete({ lessonId });

        // Create new lesson_student records
        for (const studentId of data.studentIds) {
          const lessonStudent = this.lessonStudentRepo.create({
            lessonId,
            studentId,
            priceRub,
          });
          await this.lessonStudentRepo.save(lessonStudent);
        }

        // Find NEW students (added, not existing before)
        const newStudentIds = data.studentIds.filter(
          (id: string) => !existingStudentIds.includes(id)
        );

        // Send notifications to new students
        if (newStudentIds.length > 0) {
          console.log(`[updateLesson] New students added: ${newStudentIds}`);
          const subject = await this.subjectRepo.findOne({
            where: { id: lesson.subjectId },
          });
          if (subject) {
            await this.notifyStudentsAboutNewLesson(
              teacherId,
              newStudentIds,
              subject.name,
              lesson.startAt
            );
          }
        }

        console.log(`[updateLesson] Students updated for single lesson`);
      }
    }

    return this.getLessonWithDetails(lessonId);
  }

  /**
   * Удаляет урок
   */
  async deleteLesson(
    teacherId: string,
    lessonId: string,
    applyToSeries?: string
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, teacherId },
      relations: ["series"],
    });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    if (applyToSeries && applyToSeries !== "this" && lesson.seriesId) {
      const whereClause: any = { seriesId: lesson.seriesId, teacherId };
      if (applyToSeries === "future") {
        whereClause.startAt = MoreThanOrEqual(lesson.startAt);
      }
      await this.lessonRepo.delete(whereClause);
      if (applyToSeries === "all") {
        await this.seriesRepo.delete({ id: lesson.seriesId });
      }
    } else {
      await this.lessonRepo.delete({ id: lessonId });
    }

    return { success: true };
  }

  /**
   * Получает все серии уроков учителя
   */
  async getLessonSeries(teacherId: string) {
    const series = await this.seriesRepo.find({
      where: { teacherId },
      relations: [
        "seriesStudents",
        "seriesStudents.student",
        "seriesStudents.student.user",
        "subject",
      ],
      order: { createdAt: "ASC" },
    });

    const result = [];
    for (const s of series) {
      const lessonsCount = await this.lessonRepo.count({
        where: { seriesId: s.id },
      });
      const lessonsDone = await this.lessonRepo.count({
        where: { seriesId: s.id, status: "done" },
      });

      result.push({
        id: s.id,
        subjectId: s.subjectId,
        recurrence: {
          frequency: s.frequency,
          dayOfWeek: s.dayOfWeek,
          endDate: s.endDate?.toISOString(),
        },
        timeOfDay: s.timeOfDay,
        durationMinutes: s.durationMinutes,
        priceRub: s.priceRub,
        isFree: s.isFree,
        students: (s.seriesStudents || []).map((ss) => ({
          studentId: ss.studentId,
          firstName: ss.student?.user?.firstName,
          lastName: ss.student?.user?.lastName,
          priceRub: ss.priceRub,
        })),
        subject: {
          name: s.subject.name,
          colorHex: s.subject.colorHex,
        },
        lessonsCount,
        lessonsDone,
        lessonsRemaining: lessonsCount - lessonsDone,
      });
    }

    return result;
  }

  /**
   * Получает уроки конкретного ученика
   */
  async getStudentLessons(teacherId: string, studentId: string, filters?: any) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    const whereClause: any = { teacherId, studentId };
    if (filters?.status) whereClause.status = filters.status;
    if (filters?.paymentStatus)
      whereClause.paymentStatus = filters.paymentStatus;
    if (filters?.attendance) whereClause.attendance = filters.attendance;
    if (filters?.subjectId) whereClause.subjectId = filters.subjectId;

    const lessons = await this.lessonRepo.find({
      where: whereClause,
      relations: ["subject"],
      order: { startAt: "DESC" },
    });

    return lessons.map((l) => ({
      id: l.id,
      seriesId: l.seriesId,
      subjectId: l.subjectId,
      startAt: l.startAt.toISOString(),
      durationMinutes: l.durationMinutes,
      priceRub: l.priceRub,
      isFree: l.isFree,
      status: l.status,
      cancelledBy: l.cancelledBy,
      teacherNote: l.teacherNote,
      teacherNoteUpdatedAt: l.teacherNoteUpdatedAt?.toISOString() || null,
      lessonReport: l.lessonReport,
      studentNoteForTeacher: l.studentNoteForTeacher,
      subject: {
        name: l.subject.name,
        colorHex: l.subject.colorHex,
      },
    }));
  }

  /**
   * Получает детальную информацию о долге ученика
   */
  async getStudentDebtDetails(teacherId: string, studentId: string) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    return this.debtService.getStudentDebtDetailsForTeacher(
      teacherId,
      studentId
    );
  }

  /**
   * Получает краткую статистику ученика (для карточки)
   */
  async getStudentCardStats(teacherId: string, studentId: string) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    return this.statsService.getStudentCardStats(teacherId, studentId);
  }

  /**
   * Получает детальную статистику ученика
   */
  async getStudentDetailedStats(teacherId: string, studentId: string) {
    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new NotFoundException("STUDENT_NOT_FOUND");

    return this.statsService.getStudentDetailedStats(teacherId, studentId);
  }

  // ============================================
  // УПРАВЛЕНИЕ УЧЕНИКАМИ НА УРОКЕ
  // ============================================

  /**
   * Добавляет ученика на урок
   */
  async addStudentToLesson(
    teacherId: string,
    lessonId: string,
    studentId: string,
    priceRub?: number
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, teacherId },
    });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    const link = await this.linkRepo.findOne({
      where: { teacherId, studentId },
    });
    if (!link) throw new ForbiddenException("STUDENT_NOT_LINKED");

    const existing = await this.lessonStudentRepo.findOne({
      where: { lessonId, studentId },
    });
    if (existing) throw new ConflictException("STUDENT_ALREADY_ON_LESSON");

    const lessonStudent = this.lessonStudentRepo.create({
      lessonId,
      studentId,
      priceRub: lesson.isFree ? 0 : priceRub ?? lesson.priceRub,
    });
    await this.lessonStudentRepo.save(lessonStudent);

    // Отправляем уведомление ученику о добавлении на урок
    const subject = await this.subjectRepo.findOne({
      where: { id: lesson.subjectId },
    });
    if (subject) {
      await this.notifyStudentsAboutNewLesson(
        teacherId,
        [studentId],
        subject.name,
        lesson.startAt
      );
    }

    return this.getLessonWithDetails(lessonId);
  }

  /**
   * Удаляет ученика с урока
   */
  async removeStudentFromLesson(
    teacherId: string,
    lessonId: string,
    studentId: string
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, teacherId },
    });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    const lessonStudent = await this.lessonStudentRepo.findOne({
      where: { lessonId, studentId },
    });
    if (!lessonStudent) throw new NotFoundException("STUDENT_NOT_ON_LESSON");

    await this.lessonStudentRepo.delete({ lessonId, studentId });

    return this.getLessonWithDetails(lessonId);
  }

  /**
   * Обновляет данные ученика на уроке (например, статус оплаты)
   */
  async updateLessonStudent(
    teacherId: string,
    lessonId: string,
    studentId: string,
    data: { paymentStatus?: "paid" | "unpaid" }
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, teacherId },
    });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    const lessonStudent = await this.lessonStudentRepo.findOne({
      where: { lessonId, studentId },
    });
    if (!lessonStudent) throw new NotFoundException("STUDENT_NOT_ON_LESSON");

    if (data.paymentStatus !== undefined) {
      lessonStudent.paymentStatus = data.paymentStatus;
    }

    await this.lessonStudentRepo.save(lessonStudent);

    return { success: true, paymentStatus: lessonStudent.paymentStatus };
  }

  /**
   * Отмечает урок как проведённый с данными по каждому ученику
   */
  async completeLesson(
    teacherId: string,
    lessonId: string,
    studentsData: Array<{
      studentId: string;
      attendance: "attended" | "missed";
      rating?: number;
      paymentStatus?: "paid" | "unpaid";
    }>
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, teacherId },
    });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    for (const data of studentsData) {
      const lessonStudent = await this.lessonStudentRepo.findOne({
        where: { lessonId, studentId: data.studentId },
      });
      if (!lessonStudent) continue;

      lessonStudent.attendance = data.attendance;

      if (data.attendance === "missed") {
        lessonStudent.rating = null;
        lessonStudent.paymentStatus = "unpaid";
      } else {
        if (data.rating !== undefined) lessonStudent.rating = data.rating;
        if (data.paymentStatus !== undefined)
          lessonStudent.paymentStatus = data.paymentStatus;
      }

      await this.lessonStudentRepo.save(lessonStudent);
    }

    lesson.status = "done";
    await this.lessonRepo.save(lesson);

    return this.getLessonWithDetails(lessonId);
  }

  /**
   * Массовое обновление учеников на уроке
   */
  async bulkUpdateLessonStudents(
    teacherId: string,
    lessonId: string,
    action: "set_attendance" | "set_rating" | "set_payment",
    value: string | number
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, teacherId },
    });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    const lessonStudents = await this.lessonStudentRepo.find({
      where: { lessonId },
    });

    for (const ls of lessonStudents) {
      switch (action) {
        case "set_attendance":
          ls.attendance = value as string;
          if (value === "missed") {
            ls.rating = null;
            ls.paymentStatus = "unpaid";
          }
          break;
        case "set_rating":
          if (ls.attendance === "attended") {
            ls.rating = value as number;
          }
          break;
        case "set_payment":
          if (ls.attendance === "attended") {
            ls.paymentStatus = value as string;
          }
          break;
      }
      await this.lessonStudentRepo.save(ls);
    }

    return this.getLessonWithDetails(lessonId);
  }

  // ============================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ============================================

  private async getLessonWithDetails(lessonId: string) {
    const full = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: [
        "subject",
        "lessonStudents",
        "lessonStudents.student",
        "lessonStudents.student.user",
      ],
    });

    if (!full) throw new NotFoundException("LESSON_NOT_FOUND");
    return this.formatLessonWithStudents(full);
  }

  private formatLessonWithStudents(lesson: Lesson) {
    const studentsCount = lesson.lessonStudents?.length || 0;

    return {
      id: lesson.id,
      seriesId: lesson.seriesId,
      teacherId: lesson.teacherId,
      subjectId: lesson.subjectId,
      startAt: lesson.startAt.toISOString(),
      durationMinutes: lesson.durationMinutes,
      priceRub: lesson.priceRub,
      isFree: lesson.isFree,
      status: lesson.status,
      isGroupLesson: studentsCount > 1,
      cancelledBy: lesson.cancelledBy,
      rescheduledTo: lesson.rescheduledTo,
      teacherNote: lesson.teacherNote,
      teacherNoteUpdatedAt: lesson.teacherNoteUpdatedAt?.toISOString() || null,
      lessonReport: lesson.lessonReport,
      studentNotePrivate: lesson.studentNotePrivate,
      studentNoteForTeacher: lesson.studentNoteForTeacher,
      reminderMinutesBefore: lesson.reminderMinutesBefore,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
      students: (lesson.lessonStudents || []).map((ls) => ({
        id: ls.id,
        studentId: ls.studentId,
        firstName: ls.student?.user?.firstName,
        lastName: ls.student?.user?.lastName,
        username: ls.student?.user?.username,
        priceRub: ls.priceRub,
        attendance: ls.attendance,
        rating: ls.rating,
        paymentStatus: ls.paymentStatus,
      })),
      subject: lesson.subject
        ? {
            name: lesson.subject.name,
            colorHex: lesson.subject.colorHex,
          }
        : null,
    };
  }

  private formatLesson(lesson: Lesson) {
    return {
      id: lesson.id,
      seriesId: lesson.seriesId,
      teacherId: lesson.teacherId,
      subjectId: lesson.subjectId,
      startAt: lesson.startAt.toISOString(),
      durationMinutes: lesson.durationMinutes,
      priceRub: lesson.priceRub,
      isFree: lesson.isFree,
      status: lesson.status,
      cancelledBy: lesson.cancelledBy,
      rescheduledTo: lesson.rescheduledTo,
      teacherNote: lesson.teacherNote,
      teacherNoteUpdatedAt: lesson.teacherNoteUpdatedAt?.toISOString() || null,
      lessonReport: lesson.lessonReport,
      studentNotePrivate: lesson.studentNotePrivate,
      studentNoteForTeacher: lesson.studentNoteForTeacher,
      reminderMinutesBefore: lesson.reminderMinutesBefore,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    };
  }

  private formatUserInfo(user: any) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    };
  }

  /**
   * Отправляет уведомления ученикам о создании нового урока
   */
  private async notifyStudentsAboutNewLesson(
    teacherId: string,
    studentIds: string[],
    subjectName: string,
    startAt: Date
  ): Promise<void> {
    if (studentIds.length === 0) return;

    // Получаем учителя с user для имени и timezone
    const teacher = await this.teacherProfileRepo.findOne({
      where: { id: teacherId },
      relations: ["user"],
    });
    const teacherName = teacher?.displayName || teacher?.user?.firstName || "Учитель";
    
    // Используем timezone учителя или Moscow по умолчанию
    const timezone = teacher?.user?.timezone || "Europe/Moscow";

    // Форматируем дату и время в timezone учителя
    const dateStr = startAt.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: timezone,
    });
    const timeStr = startAt.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    });

    // Отправляем уведомление каждому ученику
    for (const studentId of studentIds) {
      const student = await this.studentProfileRepo.findOne({
        where: { id: studentId },
        relations: ["user"],
      });

      if (!student?.user) continue;

      // Отправляем через BotService (он сам проверит настройки)
      await this.botService.notifyLessonCreated(student.user.id, {
        subject: subjectName,
        date: dateStr,
        time: timeStr,
        teacherName,
      });
    }
  }
}
