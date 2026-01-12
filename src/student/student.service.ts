/**
 * Сервис для работы с функционалом ученика
 * Управление профилем, просмотр учителей, уроков, статистики
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import {
  StudentProfile,
  TeacherStudentLink,
  Lesson,
  LessonStudent,
  StudentNotificationSettings,
  Subject,
} from "../database/entities";
import { StatsService, AchievementsService } from "../shared";
import { LessonFilters, StudentGamifiedStats } from "../shared/types";
import { generateInviteUrl, generateFallbackUrl } from "../shared/utils";

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentProfile)
    private studentProfileRepo: Repository<StudentProfile>,
    @InjectRepository(TeacherStudentLink)
    private linkRepo: Repository<TeacherStudentLink>,
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(LessonStudent)
    private lessonStudentRepo: Repository<LessonStudent>,
    @InjectRepository(StudentNotificationSettings)
    private notificationSettingsRepo: Repository<StudentNotificationSettings>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    private statsService: StatsService,
    private achievementsService: AchievementsService
  ) {}

  // ============================================
  // ПРОФИЛЬ УЧЕНИКА
  // ============================================

  /**
   * Получает профиль ученика
   */
  async getProfile(studentId: string) {
    const profile = await this.studentProfileRepo.findOne({
      where: { id: studentId },
      relations: ["user"],
    });
    if (!profile) throw new NotFoundException("STUDENT_NOT_FOUND");

    return {
      id: profile.id,
      userId: profile.userId,
      user: {
        telegramId: Number(profile.user.telegramId),
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
   * Получает ссылку для приглашения родителей
   */
  async getParentInviteLink(studentId: string) {
    const profile = await this.studentProfileRepo.findOne({
      where: { id: studentId },
    });
    if (!profile) throw new NotFoundException("STUDENT_NOT_FOUND");

    return {
      parentInviteCode: profile.parentInviteCode,
      inviteUrl: generateInviteUrl(profile.parentInviteCode),
      fallbackUrl: generateFallbackUrl(profile.parentInviteCode),
    };
  }

  /**
   * Обновляет профиль ученика
   */
  async updateProfile(studentId: string, customFields: Record<string, string>) {
    const profile = await this.studentProfileRepo.findOne({
      where: { id: studentId },
    });
    if (!profile) throw new NotFoundException("STUDENT_NOT_FOUND");

    profile.customFields = customFields;
    await this.studentProfileRepo.save(profile);
    return this.getProfile(studentId);
  }

  // ============================================
  // УЧИТЕЛЯ
  // ============================================

  /**
   * Получает список учителей ученика
   */
  async getTeachers(studentId: string) {
    const links = await this.linkRepo.find({
      where: { studentId },
      relations: ["teacher", "teacher.user"],
    });

    const teachers = [];
    for (const link of links) {
      const subjects = await this.subjectRepo.find({
        where: { teacherId: link.teacherId },
      });

      teachers.push({
        teacherId: link.teacherId,
        teacherUser: this.formatUserInfo(link.teacher.user),
        displayName: link.teacher.displayName,
        bio: link.teacher.bio,
        subjects: subjects.map((s) => ({
          subjectId: s.id,
          name: s.name,
          colorHex: s.colorHex,
        })),
      });
    }

    return teachers;
  }

  /**
   * Получает детальную информацию об учителе
   */
  async getTeacherDetails(studentId: string, teacherId: string) {
    const link = await this.linkRepo.findOne({
      where: { studentId, teacherId },
      relations: ["teacher", "teacher.user"],
    });

    if (!link) throw new NotFoundException("TEACHER_NOT_FOUND");

    const subjects = await this.subjectRepo.find({
      where: { teacherId },
    });

    const stats = await this.statsService.getStatsForStudentWithTeacher(
      studentId,
      teacherId
    );

    return {
      teacherId,
      teacherUser: this.formatUserInfo(link.teacher.user),
      displayName: link.teacher.displayName,
      bio: link.teacher.bio,
      subjects: subjects.map((s) => ({
        subjectId: s.id,
        name: s.name,
        colorHex: s.colorHex,
      })),
      statsWithTeacher: stats,
    };
  }

  // ============================================
  // УРОКИ
  // ============================================

  /**
   * Получает уроки за период
   */
  async getLessons(
    studentId: string,
    from: string,
    to: string,
    filters?: LessonFilters
  ) {
    const lessonStudents = await this.lessonStudentRepo.find({
      where: { studentId },
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
        seriesId: ls.lesson.seriesId,
        teacherId: ls.lesson.teacherId,
        subjectId: ls.lesson.subjectId,
        startAt: ls.lesson.startAt.toISOString(),
        durationMinutes: ls.lesson.durationMinutes,
        status: ls.lesson.status,
        attendance: ls.attendance,
        paymentStatus: ls.paymentStatus,
        teacherNote: ls.lesson.teacherNote,
        lessonReport: ls.lesson.lessonReport,
        studentNotePrivate: ls.lesson.studentNotePrivate,
        studentNoteForTeacher: ls.lesson.studentNoteForTeacher,
        reminderMinutesBefore: ls.lesson.reminderMinutesBefore,
        meetingUrl: ls.lesson.meetingUrl,
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
   * Получает детали урока
   */
  async getLessonDetails(studentId: string, lessonId: string) {
    const lessonStudent = await this.lessonStudentRepo.findOne({
      where: { lessonId, studentId },
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
      status: lesson.status,
      attendance: lessonStudent.attendance,
      paymentStatus: lessonStudent.paymentStatus,
      priceRub: lessonStudent.priceRub,
      rating: lessonStudent.rating,
      teacherNote: lesson.teacherNote,
      lessonReport: lesson.lessonReport,
      studentNotePrivate: lesson.studentNotePrivate,
      studentNoteForTeacher: lesson.studentNoteForTeacher,
      reminderMinutesBefore: lesson.reminderMinutesBefore,
      meetingUrl: lesson.meetingUrl,
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

  /**
   * Обновляет заметки ученика к уроку
   */
  async updateLessonNotes(
    studentId: string,
    lessonId: string,
    data: {
      studentNotePrivate?: string;
      studentNoteForTeacher?: string;
      reminderMinutesBefore?: number;
    }
  ) {
    const lessonStudent = await this.lessonStudentRepo.findOne({
      where: { lessonId, studentId },
      relations: ["lesson"],
    });
    if (!lessonStudent) throw new NotFoundException("LESSON_NOT_FOUND");

    const lesson = lessonStudent.lesson;
    if (data.studentNotePrivate !== undefined)
      lesson.studentNotePrivate = data.studentNotePrivate;
    if (data.studentNoteForTeacher !== undefined)
      lesson.studentNoteForTeacher = data.studentNoteForTeacher;
    if (data.reminderMinutesBefore !== undefined)
      lesson.reminderMinutesBefore = data.reminderMinutesBefore;

    await this.lessonRepo.save(lesson);
    return this.getLessonDetails(studentId, lessonId);
  }

  async cancelLesson(studentId: string, lessonId: string) {
    const lessonStudent = await this.lessonStudentRepo.findOne({
      where: { lessonId, studentId },
      relations: ["lesson"],
    });
    if (!lessonStudent) throw new NotFoundException("LESSON_NOT_FOUND");

    const lesson = lessonStudent.lesson;
    if (lesson.status !== "planned")
      throw new ForbiddenException("LESSON_NOT_CANCELLABLE");

    lesson.status = "cancelled";
    lesson.cancelledBy = "student";
    await this.lessonRepo.save(lesson);

    return this.getLessonDetails(studentId, lessonId);
  }

  // ============================================
  // СТАТИСТИКА
  // ============================================

  /**
   * Получает полную геймифицированную статистику ученика
   */
  async getStats(studentId: string): Promise<StudentGamifiedStats> {
    const lessonStudents = await this.lessonStudentRepo.find({
      where: { studentId },
      relations: ["lesson", "lesson.subject", "lesson.teacher"],
    });

    // Базовая статистика (включает отмены)
    const detailedStats = await this.statsService.getDetailedStatsForStudent(
      studentId
    );

    // Streak - рассчитываем на основе LessonStudent
    const streakData = this.calculateStreak(lessonStudents);

    // Достижения
    const achievements =
      this.achievementsService.calculateAchievementsFromRecords(
        lessonStudents,
        streakData.current
      );

    return {
      total: detailedStats.total,
      bySubject: detailedStats.bySubject,
      streak: streakData,
      achievements,
    };
  }

  private calculateStreak(records: LessonStudent[]): {
    current: number;
    max: number;
  } {
    const attendedDates = records
      .filter((r) => r.attendance === "attended" && r.lesson)
      .map((r) => r.lesson.startAt.toISOString().split("T")[0])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
      .reverse();

    if (attendedDates.length === 0) return { current: 0, max: 0 };

    let currentStreak = 1;
    let maxStreak = 1;
    let tempStreak = 1;

    for (let i = 0; i < attendedDates.length - 1; i++) {
      const diff =
        (new Date(attendedDates[i]).getTime() -
          new Date(attendedDates[i + 1]).getTime()) /
        (1000 * 60 * 60 * 24);
      if (diff <= 7) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    return { current: currentStreak, max: maxStreak };
  }

  /**
   * Получает статистику с конкретным учителем
   */
  async getStatsWithTeacher(studentId: string, teacherId: string) {
    return this.statsService.getStatsForStudentWithTeacher(
      studentId,
      teacherId
    );
  }

  // ============================================
  // НАСТРОЙКИ УВЕДОМЛЕНИЙ
  // ============================================

  /**
   * Получает настройки уведомлений
   */
  async getNotificationSettings(studentId: string) {
    let settings = await this.notificationSettingsRepo.findOne({
      where: { studentId },
    });

    if (!settings) {
      settings = this.notificationSettingsRepo.create({ studentId });
      await this.notificationSettingsRepo.save(settings);
    }

    return {
      defaultReminderMinutesBefore: settings.defaultReminderMinutesBefore,
      enableLessonReminders: settings.enableLessonReminders,
      enableLessonReports: settings.enableLessonReports,
    };
  }

  /**
   * Обновляет настройки уведомлений
   */
  async updateNotificationSettings(
    studentId: string,
    data: {
      defaultReminderMinutesBefore?: number;
      enableLessonReminders?: boolean;
      enableLessonReports?: boolean;
    }
  ) {
    let settings = await this.notificationSettingsRepo.findOne({
      where: { studentId },
    });

    if (!settings) {
      settings = this.notificationSettingsRepo.create({ studentId });
    }

    if (data.defaultReminderMinutesBefore !== undefined)
      settings.defaultReminderMinutesBefore = data.defaultReminderMinutesBefore;
    if (data.enableLessonReminders !== undefined)
      settings.enableLessonReminders = data.enableLessonReminders;
    if (data.enableLessonReports !== undefined)
      settings.enableLessonReports = data.enableLessonReports;

    await this.notificationSettingsRepo.save(settings);
    return this.getNotificationSettings(studentId);
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
