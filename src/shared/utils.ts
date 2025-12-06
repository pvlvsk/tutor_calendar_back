/**
 * Общие утилиты для работы с данными
 */

import { Lesson } from '../database/entities';
import { AttendanceStats, SubjectStats, TeacherStats, DebtInfo } from './types';

/**
 * Рассчитывает процент посещаемости
 * @param attended - количество посещённых уроков
 * @param total - общее количество уроков
 * @returns процент с одним знаком после запятой
 */
export function calculateAttendanceRate(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 1000) / 10;
}

/**
 * Рассчитывает базовую статистику посещаемости из массива уроков
 * 
 * Запланировано = ВСЕ уроки до текущей даты
 * Посещаемость = посещено / запланировано
 */
export function calculateAttendanceStats(lessons: Lesson[]): AttendanceStats {
  const now = new Date();
  
  // Уроки до текущей даты (прошедшие)
  const pastLessons = lessons.filter(l => new Date(l.startAt) < now);
  
  const done = pastLessons.filter(l => l.status === 'done');
  const attended = done.filter(l => l.attendance === 'attended').length;
  const missed = done.filter(l => l.attendance === 'missed').length;
  const doneTotal = done.length;
  
  const cancelled = pastLessons.filter(l => l.status === 'cancelled');
  const cancelledByStudentOnly = cancelled.filter(l => l.cancelledBy === 'student' && l.cancellationReason !== 'illness').length;
  const cancelledByTeacher = cancelled.filter(l => l.cancelledBy === 'teacher').length;
  const cancelledByIllness = cancelled.filter(l => l.cancelledBy === 'student' && l.cancellationReason === 'illness').length;
  
  const pastPlanned = pastLessons.filter(l => l.status === 'planned').length;

  // Запланировано = ВСЕ уроки до текущей даты
  const totalCancelledByStudent = cancelledByStudentOnly + cancelledByIllness;
  const totalPlanned = doneTotal + totalCancelledByStudent + cancelledByTeacher + pastPlanned;

  return {
    totalLessonsPlanned: totalPlanned,
    totalLessonsAttended: attended,
    totalLessonsMissed: missed,
    cancelledByStudent: totalCancelledByStudent,
    cancelledByTeacher,
    cancelledByIllness,
    attendanceRate: calculateAttendanceRate(attended, totalPlanned),
  };
}

/**
 * Рассчитывает статистику по предметам
 * Считаются уроки со статусом 'done' и отменённые учеником
 */
export function calculateStatsBySubject(lessons: Lesson[]): SubjectStats[] {
  const now = new Date();
  const pastLessons = lessons.filter(l => new Date(l.startAt) < now);
  
  // Проведённые уроки
  const doneLessons = pastLessons.filter(l => l.status === 'done');
  // Отменённые учеником уроки
  const cancelledByStudentLessons = pastLessons.filter(l => l.status === 'cancelled' && l.cancelledBy === 'student');
  
  interface SubjectData {
    subjectId: string;
    subjectName: string;
    colorHex: string;
    total: number;
    attended: number;
    missed: number;
    cancelledByStudent: number;
    missedLessons: Array<{ lessonId: string; startAt: string; subjectName: string }>;
    cancelledLessons: Array<{ lessonId: string; startAt: string; subjectName: string }>;
    teacher?: {
      teacherId: string;
      firstName?: string;
      lastName?: string;
      username?: string;
    };
  }
  
  const bySubject = new Map<string, SubjectData>();

  const getOrCreate = (lesson: Lesson): SubjectData => {
    if (!bySubject.has(lesson.subjectId)) {
      bySubject.set(lesson.subjectId, {
        subjectId: lesson.subjectId,
        subjectName: lesson.subject?.name || '',
        colorHex: lesson.subject?.colorHex || '#888888',
        total: 0,
        attended: 0,
        missed: 0,
        cancelledByStudent: 0,
        missedLessons: [],
        cancelledLessons: [],
        teacher: lesson.teacher ? {
          teacherId: lesson.teacherId,
          firstName: lesson.teacher.user?.firstName,
          lastName: lesson.teacher.user?.lastName,
          username: lesson.teacher.user?.username,
        } : undefined,
      });
    }
    return bySubject.get(lesson.subjectId)!;
  };

  // Обрабатываем проведённые уроки
  for (const lesson of doneLessons) {
    const stat = getOrCreate(lesson);
    stat.total++;
    
    if (lesson.attendance === 'attended') {
      stat.attended++;
    } else if (lesson.attendance === 'missed') {
      stat.missed++;
      stat.missedLessons.push({
        lessonId: lesson.id,
        startAt: lesson.startAt.toISOString(),
        subjectName: lesson.subject?.name || '',
      });
    }
  }

  // Обрабатываем отменённые учеником уроки
  for (const lesson of cancelledByStudentLessons) {
    const stat = getOrCreate(lesson);
    stat.cancelledByStudent++;
    stat.cancelledLessons.push({
      lessonId: lesson.id,
      startAt: lesson.startAt.toISOString(),
      subjectName: lesson.subject?.name || '',
    });
  }

  return Array.from(bySubject.values()).map(s => ({
    subjectId: s.subjectId,
    subjectName: s.subjectName,
    colorHex: s.colorHex,
    lessonsPlanned: s.total,
    lessonsAttended: s.attended,
    lessonsMissed: s.missed,
    cancelledByStudent: s.cancelledByStudent,
    attendanceRate: calculateAttendanceRate(s.attended, s.total),
    missedLessons: s.missedLessons,
    cancelledLessons: s.cancelledLessons,
    teacher: s.teacher,
  }));
}

/**
 * Рассчитывает статистику по учителям
 * Запланировано = ВСЕ уроки до текущей даты
 */
export function calculateStatsByTeacher(lessons: Lesson[]): TeacherStats[] {
  const now = new Date();
  const pastLessons = lessons.filter(l => new Date(l.startAt) < now);
  
  const byTeacher = new Map<string, { 
    teacherId: string;
    teacherName: string;
    total: number;
    attended: number;
  }>();

  for (const lesson of pastLessons) {
    if (!byTeacher.has(lesson.teacherId)) {
      byTeacher.set(lesson.teacherId, {
        teacherId: lesson.teacherId,
        teacherName: lesson.teacher?.displayName || '',
        total: 0,
        attended: 0,
      });
    }

    const stat = byTeacher.get(lesson.teacherId)!;
    stat.total++;
    
    if (lesson.status === 'done' && lesson.attendance === 'attended') {
      stat.attended++;
    }
  }

  return Array.from(byTeacher.values()).map(t => ({
    teacherId: t.teacherId,
    teacherName: t.teacherName,
    lessonsPlanned: t.total,
    lessonsAttended: t.attended,
    attendanceRate: calculateAttendanceRate(t.attended, t.total),
  }));
}

/**
 * Рассчитывает информацию о долге из массива неоплаченных уроков
 */
export function calculateDebtInfo(unpaidLessons: Lesson[]): DebtInfo {
  return {
    hasDebt: unpaidLessons.length > 0,
    unpaidLessonsCount: unpaidLessons.length,
    unpaidAmountRub: unpaidLessons.reduce((sum, l) => sum + l.priceRub, 0),
  };
}

/**
 * Получает день недели на русском
 */
export function getDayOfWeekRu(date: Date): string {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return days[date.getDay()];
}

/**
 * Получает имя бота из переменных окружения
 */
export function getBotUsername(): string {
  return process.env.BOT_USERNAME || 'your_bot';
}

/**
 * Генерирует ссылку на Mini App
 */
export function generateInviteUrl(code: string): string {
  const bot = getBotUsername();
  return `https://t.me/${bot}/app?startapp=${code}`;
}

/**
 * Генерирует fallback-ссылку через start параметр
 */
export function generateFallbackUrl(code: string): string {
  const bot = getBotUsername();
  return `https://t.me/${bot}?start=${code}`;
}

/**
 * Формирует полное имя из firstName и lastName
 */
export function formatFullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ') || '';
}

