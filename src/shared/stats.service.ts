/**
 * Сервис для расчёта статистики посещаемости
 * Используется в TeacherService, StudentService и ParentService
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Lesson } from '../database/entities';
import {
  AttendanceStats,
  DetailedStats,
  SubjectStats,
  TeacherStats,
  StudentCardStats,
  StudentDetailedStatsForTeacher,
  DetailedDebt,
} from './types';
import {
  calculateAttendanceRate,
  calculateAttendanceStats,
  calculateStatsBySubject,
  calculateStatsByTeacher,
  calculateDebtInfo,
  getDayOfWeekRu,
} from './utils';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
  ) {}

  /**
   * Рассчитывает статистику ученика с конкретным учителем
   */
  async getStatsForStudentWithTeacher(
    studentId: string,
    teacherId: string,
  ): Promise<AttendanceStats> {
    const lessons = await this.lessonRepo.find({
      where: { studentId, teacherId },
    });
    return calculateAttendanceStats(lessons);
  }

  /**
   * Рассчитывает статистику ученика у учителя (краткая версия)
   */
  async getStudentStatsForTeacher(
    teacherId: string,
    studentId: string,
  ): Promise<AttendanceStats> {
    const lessons = await this.lessonRepo.find({
      where: { teacherId, studentId },
    });
    return calculateAttendanceStats(lessons);
  }

  /**
   * Рассчитывает полную статистику ученика по всем учителям
   */
  async getDetailedStatsForStudent(studentId: string): Promise<DetailedStats> {
    const lessons = await this.lessonRepo.find({
      where: { studentId },
      relations: ['subject', 'teacher', 'teacher.user'],
    });

    return {
      total: calculateAttendanceStats(lessons),
      bySubject: calculateStatsBySubject(lessons),
      byTeacher: calculateStatsByTeacher(lessons),
      currentStreak: 0,
      maxStreak: 0,
    };
  }

  /**
   * Рассчитывает статистику по предметам для ученика
   */
  async getSubjectStatsForStudent(studentId: string): Promise<SubjectStats[]> {
    const lessons = await this.lessonRepo.find({
      where: { studentId },
      relations: ['subject'],
    });
    return calculateStatsBySubject(lessons);
  }

  /**
   * Рассчитывает статистику по учителям для ученика
   */
  async getTeacherStatsForStudent(studentId: string): Promise<TeacherStats[]> {
    const lessons = await this.lessonRepo.find({
      where: { studentId },
      relations: ['teacher'],
    });
    return calculateStatsByTeacher(lessons);
  }

  /**
   * Краткая статистика ученика для карточки (для учителя)
   */
  async getStudentCardStats(teacherId: string, studentId: string): Promise<StudentCardStats> {
    const lessons = await this.lessonRepo.find({
      where: { teacherId, studentId },
      relations: ['subject'],
      order: { startAt: 'ASC' },
    });

    // Долг
    const unpaidLessons = lessons.filter(l => l.status === 'done' && l.paymentStatus === 'unpaid');
    const debt = calculateDebtInfo(unpaidLessons);

    // Следующий урок
    const now = new Date();
    const nextLesson = lessons.find(l => l.status === 'planned' && new Date(l.startAt) > now);

    return {
      debt,
      nextLesson: nextLesson ? {
        date: nextLesson.startAt.toISOString(),
        dayOfWeek: getDayOfWeekRu(new Date(nextLesson.startAt)),
        subjectName: nextLesson.subject?.name || '',
      } : null,
    };
  }

  /**
   * Детальная статистика ученика (для учителя)
   */
  async getStudentDetailedStats(teacherId: string, studentId: string): Promise<StudentDetailedStatsForTeacher> {
    const lessons = await this.lessonRepo.find({
      where: { teacherId, studentId },
      relations: ['subject'],
      order: { startAt: 'DESC' },
    });

    // Долг с деталями
    const unpaidLessons = lessons.filter(l => l.status === 'done' && l.paymentStatus === 'unpaid');
    const debt: DetailedDebt = {
      ...calculateDebtInfo(unpaidLessons),
      lessons: unpaidLessons.map(l => ({
        lessonId: l.id,
        startAt: l.startAt.toISOString(),
        priceRub: l.priceRub,
        subjectName: l.subject?.name || '',
      })),
    };

    // Посещаемость (включает отмены)
    const attendance = calculateAttendanceStats(lessons);

    // По предметам
    const bySubject = calculateStatsBySubject(lessons);

    // Последние пропуски
    const missedLessons = lessons
      .filter(l => l.status === 'done' && l.attendance === 'missed')
      .slice(0, 10);

    const recentMissedLessons = missedLessons.map(l => ({
      lessonId: l.id,
      startAt: l.startAt.toISOString(),
      subjectName: l.subject?.name || '',
    }));

    return {
      debt,
      attendance,
      bySubject,
      recentMissedLessons,
    };
  }

  /**
   * Рассчитывает текущий и максимальный streak посещений
   */
  calculateStreak(lessons: Lesson[]): { current: number; max: number } {
    const doneLessons = lessons
      .filter(l => l.status === 'done')
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    if (doneLessons.length === 0) return { current: 0, max: 0 };

    let current = 0;
    let max = 0;
    let streak = 0;
    let foundMissed = false;

    for (const lesson of doneLessons) {
      if (lesson.attendance === 'attended') {
        streak++;
        if (!foundMissed) current = streak;
        max = Math.max(max, streak);
      } else {
        foundMissed = true;
        streak = 0;
      }
    }

    return { current, max };
  }
}

