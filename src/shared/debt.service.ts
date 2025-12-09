/**
 * Сервис для расчёта долгов по оплате уроков
 * Используется в TeacherService и ParentService
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LessonStudent } from "../database/entities";
import { DebtInfo, DetailedDebt, DebtByTeachers } from "./types";

@Injectable()
export class DebtService {
  constructor(
    @InjectRepository(LessonStudent)
    private lessonStudentRepo: Repository<LessonStudent>
  ) {}

  /**
   * Получает краткую информацию о долге ученика перед учителем
   */
  async getStudentDebtForTeacher(
    teacherId: string,
    studentId: string
  ): Promise<DebtInfo> {
    const unpaidRecords = await this.lessonStudentRepo.find({
      where: {
        studentId,
        attendance: "attended",
        paymentStatus: "unpaid",
      },
      relations: ["lesson"],
    });

    const filtered = unpaidRecords.filter(
      (r) => r.lesson?.teacherId === teacherId && r.lesson?.status === "done"
    );

    return this.calculateDebtFromRecords(filtered);
  }

  /**
   * Получает детальную информацию о долге с перечислением уроков
   */
  async getStudentDebtDetailsForTeacher(
    teacherId: string,
    studentId: string
  ): Promise<DetailedDebt> {
    const unpaidRecords = await this.lessonStudentRepo.find({
      where: {
        studentId,
        attendance: "attended",
        paymentStatus: "unpaid",
      },
      relations: ["lesson", "lesson.subject"],
    });

    const filtered = unpaidRecords.filter(
      (r) => r.lesson?.teacherId === teacherId && r.lesson?.status === "done"
    );

    const baseDebt = this.calculateDebtFromRecords(filtered);

    return {
      ...baseDebt,
      lessons: filtered.map((r) => ({
        lessonId: r.lesson.id,
        startAt: r.lesson.startAt.toISOString(),
        priceRub: r.priceRub,
        subjectName: r.lesson.subject?.name || "",
      })),
    };
  }

  /**
   * Получает общий долг ученика (для родителя)
   */
  async getTotalDebtForStudent(studentId: string): Promise<DebtInfo> {
    const unpaidRecords = await this.lessonStudentRepo.find({
      where: {
        studentId,
        attendance: "attended",
        paymentStatus: "unpaid",
      },
      relations: ["lesson"],
    });

    const filtered = unpaidRecords.filter((r) => r.lesson?.status === "done");
    return this.calculateDebtFromRecords(filtered);
  }

  /**
   * Получает долг ученика перед конкретным учителем
   */
  async getDebtForStudentByTeacher(
    studentId: string,
    teacherId: string
  ): Promise<DebtInfo> {
    return this.getStudentDebtForTeacher(teacherId, studentId);
  }

  /**
   * Получает долг ученика с разбивкой по учителям (для родителя)
   */
  async getDebtByTeachersForStudent(
    studentId: string
  ): Promise<DebtByTeachers> {
    const unpaidRecords = await this.lessonStudentRepo.find({
      where: {
        studentId,
        attendance: "attended",
        paymentStatus: "unpaid",
      },
      relations: ["lesson", "lesson.subject", "lesson.teacher"],
    });

    const filtered = unpaidRecords.filter((r) => r.lesson?.status === "done");

    const totalDebt = this.calculateDebtFromRecords(filtered);

    const byTeacher = new Map<
      string,
      {
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
      }
    >();

    for (const record of filtered) {
      const teacherId = record.lesson.teacherId;

      if (!byTeacher.has(teacherId)) {
        byTeacher.set(teacherId, {
          teacherId,
          teacherName: record.lesson.teacher?.displayName || "",
          hasDebt: true,
          unpaidLessonsCount: 0,
          unpaidAmountRub: 0,
          lessons: [],
        });
      }

      const t = byTeacher.get(teacherId)!;
      t.unpaidLessonsCount++;
      t.unpaidAmountRub += record.priceRub;
      t.lessons.push({
        lessonId: record.lesson.id,
        startAt: record.lesson.startAt.toISOString(),
        priceRub: record.priceRub,
        subjectName: record.lesson.subject?.name || "",
      });
    }

    return {
      totalDebt,
      byTeacher: Array.from(byTeacher.values()),
    };
  }

  private calculateDebtFromRecords(records: LessonStudent[]): DebtInfo {
    if (records.length === 0) {
      return { hasDebt: false, unpaidLessonsCount: 0, unpaidAmountRub: 0 };
    }

    const unpaidAmountRub = records.reduce((sum, r) => sum + r.priceRub, 0);

    return {
      hasDebt: true,
      unpaidLessonsCount: records.length,
      unpaidAmountRub,
    };
  }
}
