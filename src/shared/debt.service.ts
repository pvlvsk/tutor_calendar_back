/**
 * Сервис для расчёта долгов по оплате уроков
 * Используется в TeacherService и ParentService
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../database/entities';
import { DebtInfo, DetailedDebt, DebtByTeachers } from './types';
import { calculateDebtInfo } from './utils';

@Injectable()
export class DebtService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
  ) {}

  /**
   * Получает краткую информацию о долге ученика перед учителем
   */
  async getStudentDebtForTeacher(
    teacherId: string,
    studentId: string,
  ): Promise<DebtInfo> {
    const unpaidLessons = await this.lessonRepo.find({
      where: {
        teacherId,
        studentId,
        status: 'done',
        paymentStatus: 'unpaid',
      },
    });
    return calculateDebtInfo(unpaidLessons);
  }

  /**
   * Получает детальную информацию о долге с перечислением уроков
   */
  async getStudentDebtDetailsForTeacher(
    teacherId: string,
    studentId: string,
  ): Promise<DetailedDebt> {
    const unpaidLessons = await this.lessonRepo.find({
      where: { teacherId, studentId, status: 'done', paymentStatus: 'unpaid' },
      relations: ['subject'],
      order: { startAt: 'ASC' },
    });

    const baseDebt = calculateDebtInfo(unpaidLessons);

    return {
      ...baseDebt,
      lessons: unpaidLessons.map(l => ({
        lessonId: l.id,
        startAt: l.startAt.toISOString(),
        priceRub: l.priceRub,
        subjectName: l.subject.name,
      })),
    };
  }

  /**
   * Получает общий долг ученика (для родителя)
   */
  async getTotalDebtForStudent(studentId: string): Promise<DebtInfo> {
    const unpaidLessons = await this.lessonRepo.find({
      where: { studentId, status: 'done', paymentStatus: 'unpaid' },
    });
    return calculateDebtInfo(unpaidLessons);
  }

  /**
   * Получает долг ученика перед конкретным учителем
   */
  async getDebtForStudentByTeacher(
    studentId: string,
    teacherId: string,
  ): Promise<DebtInfo> {
    const unpaidLessons = await this.lessonRepo.find({
      where: { studentId, teacherId, status: 'done', paymentStatus: 'unpaid' },
    });
    return calculateDebtInfo(unpaidLessons);
  }

  /**
   * Получает долг ученика с разбивкой по учителям (для родителя)
   */
  async getDebtByTeachersForStudent(studentId: string): Promise<DebtByTeachers> {
    const unpaidLessons = await this.lessonRepo.find({
      where: { studentId, status: 'done', paymentStatus: 'unpaid' },
      relations: ['subject', 'teacher'],
      order: { startAt: 'ASC' },
    });

    const totalDebt = calculateDebtInfo(unpaidLessons);

    const byTeacher = new Map<string, {
      teacherId: string;
      teacherName: string;
      hasDebt: boolean;
      unpaidLessonsCount: number;
      unpaidAmountRub: number;
      lessons: Array<{
        lessonId: string;
        startAt: string;
        priceRub: number;
        subjectName: string;
      }>;
    }>();

    for (const lesson of unpaidLessons) {
      if (!byTeacher.has(lesson.teacherId)) {
        byTeacher.set(lesson.teacherId, {
          teacherId: lesson.teacherId,
          teacherName: lesson.teacher.displayName || '',
          hasDebt: true,
          unpaidLessonsCount: 0,
          unpaidAmountRub: 0,
          lessons: [],
        });
      }

      const t = byTeacher.get(lesson.teacherId)!;
      t.unpaidLessonsCount++;
      t.unpaidAmountRub += lesson.priceRub;
      t.lessons.push({
        lessonId: lesson.id,
        startAt: lesson.startAt.toISOString(),
        priceRub: lesson.priceRub,
        subjectName: lesson.subject.name,
      });
    }

    return {
      totalDebt,
      byTeacher: Array.from(byTeacher.values()),
    };
  }
}

