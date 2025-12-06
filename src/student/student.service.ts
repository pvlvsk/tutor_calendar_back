/**
 * Сервис для работы с функционалом ученика
 * Управление профилем, просмотр учителей, уроков, статистики
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  StudentProfile,
  TeacherStudentLink,
  Lesson,
  StudentNotificationSettings,
  Subject,
} from '../database/entities';
import { StatsService, AchievementsService } from '../shared';
import { LessonFilters, StudentGamifiedStats } from '../shared/types';
import { generateInviteUrl, generateFallbackUrl } from '../shared/utils';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentProfile)
    private studentProfileRepo: Repository<StudentProfile>,
    @InjectRepository(TeacherStudentLink)
    private linkRepo: Repository<TeacherStudentLink>,
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(StudentNotificationSettings)
    private notificationSettingsRepo: Repository<StudentNotificationSettings>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    private statsService: StatsService,
    private achievementsService: AchievementsService,
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
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('STUDENT_NOT_FOUND');

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
    if (!profile) throw new NotFoundException('STUDENT_NOT_FOUND');

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
    const profile = await this.studentProfileRepo.findOne({ where: { id: studentId } });
    if (!profile) throw new NotFoundException('STUDENT_NOT_FOUND');

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
      relations: ['teacher', 'teacher.user'],
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
      relations: ['teacher', 'teacher.user'],
    });

    if (!link) throw new NotFoundException('TEACHER_NOT_FOUND');

    const subjects = await this.subjectRepo.find({
      where: { teacherId },
    });

    const stats = await this.statsService.getStatsForStudentWithTeacher(studentId, teacherId);

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
  async getLessons(studentId: string, from: string, to: string, filters?: LessonFilters) {
    const whereClause: any = {
      studentId,
      startAt: Between(new Date(from), new Date(to)),
    };
    if (filters?.subjectId) whereClause.subjectId = filters.subjectId;
    if (filters?.teacherId) whereClause.teacherId = filters.teacherId;
    if (filters?.status) whereClause.status = filters.status;

    const lessons = await this.lessonRepo.find({
      where: whereClause,
      relations: ['teacher', 'teacher.user', 'subject'],
      order: { startAt: 'ASC' },
    });

    return lessons.map((l) => ({
      id: l.id,
      seriesId: l.seriesId,
      teacherId: l.teacherId,
      subjectId: l.subjectId,
      startAt: l.startAt.toISOString(),
      durationMinutes: l.durationMinutes,
      status: l.status,
      attendance: l.attendance,
      teacherNote: l.teacherNote,
      lessonReport: l.lessonReport,
      studentNotePrivate: l.studentNotePrivate,
      studentNoteForTeacher: l.studentNoteForTeacher,
      reminderMinutesBefore: l.reminderMinutesBefore,
      teacher: {
        firstName: l.teacher.user.firstName,
        lastName: l.teacher.user.lastName,
      },
      subject: {
        name: l.subject.name,
        colorHex: l.subject.colorHex,
      },
    }));
  }

  /**
   * Получает детали урока
   */
  async getLessonDetails(studentId: string, lessonId: string) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, studentId },
      relations: ['teacher', 'teacher.user', 'subject'],
    });
    if (!lesson) throw new NotFoundException('LESSON_NOT_FOUND');

    return {
      id: lesson.id,
      teacherId: lesson.teacherId,
      subjectId: lesson.subjectId,
      startAt: lesson.startAt.toISOString(),
      durationMinutes: lesson.durationMinutes,
      status: lesson.status,
      attendance: lesson.attendance,
      teacherNote: lesson.teacherNote,
      lessonReport: lesson.lessonReport,
      studentNotePrivate: lesson.studentNotePrivate,
      studentNoteForTeacher: lesson.studentNoteForTeacher,
      reminderMinutesBefore: lesson.reminderMinutesBefore,
      teacher: {
        firstName: lesson.teacher.user.firstName,
        lastName: lesson.teacher.user.lastName,
        username: lesson.teacher.user.username,
      },
      subject: {
        name: lesson.subject.name,
        colorHex: lesson.subject.colorHex,
      },
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    };
  }

  /**
   * Обновляет заметки ученика к уроку
   */
  async updateLessonNotes(studentId: string, lessonId: string, data: { studentNotePrivate?: string; studentNoteForTeacher?: string; reminderMinutesBefore?: number }) {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, studentId } });
    if (!lesson) throw new NotFoundException('LESSON_NOT_FOUND');

    if (data.studentNotePrivate !== undefined) lesson.studentNotePrivate = data.studentNotePrivate;
    if (data.studentNoteForTeacher !== undefined) lesson.studentNoteForTeacher = data.studentNoteForTeacher;
    if (data.reminderMinutesBefore !== undefined) lesson.reminderMinutesBefore = data.reminderMinutesBefore;

    await this.lessonRepo.save(lesson);
    return this.getLessonDetails(studentId, lessonId);
  }

  async cancelLesson(studentId: string, lessonId: string) {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, studentId } });
    if (!lesson) throw new NotFoundException('LESSON_NOT_FOUND');
    if (lesson.status !== 'planned') throw new ForbiddenException('LESSON_NOT_CANCELLABLE');

    lesson.status = 'cancelled';
    lesson.cancelledBy = 'student';
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
    const lessons = await this.lessonRepo.find({
      where: { studentId },
      relations: ['subject', 'teacher'],
    });

    // Базовая статистика (включает отмены)
    const detailedStats = await this.statsService.getDetailedStatsForStudent(studentId);
    
    // Streak
    const streak = this.statsService.calculateStreak(lessons);
    
    // Достижения
    const achievements = this.achievementsService.calculateAchievements(lessons, streak);

    return {
      total: detailedStats.total,
      bySubject: detailedStats.bySubject,
      streak,
      achievements,
    };
  }

  /**
   * Получает статистику с конкретным учителем
   */
  async getStatsWithTeacher(studentId: string, teacherId: string) {
    return this.statsService.getStatsForStudentWithTeacher(studentId, teacherId);
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
  async updateNotificationSettings(studentId: string, data: { defaultReminderMinutesBefore?: number; enableLessonReminders?: boolean; enableLessonReports?: boolean }) {
    let settings = await this.notificationSettingsRepo.findOne({ where: { studentId } });

    if (!settings) {
      settings = this.notificationSettingsRepo.create({ studentId });
    }

    if (data.defaultReminderMinutesBefore !== undefined) settings.defaultReminderMinutesBefore = data.defaultReminderMinutesBefore;
    if (data.enableLessonReminders !== undefined) settings.enableLessonReminders = data.enableLessonReminders;
    if (data.enableLessonReports !== undefined) settings.enableLessonReports = data.enableLessonReports;

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
