/**
 * Сервис для расчёта статистики посещаемости
 * Используется в TeacherService, StudentService и ParentService
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Lesson, LessonStudent } from "../database/entities";
import {
  AttendanceStats,
  DetailedStats,
  SubjectStats,
  TeacherStats,
  StudentCardStats,
  StudentDetailedStatsForTeacher,
  DetailedDebt,
} from "./types";
import { getDayOfWeekRu } from "./utils";

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(LessonStudent)
    private lessonStudentRepo: Repository<LessonStudent>
  ) {}

  /**
   * Рассчитывает статистику ученика с конкретным учителем
   */
  async getStatsForStudentWithTeacher(
    studentId: string,
    teacherId: string
  ): Promise<AttendanceStats> {
    const records = await this.lessonStudentRepo.find({
      where: { studentId },
      relations: ["lesson"],
    });

    const filtered = records.filter(
      (r) => r.lesson?.teacherId === teacherId && r.lesson?.status === "done"
    );

    return this.calculateAttendanceFromRecords(filtered);
  }

  /**
   * Рассчитывает статистику ученика у учителя (краткая версия)
   */
  async getStudentStatsForTeacher(
    teacherId: string,
    studentId: string
  ): Promise<AttendanceStats> {
    return this.getStatsForStudentWithTeacher(studentId, teacherId);
  }

  /**
   * Рассчитывает полную статистику ученика по всем учителям
   */
  async getDetailedStatsForStudent(studentId: string): Promise<DetailedStats> {
    const records = await this.lessonStudentRepo.find({
      where: { studentId },
      relations: [
        "lesson",
        "lesson.subject",
        "lesson.teacher",
        "lesson.teacher.user",
      ],
    });

    const doneRecords = records.filter((r) => r.lesson?.status === "done");

    return {
      total: this.calculateAttendanceFromRecords(doneRecords),
      bySubject: this.calculateStatsBySubject(doneRecords),
      byTeacher: this.calculateStatsByTeacher(doneRecords),
      currentStreak: 0,
      maxStreak: 0,
    };
  }

  /**
   * Рассчитывает статистику по предметам для ученика
   */
  async getSubjectStatsForStudent(studentId: string): Promise<SubjectStats[]> {
    const records = await this.lessonStudentRepo.find({
      where: { studentId },
      relations: ["lesson", "lesson.subject"],
    });
    return this.calculateStatsBySubject(records);
  }

  /**
   * Рассчитывает статистику по учителям для ученика
   */
  async getTeacherStatsForStudent(studentId: string): Promise<TeacherStats[]> {
    const records = await this.lessonStudentRepo.find({
      where: { studentId },
      relations: ["lesson", "lesson.teacher"],
    });
    return this.calculateStatsByTeacher(records);
  }

  /**
   * Краткая статистика ученика для карточки (для учителя)
   */
  async getStudentCardStats(
    teacherId: string,
    studentId: string
  ): Promise<StudentCardStats> {
    const records = await this.lessonStudentRepo.find({
      where: { studentId },
      relations: ["lesson", "lesson.subject"],
    });

    const teacherRecords = records.filter(
      (r) => r.lesson?.teacherId === teacherId
    );
    const unpaidRecords = teacherRecords.filter(
      (r) =>
        r.lesson?.status === "done" &&
        r.attendance === "attended" &&
        r.paymentStatus === "unpaid"
    );

    const debt = {
      hasDebt: unpaidRecords.length > 0,
      unpaidLessonsCount: unpaidRecords.length,
      unpaidAmountRub: unpaidRecords.reduce((sum, r) => sum + r.priceRub, 0),
    };

    const now = new Date();
    const nextLessonRecord = teacherRecords
      .filter(
        (r) =>
          r.lesson?.status === "planned" && new Date(r.lesson.startAt) > now
      )
      .sort(
        (a, b) =>
          new Date(a.lesson.startAt).getTime() -
          new Date(b.lesson.startAt).getTime()
      )[0];

    return {
      debt,
      nextLesson: nextLessonRecord
        ? {
            date: nextLessonRecord.lesson.startAt.toISOString(),
            dayOfWeek: getDayOfWeekRu(
              new Date(nextLessonRecord.lesson.startAt)
            ),
            subjectName: nextLessonRecord.lesson.subject?.name || "",
          }
        : null,
    };
  }

  /**
   * Детальная статистика ученика (для учителя)
   */
  async getStudentDetailedStats(
    teacherId: string,
    studentId: string
  ): Promise<StudentDetailedStatsForTeacher> {
    const records = await this.lessonStudentRepo.find({
      where: { studentId },
      relations: ["lesson", "lesson.subject"],
    });

    const teacherRecords = records.filter(
      (r) => r.lesson?.teacherId === teacherId
    );

    const unpaidRecords = teacherRecords.filter(
      (r) =>
        r.lesson?.status === "done" &&
        r.attendance === "attended" &&
        r.paymentStatus === "unpaid"
    );

    const debt: DetailedDebt = {
      hasDebt: unpaidRecords.length > 0,
      unpaidLessonsCount: unpaidRecords.length,
      unpaidAmountRub: unpaidRecords.reduce((sum, r) => sum + r.priceRub, 0),
      lessons: unpaidRecords.map((r) => ({
        lessonId: r.lesson.id,
        startAt: r.lesson.startAt.toISOString(),
        priceRub: r.priceRub,
        subjectName: r.lesson.subject?.name || "",
      })),
    };

    const doneRecords = teacherRecords.filter(
      (r) => r.lesson?.status === "done"
    );
    const attendance = this.calculateAttendanceFromRecords(doneRecords);
    const bySubject = this.calculateStatsBySubject(doneRecords);

    const missedRecords = doneRecords
      .filter((r) => r.attendance === "missed")
      .sort(
        (a, b) =>
          new Date(b.lesson.startAt).getTime() -
          new Date(a.lesson.startAt).getTime()
      )
      .slice(0, 10);

    const recentMissedLessons = missedRecords.map((r) => ({
      lessonId: r.lesson.id,
      startAt: r.lesson.startAt.toISOString(),
      subjectName: r.lesson.subject?.name || "",
    }));

    // Ближайшие уроки (до 5 штук)
    const now = new Date();

    // DEBUG: логируем для отладки
    console.log(
      `[getStudentDetailedStats] teacherRecords total: ${teacherRecords.length}`
    );
    console.log(
      `[getStudentDetailedStats] planned lessons:`,
      teacherRecords.filter((r) => r.lesson?.status === "planned").length
    );
    console.log(
      `[getStudentDetailedStats] future planned:`,
      teacherRecords.filter(
        (r) =>
          r.lesson?.status === "planned" && new Date(r.lesson.startAt) > now
      ).length
    );

    const upcomingLessons = teacherRecords
      .filter(
        (r) =>
          r.lesson?.status === "planned" && new Date(r.lesson.startAt) > now
      )
      .sort(
        (a, b) =>
          new Date(a.lesson.startAt).getTime() -
          new Date(b.lesson.startAt).getTime()
      )
      .slice(0, 5)
      .map((r) => ({
        lessonId: r.lesson.id,
        startAt: r.lesson.startAt.toISOString(),
        subjectName: r.lesson.subject?.name || "",
        colorHex: r.lesson.subject?.colorHex || "#888888",
      }));

    return {
      debt,
      attendance,
      bySubject,
      recentMissedLessons,
      upcomingLessons,
    };
  }

  private calculateAttendanceFromRecords(
    records: LessonStudent[]
  ): AttendanceStats {
    const total = records.length;
    const attended = records.filter((r) => r.attendance === "attended").length;
    const missed = records.filter((r) => r.attendance === "missed").length;
    const cancelled = records.filter(
      (r) => r.lesson?.status === "cancelled"
    ).length;

    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return {
      totalLessonsPlanned: total,
      totalLessonsAttended: attended,
      totalLessonsMissed: missed,
      cancelledByStudent: cancelled,
      cancelledByTeacher: 0,
      cancelledByIllness: 0,
      attendanceRate: rate,
    };
  }

  private calculateStatsBySubject(records: LessonStudent[]): SubjectStats[] {
    const bySubject = new Map<
      string,
      { name: string; colorHex: string; attended: number; total: number }
    >();

    for (const r of records) {
      const subjectId = r.lesson?.subjectId;
      const subjectName = r.lesson?.subject?.name || "";
      const colorHex = r.lesson?.subject?.colorHex || "#888888";
      if (!subjectId) continue;

      if (!bySubject.has(subjectId)) {
        bySubject.set(subjectId, {
          name: subjectName,
          colorHex,
          attended: 0,
          total: 0,
        });
      }
      const stats = bySubject.get(subjectId)!;
      stats.total++;
      if (r.attendance === "attended") stats.attended++;
    }

    return Array.from(bySubject.entries()).map(([id, s]) => ({
      subjectId: id,
      subjectName: s.name,
      colorHex: s.colorHex,
      lessonsPlanned: s.total,
      lessonsAttended: s.attended,
      attendanceRate:
        s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
    }));
  }

  private calculateStatsByTeacher(records: LessonStudent[]): TeacherStats[] {
    const byTeacher = new Map<
      string,
      { name: string; attended: number; total: number }
    >();

    for (const r of records) {
      const teacherId = r.lesson?.teacherId;
      const teacherName = r.lesson?.teacher?.displayName || "";
      if (!teacherId) continue;

      if (!byTeacher.has(teacherId)) {
        byTeacher.set(teacherId, { name: teacherName, attended: 0, total: 0 });
      }
      const stats = byTeacher.get(teacherId)!;
      stats.total++;
      if (r.attendance === "attended") stats.attended++;
    }

    return Array.from(byTeacher.entries()).map(([id, s]) => ({
      teacherId: id,
      teacherName: s.name,
      lessonsPlanned: s.total,
      lessonsAttended: s.attended,
      attendanceRate:
        s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
    }));
  }
}
