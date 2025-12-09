/**
 * Сервис для расчёта достижений (геймификация)
 */

import { Injectable } from "@nestjs/common";
import { LessonStudent, Lesson } from "../database/entities";
import { Achievement } from "./types";

interface LessonStudentWithLesson {
  attendance: string;
  lesson: Lesson;
}

@Injectable()
export class AchievementsService {
  /**
   * Рассчитывает достижения для ученика на основе LessonStudent записей
   */
  calculateAchievementsFromRecords(
    records: LessonStudentWithLesson[],
    streak: number
  ): Achievement[] {
    const attended = records.filter(
      (r) => r.lesson?.status === "done" && r.attendance === "attended"
    );

    const achievements: Achievement[] = [];

    // Первый шаг
    achievements.push({
      id: "first_lesson",
      name: "Первый шаг",
      description: "Посетить первое занятие",
      icon: "1",
      earnedAt:
        attended.length >= 1
          ? attended
              .sort(
                (a, b) =>
                  new Date(a.lesson.startAt).getTime() -
                  new Date(b.lesson.startAt).getTime()
              )[0]
              ?.lesson?.startAt?.toISOString() || null
          : null,
      progress: Math.min(attended.length, 1),
      target: 1,
    });

    // Десятка
    const sortedAttended = [...attended].sort(
      (a, b) =>
        new Date(a.lesson.startAt).getTime() -
        new Date(b.lesson.startAt).getTime()
    );
    achievements.push({
      id: "ten_lessons",
      name: "Десятка",
      description: "Посетить 10 занятий",
      icon: "10",
      earnedAt:
        sortedAttended.length >= 10
          ? sortedAttended[9]?.lesson?.startAt?.toISOString() || null
          : null,
      progress: Math.min(attended.length, 10),
      target: 10,
    });

    // Идеальная неделя
    const weekMap = new Map<string, { attended: number; total: number }>();
    for (const r of records) {
      if (!r.lesson || r.lesson.status !== "done") continue;
      const date = new Date(r.lesson.startAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { attended: 0, total: 0 });
      }
      const week = weekMap.get(weekKey)!;
      week.total++;
      if (r.attendance === "attended") {
        week.attended++;
      }
    }
    let perfectWeeks = 0;
    for (const [, week] of weekMap) {
      if (week.total >= 3 && week.attended === week.total) {
        perfectWeeks++;
      }
    }
    achievements.push({
      id: "perfect_week",
      name: "Идеальная неделя",
      description: "Посетить все занятия за неделю (минимум 3)",
      icon: "W",
      earnedAt:
        perfectWeeks >= 1
          ? sortedAttended[
              sortedAttended.length - 1
            ]?.lesson?.startAt?.toISOString() || null
          : null,
      progress: perfectWeeks,
      target: 1,
    });

    // Пять подряд
    achievements.push({
      id: "streak_5",
      name: "Пять подряд",
      description: "Посетить 5 занятий подряд без пропусков",
      icon: "5+",
      earnedAt:
        streak >= 5
          ? sortedAttended[
              sortedAttended.length - 1
            ]?.lesson?.startAt?.toISOString() || null
          : null,
      progress: Math.min(streak, 5),
      target: 5,
    });

    return achievements;
  }
}
