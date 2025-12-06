/**
 * Сервис для расчёта достижений (геймификация)
 */

import { Injectable } from '@nestjs/common';
import { Lesson } from '../database/entities';
import { Achievement } from './types';

// Определения достижений
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_lesson',
    name: 'Первый шаг',
    description: 'Посетить первое занятие',
    icon: '1',
    check: (lessons: Lesson[]) => {
      const attended = lessons.filter(l => l.status === 'done' && l.attendance === 'attended');
      return {
        earned: attended.length >= 1,
        progress: Math.min(attended.length, 1),
        target: 1,
      };
    },
  },
  {
    id: 'ten_lessons',
    name: 'Десятка',
    description: 'Посетить 10 занятий',
    icon: '10',
    check: (lessons: Lesson[]) => {
      const attended = lessons.filter(l => l.status === 'done' && l.attendance === 'attended');
      return {
        earned: attended.length >= 10,
        progress: Math.min(attended.length, 10),
        target: 10,
      };
    },
  },
  {
    id: 'perfect_week',
    name: 'Идеальная неделя',
    description: 'Посетить все занятия за неделю (минимум 3)',
    icon: 'W',
    check: (lessons: Lesson[]) => {
      // Группируем уроки по неделям
      const weekMap = new Map<string, { attended: number; total: number }>();
      
      for (const lesson of lessons) {
        if (lesson.status !== 'done') continue;
        
        const date = new Date(lesson.startAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, { attended: 0, total: 0 });
        }
        
        const week = weekMap.get(weekKey)!;
        week.total++;
        if (lesson.attendance === 'attended') {
          week.attended++;
        }
      }

      // Проверяем есть ли идеальная неделя
      let perfectWeeks = 0;
      for (const [, week] of weekMap) {
        if (week.total >= 3 && week.attended === week.total) {
          perfectWeeks++;
        }
      }

      return {
        earned: perfectWeeks >= 1,
        progress: perfectWeeks,
        target: 1,
      };
    },
  },
  {
    id: 'streak_5',
    name: 'Пять подряд',
    description: 'Посетить 5 занятий подряд без пропусков',
    icon: '5+',
    check: (lessons: Lesson[], streak: { current: number; max: number }) => {
      return {
        earned: streak.max >= 5,
        progress: Math.min(streak.current, 5),
        target: 5,
      };
    },
  },
];

@Injectable()
export class AchievementsService {
  /**
   * Рассчитывает достижения для ученика
   */
  calculateAchievements(
    lessons: Lesson[],
    streak: { current: number; max: number },
  ): Achievement[] {
    return ACHIEVEMENT_DEFINITIONS.map(def => {
      const result = def.check(lessons, streak);
      
      // Находим дату получения достижения (дата когда условие было выполнено)
      let earnedAt: string | null = null;
      if (result.earned) {
        // Берём дату последнего урока который привёл к достижению
        const doneLessons = lessons
          .filter(l => l.status === 'done' && l.attendance === 'attended')
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        
        if (def.id === 'first_lesson' && doneLessons.length >= 1) {
          earnedAt = doneLessons[0].startAt.toISOString();
        } else if (def.id === 'ten_lessons' && doneLessons.length >= 10) {
          earnedAt = doneLessons[9].startAt.toISOString();
        } else if (doneLessons.length > 0) {
          // Для остальных берём текущую дату как приближение
          earnedAt = doneLessons[doneLessons.length - 1].startAt.toISOString();
        }
      }

      return {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        earnedAt,
        progress: result.progress,
        target: result.target,
      };
    });
  }
}

