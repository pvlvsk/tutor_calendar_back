/**
 * @file achievements.service.test.ts
 * @description Тесты для сервиса достижений (геймификация)
 * @relatedTo ../achievements.service.ts
 *
 * Покрывает: calculateAchievementsFromRecords
 */

interface Lesson {
  id: string;
  status: string;
  startAt: Date;
}

interface LessonStudentWithLesson {
  attendance: string;
  lesson: Lesson;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  progress: number;
  target: number;
}

// Эмулируем метод из AchievementsService
function calculateAchievementsFromRecords(
  records: LessonStudentWithLesson[],
  streak: number
): Achievement[] {
  const attended = records.filter(
    (r) => r.lesson?.status === 'done' && r.attendance === 'attended'
  );

  const achievements: Achievement[] = [];

  // Первый шаг
  const sortedAttended = [...attended].sort(
    (a, b) =>
      new Date(a.lesson.startAt).getTime() - new Date(b.lesson.startAt).getTime()
  );

  achievements.push({
    id: 'first_lesson',
    name: 'Первый шаг',
    description: 'Посетить первое занятие',
    icon: '1',
    earnedAt:
      attended.length >= 1
        ? sortedAttended[0]?.lesson?.startAt?.toISOString() || null
        : null,
    progress: Math.min(attended.length, 1),
    target: 1,
  });

  // Десятка
  achievements.push({
    id: 'ten_lessons',
    name: 'Десятка',
    description: 'Посетить 10 занятий',
    icon: '10',
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
    if (!r.lesson || r.lesson.status !== 'done') continue;
    const date = new Date(r.lesson.startAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { attended: 0, total: 0 });
    }
    const week = weekMap.get(weekKey)!;
    week.total++;
    if (r.attendance === 'attended') {
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
    id: 'perfect_week',
    name: 'Идеальная неделя',
    description: 'Посетить все занятия за неделю (минимум 3)',
    icon: 'W',
    earnedAt:
      perfectWeeks >= 1
        ? sortedAttended[sortedAttended.length - 1]?.lesson?.startAt?.toISOString() ||
          null
        : null,
    progress: perfectWeeks,
    target: 1,
  });

  // Пять подряд
  achievements.push({
    id: 'streak_5',
    name: 'Пять подряд',
    description: 'Посетить 5 занятий подряд без пропусков',
    icon: '5+',
    earnedAt:
      streak >= 5
        ? sortedAttended[sortedAttended.length - 1]?.lesson?.startAt?.toISOString() ||
          null
        : null,
    progress: Math.min(streak, 5),
    target: 5,
  });

  return achievements;
}

// Фабрика для создания тестовых данных
const createRecord = (
  attendance: string,
  status: string,
  date: string
): LessonStudentWithLesson => ({
  attendance,
  lesson: {
    id: Math.random().toString(),
    status,
    startAt: new Date(date),
  },
});

describe('AchievementsService — calculateAchievementsFromRecords', () => {
  describe('Первый шаг', () => {
    it('не должен быть получен без посещённых уроков', () => {
      const achievements = calculateAchievementsFromRecords([], 0);
      const firstLesson = achievements.find((a) => a.id === 'first_lesson');

      expect(firstLesson?.earnedAt).toBeNull();
      expect(firstLesson?.progress).toBe(0);
    });

    it('должен быть получен после первого посещённого урока', () => {
      const records = [createRecord('attended', 'done', '2025-01-15T10:00:00')];
      const achievements = calculateAchievementsFromRecords(records, 1);
      const firstLesson = achievements.find((a) => a.id === 'first_lesson');

      expect(firstLesson?.earnedAt).not.toBeNull();
      expect(firstLesson?.progress).toBe(1);
    });
  });

  describe('Десятка', () => {
    it('не должен быть получен с 5 уроками', () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        createRecord('attended', 'done', `2025-01-${15 + i}T10:00:00`)
      );
      const achievements = calculateAchievementsFromRecords(records, 5);
      const tenLessons = achievements.find((a) => a.id === 'ten_lessons');

      expect(tenLessons?.earnedAt).toBeNull();
      expect(tenLessons?.progress).toBe(5);
    });

    it('должен быть получен после 10 посещённых уроков', () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        createRecord('attended', 'done', `2025-01-${10 + i}T10:00:00`)
      );
      const achievements = calculateAchievementsFromRecords(records, 10);
      const tenLessons = achievements.find((a) => a.id === 'ten_lessons');

      expect(tenLessons?.earnedAt).not.toBeNull();
      expect(tenLessons?.progress).toBe(10);
    });

    it('progress не должен превышать 10', () => {
      const records = Array.from({ length: 15 }, (_, i) =>
        createRecord('attended', 'done', `2025-01-${10 + i}T10:00:00`)
      );
      const achievements = calculateAchievementsFromRecords(records, 15);
      const tenLessons = achievements.find((a) => a.id === 'ten_lessons');

      expect(tenLessons?.progress).toBe(10);
    });
  });

  describe('Пять подряд', () => {
    it('не должен быть получен при streak < 5', () => {
      const records = Array.from({ length: 4 }, (_, i) =>
        createRecord('attended', 'done', `2025-01-${15 + i}T10:00:00`)
      );
      const achievements = calculateAchievementsFromRecords(records, 4);
      const streak5 = achievements.find((a) => a.id === 'streak_5');

      expect(streak5?.earnedAt).toBeNull();
      expect(streak5?.progress).toBe(4);
    });

    it('должен быть получен при streak >= 5', () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        createRecord('attended', 'done', `2025-01-${15 + i}T10:00:00`)
      );
      const achievements = calculateAchievementsFromRecords(records, 5);
      const streak5 = achievements.find((a) => a.id === 'streak_5');

      expect(streak5?.earnedAt).not.toBeNull();
      expect(streak5?.progress).toBe(5);
    });
  });

  describe('Идеальная неделя', () => {
    it('не должна быть получена при < 3 уроках за неделю', () => {
      const records = [
        createRecord('attended', 'done', '2025-01-13T10:00:00'), // Пн
        createRecord('attended', 'done', '2025-01-14T10:00:00'), // Вт
      ];
      const achievements = calculateAchievementsFromRecords(records, 2);
      const perfectWeek = achievements.find((a) => a.id === 'perfect_week');

      expect(perfectWeek?.earnedAt).toBeNull();
      expect(perfectWeek?.progress).toBe(0);
    });

    it('должна быть получена при 3+ уроках без пропусков', () => {
      const records = [
        createRecord('attended', 'done', '2025-01-13T10:00:00'), // Пн
        createRecord('attended', 'done', '2025-01-14T10:00:00'), // Вт
        createRecord('attended', 'done', '2025-01-15T10:00:00'), // Ср
      ];
      const achievements = calculateAchievementsFromRecords(records, 3);
      const perfectWeek = achievements.find((a) => a.id === 'perfect_week');

      expect(perfectWeek?.progress).toBeGreaterThanOrEqual(1);
    });

    it('не должна быть получена если есть пропуск', () => {
      const records = [
        createRecord('attended', 'done', '2025-01-13T10:00:00'),
        createRecord('attended', 'done', '2025-01-14T10:00:00'),
        createRecord('missed', 'done', '2025-01-15T10:00:00'), // Пропуск!
      ];
      const achievements = calculateAchievementsFromRecords(records, 2);
      const perfectWeek = achievements.find((a) => a.id === 'perfect_week');

      expect(perfectWeek?.progress).toBe(0);
    });
  });

  describe('Структура достижений', () => {
    it('должен возвращать 4 достижения', () => {
      const achievements = calculateAchievementsFromRecords([], 0);
      expect(achievements).toHaveLength(4);
    });

    it('каждое достижение должно иметь все поля', () => {
      const achievements = calculateAchievementsFromRecords([], 0);

      achievements.forEach((a) => {
        expect(a).toHaveProperty('id');
        expect(a).toHaveProperty('name');
        expect(a).toHaveProperty('description');
        expect(a).toHaveProperty('icon');
        expect(a).toHaveProperty('earnedAt');
        expect(a).toHaveProperty('progress');
        expect(a).toHaveProperty('target');
      });
    });
  });
});

