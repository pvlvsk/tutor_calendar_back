/**
 * Сервис для работы с функционалом родителя
 * Просмотр информации о детях, их уроках и статистике
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import {
  ParentProfile,
  ParentStudentRelation,
  TeacherStudentLink,
  Lesson,
  LessonStudent,
  StudentProfile,
  TeacherProfile,
  Subject,
} from "../database/entities";
import { StatsService, DebtService } from "../shared";
import { LessonFilters } from "../shared/types";

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(ParentProfile)
    private parentProfileRepo: Repository<ParentProfile>,
    @InjectRepository(ParentStudentRelation)
    private relationRepo: Repository<ParentStudentRelation>,
    @InjectRepository(TeacherStudentLink)
    private linkRepo: Repository<TeacherStudentLink>,
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(LessonStudent)
    private lessonStudentRepo: Repository<LessonStudent>,
    @InjectRepository(StudentProfile)
    private studentProfileRepo: Repository<StudentProfile>,
    @InjectRepository(TeacherProfile)
    private teacherProfileRepo: Repository<TeacherProfile>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    private statsService: StatsService,
    private debtService: DebtService
  ) {}

  // ============================================
  // ПРОФИЛЬ РОДИТЕЛЯ
  // ============================================

  /**
   * Получает профиль родителя
   */
  async getProfile(parentId: string) {
    const profile = await this.parentProfileRepo.findOne({
      where: { id: parentId },
      relations: ["user"],
    });
    if (!profile) throw new NotFoundException("PARENT_NOT_FOUND");

    return {
      id: profile.id,
      userId: profile.userId,
      user: {
        telegramId: profile.user.telegramId ? Number(profile.user.telegramId) : null,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        username: profile.user.username,
      },
      customFields: profile.customFields,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  /**
   * Обновляет профиль родителя
   */
  async updateProfile(parentId: string, customFields: Record<string, string>) {
    const profile = await this.parentProfileRepo.findOne({
      where: { id: parentId },
    });
    if (!profile) throw new NotFoundException("PARENT_NOT_FOUND");

    profile.customFields = customFields;
    await this.parentProfileRepo.save(profile);
    return this.getProfile(parentId);
  }

  // ============================================
  // ДЕТИ
  // ============================================

  /**
   * Получает список детей родителя
   */
  async getChildren(parentId: string) {
    const relations = await this.relationRepo.find({
      where: { parentId },
      relations: ["student", "student.user", "teacher"],
    });

    const childMap = new Map<string, any>();

    for (const rel of relations) {
      if (!childMap.has(rel.studentId)) {
        const stats = await this.statsService.getDetailedStatsForStudent(
          rel.studentId
        );
        childMap.set(rel.studentId, {
          childId: rel.studentId,
          childUser: this.formatUserInfo(rel.student.user),
          teachers: [],
          stats: stats.total,
          notificationsEnabled: rel.notificationsEnabled,
        });
      }

      childMap.get(rel.studentId).teachers.push({
        teacherId: rel.teacherId,
        teacherName: rel.teacher.displayName,
      });
    }

    return Array.from(childMap.values());
  }

  /**
   * Получает детальную информацию о ребёнке
   */
  async getChildDetails(parentId: string, childId: string) {
    const relation = await this.relationRepo.findOne({
      where: { parentId, studentId: childId },
    });
    if (!relation) throw new ForbiddenException("NOT_YOUR_CHILD");

    const student = await this.studentProfileRepo.findOne({
      where: { id: childId },
      relations: ["user"],
    });
    if (!student) throw new NotFoundException("CHILD_NOT_FOUND");

    const teachers = await this.getChildTeachers(parentId, childId);
    const stats = await this.statsService.getDetailedStatsForStudent(childId);
    const debt = await this.debtService.getTotalDebtForStudent(childId);

    return {
      childId,
      childUser: this.formatUserInfo(student.user),
      teachers,
      stats,
      debt,
      notificationsEnabled: relation.notificationsEnabled,
    };
  }

  /**
   * Получает учителей ребёнка
   */
  async getChildTeachers(parentId: string, childId: string) {
    const relations = await this.relationRepo.find({
      where: { parentId, studentId: childId },
      relations: ["teacher", "teacher.user"],
    });

    if (relations.length === 0) throw new ForbiddenException("NOT_YOUR_CHILD");

    const result = [];
    for (const rel of relations) {
      const subjects = await this.subjectRepo.find({
        where: { teacherId: rel.teacherId },
      });

      const statsWithTeacher =
        await this.statsService.getStatsForStudentWithTeacher(
          childId,
          rel.teacherId
        );

      result.push({
        teacherId: rel.teacherId,
        teacherUser: this.formatUserInfo(rel.teacher.user),
        displayName: rel.teacher.displayName,
        bio: rel.teacher.bio,
        subjects: subjects.map((s) => ({
          subjectId: s.id,
          name: s.name,
          colorHex: s.colorHex,
        })),
        statsWithTeacher,
      });
    }

    return result;
  }

  /**
   * Получает детальную информацию об учителе ребёнка
   */
  async getChildTeacherDetails(
    parentId: string,
    childId: string,
    teacherId: string
  ) {
    const relation = await this.relationRepo.findOne({
      where: { parentId, studentId: childId, teacherId },
    });
    if (!relation) throw new ForbiddenException("NOT_YOUR_CHILD");

    const teacher = await this.teacherProfileRepo.findOne({
      where: { id: teacherId },
      relations: ["user"],
    });
    if (!teacher) throw new NotFoundException("TEACHER_NOT_FOUND");

    const subjects = await this.subjectRepo.find({
      where: { teacherId },
    });

    const statsWithTeacher =
      await this.statsService.getStatsForStudentWithTeacher(childId, teacherId);
    const debt = await this.debtService.getDebtForStudentByTeacher(
      childId,
      teacherId
    );

    return {
      teacherId,
      teacherUser: this.formatUserInfo(teacher.user),
      displayName: teacher.displayName,
      bio: teacher.bio,
      subjects: subjects.map((s) => ({
        subjectId: s.id,
        name: s.name,
        colorHex: s.colorHex,
      })),
      statsWithTeacher,
      debt,
    };
  }

  // ============================================
  // УРОКИ РЕБЁНКА
  // ============================================

  /**
   * Получает уроки ребёнка за период
   */
  async getChildLessons(
    parentId: string,
    childId: string,
    from: string,
    to: string,
    filters?: LessonFilters
  ) {
    const relation = await this.relationRepo.findOne({
      where: { parentId, studentId: childId },
    });
    if (!relation) throw new ForbiddenException("NOT_YOUR_CHILD");

    const lessonStudents = await this.lessonStudentRepo.find({
      where: { studentId: childId },
      relations: [
        "lesson",
        "lesson.teacher",
        "lesson.teacher.user",
        "lesson.subject",
        "lesson.lessonStudents",
      ],
    });

    let lessons = lessonStudents
      .filter((ls) => ls.lesson)
      .filter((ls) => {
        const startAt = new Date(ls.lesson.startAt);
        return startAt >= new Date(from) && startAt <= new Date(to);
      });

    if (filters?.subjectId) {
      lessons = lessons.filter(
        (ls) => ls.lesson.subjectId === filters.subjectId
      );
    }
    if (filters?.teacherId) {
      lessons = lessons.filter(
        (ls) => ls.lesson.teacherId === filters.teacherId
      );
    }
    if (filters?.status) {
      lessons = lessons.filter((ls) => ls.lesson.status === filters.status);
    }

    lessons.sort(
      (a, b) =>
        new Date(a.lesson.startAt).getTime() -
        new Date(b.lesson.startAt).getTime()
    );

    return lessons.map((ls) => {
      const totalStudentsCount = ls.lesson.lessonStudents?.length || 1;
      const otherStudentsCount = Math.max(0, totalStudentsCount - 1);

      return {
        id: ls.lesson.id,
        teacherId: ls.lesson.teacherId,
        subjectId: ls.lesson.subjectId,
        startAt: ls.lesson.startAt.toISOString(),
        durationMinutes: ls.lesson.durationMinutes,
        priceRub: ls.priceRub,
        status: ls.lesson.status,
        attendance: ls.attendance,
        paymentStatus: ls.paymentStatus,
        teacherNote: ls.lesson.teacherNote,
        lessonReport: ls.lesson.lessonReport,
        isGroupLesson: totalStudentsCount > 1,
        totalStudentsCount,
        otherStudentsCount,
        teacher: {
          firstName: ls.lesson.teacher?.user?.firstName,
          lastName: ls.lesson.teacher?.user?.lastName,
        },
        subject: {
          name: ls.lesson.subject?.name,
          colorHex: ls.lesson.subject?.colorHex,
        },
      };
    });
  }

  /**
   * Получает детали урока ребёнка
   */
  async getChildLessonDetails(
    parentId: string,
    childId: string,
    lessonId: string
  ) {
    const relation = await this.relationRepo.findOne({
      where: { parentId, studentId: childId },
    });
    if (!relation) throw new ForbiddenException("NOT_YOUR_CHILD");

    const lessonStudent = await this.lessonStudentRepo.findOne({
      where: { lessonId, studentId: childId },
      relations: [
        "lesson",
        "lesson.teacher",
        "lesson.teacher.user",
        "lesson.subject",
        "lesson.lessonStudents",
      ],
    });
    if (!lessonStudent) throw new NotFoundException("LESSON_NOT_FOUND");

    const lesson = lessonStudent.lesson;
    const totalStudentsCount = lesson.lessonStudents?.length || 1;
    const otherStudentsCount = Math.max(0, totalStudentsCount - 1);

    return {
      id: lesson.id,
      teacherId: lesson.teacherId,
      subjectId: lesson.subjectId,
      startAt: lesson.startAt.toISOString(),
      durationMinutes: lesson.durationMinutes,
      priceRub: lessonStudent.priceRub,
      status: lesson.status,
      attendance: lessonStudent.attendance,
      paymentStatus: lessonStudent.paymentStatus,
      rating: lessonStudent.rating,
      teacherNote: lesson.teacherNote,
      lessonReport: lesson.lessonReport,
      isGroupLesson: totalStudentsCount > 1,
      totalStudentsCount,
      otherStudentsCount,
      teacher: {
        firstName: lesson.teacher?.user?.firstName,
        lastName: lesson.teacher?.user?.lastName,
        username: lesson.teacher?.user?.username,
      },
      subject: {
        name: lesson.subject?.name,
        colorHex: lesson.subject?.colorHex,
      },
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    };
  }

  // ============================================
  // СТАТИСТИКА И ДОЛГИ
  // ============================================

  /**
   * Получает детальную статистику ребёнка
   */
  async getChildStatsDetailed(parentId: string, childId: string) {
    const relation = await this.relationRepo.findOne({
      where: { parentId, studentId: childId },
    });
    if (!relation) throw new ForbiddenException("NOT_YOUR_CHILD");

    return this.statsService.getDetailedStatsForStudent(childId);
  }

  /**
   * Получает информацию о долге за ребёнка
   */
  async getChildDebt(parentId: string, childId: string) {
    const relation = await this.relationRepo.findOne({
      where: { parentId, studentId: childId },
    });
    if (!relation) throw new ForbiddenException("NOT_YOUR_CHILD");

    return this.debtService.getDebtByTeachersForStudent(childId);
  }

  // ============================================
  // НАСТРОЙКИ УВЕДОМЛЕНИЙ
  // ============================================

  /**
   * Получает настройки уведомлений для всех детей
   */
  async getNotificationSettings(parentId: string) {
    const relations = await this.relationRepo.find({
      where: { parentId },
      relations: ["student", "student.user"],
    });

    const childrenMap = new Map<string, any>();

    for (const r of relations) {
      if (!childrenMap.has(r.studentId)) {
        childrenMap.set(r.studentId, {
          childId: r.studentId,
          childName: [r.student.user.firstName, r.student.user.lastName]
            .filter(Boolean)
            .join(" "),
          notificationsEnabled: r.notificationsEnabled,
        });
      }
    }

    return { children: Array.from(childrenMap.values()) };
  }

  /**
   * Обновляет настройки уведомлений для нескольких детей
   */
  async updateNotificationSettings(
    parentId: string,
    children: Array<{ childId: string; notificationsEnabled: boolean }>
  ) {
    for (const child of children) {
      await this.relationRepo.update(
        { parentId, studentId: child.childId },
        { notificationsEnabled: child.notificationsEnabled }
      );
    }
    return this.getNotificationSettings(parentId);
  }

  /**
   * Обновляет уведомления для конкретного ребёнка
   */
  async updateChildNotifications(
    parentId: string,
    childId: string,
    notificationsEnabled: boolean
  ) {
    const relation = await this.relationRepo.findOne({
      where: { parentId, studentId: childId },
    });
    if (!relation) throw new ForbiddenException("NOT_YOUR_CHILD");

    relation.notificationsEnabled = notificationsEnabled;
    await this.relationRepo.save(relation);

    return { childId, notificationsEnabled };
  }

  // ============================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ============================================

  private formatUserInfo(user: any) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    };
  }
}
