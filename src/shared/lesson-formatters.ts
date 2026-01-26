/**
 * Общие утилиты для форматирования уроков
 *
 * Используется в:
 * - teacher.service.ts
 * - student.service.ts
 * - parent.service.ts
 */

import { Lesson, LessonStudent } from "../database/entities";

// ============================================
// Типы
// ============================================

export interface FormattedSubject {
  name: string | undefined;
  colorHex: string | undefined;
}

export interface FormattedTeacher {
  firstName: string | undefined;
  lastName: string | undefined;
  username?: string | undefined;
}

export interface FormattedStudent {
  id: string;
  studentId: string;
  firstName: string | undefined;
  lastName: string | undefined;
  username: string | undefined;
  priceRub: number;
  attendance: string;
  rating: number | null;
  paymentStatus: string;
  paymentType: string | null;
  paidFromSubscription: boolean;
}

// ============================================
// Функции форматирования
// ============================================

/**
 * Проверяет, является ли урок групповым
 */
export function isGroupLesson(
  lesson: { lessonStudents?: { length: number } | null },
  studentsCount?: number
): boolean {
  const count = studentsCount ?? lesson.lessonStudents?.length ?? 0;
  return count > 1;
}

/**
 * Подсчитывает количество учеников на уроке
 */
export function getStudentsCount(
  lesson: { lessonStudents?: Array<unknown> | null }
): number {
  return lesson.lessonStudents?.length ?? 0;
}

/**
 * Форматирует предмет для API-ответа
 */
export function formatSubject(
  subject: { name?: string; colorHex?: string } | null | undefined
): FormattedSubject | null {
  if (!subject) return null;
  return {
    name: subject.name,
    colorHex: subject.colorHex,
  };
}

/**
 * Форматирует учителя для API-ответа
 */
export function formatTeacher(
  teacher: { user?: { firstName?: string; lastName?: string; username?: string } | null } | null | undefined
): FormattedTeacher | null {
  if (!teacher?.user) return null;
  return {
    firstName: teacher.user.firstName,
    lastName: teacher.user.lastName,
    username: teacher.user.username,
  };
}

/**
 * Форматирует студента для API-ответа (из LessonStudent)
 */
export function formatLessonStudent(ls: LessonStudent): FormattedStudent {
  return {
    id: ls.id,
    studentId: ls.studentId,
    firstName: ls.student?.user?.firstName,
    lastName: ls.student?.user?.lastName,
    username: ls.student?.user?.username,
    priceRub: ls.priceRub,
    attendance: ls.attendance,
    rating: ls.rating,
    paymentStatus: ls.paymentStatus,
    paymentType: ls.paymentType,
    paidFromSubscription: ls.paidFromSubscription,
  };
}

/**
 * Форматирует дату для API-ответа (ISO string или null)
 */
export function formatDateOrNull(date: Date | null | undefined): string | null {
  return date?.toISOString() ?? null;
}

/**
 * Рассчитывает количество "других учеников" для ученика/родителя
 * (всего - 1, но не меньше 0)
 */
export function calculateOtherStudentsCount(totalCount: number): number {
  return Math.max(0, totalCount - 1);
}

// ============================================
// Комплексное форматирование
// ============================================

/**
 * Базовые поля урока для всех ролей
 */
export interface BaseLessonFields {
  id: string;
  seriesId: string | null;
  teacherId: string;
  subjectId: string | null;
  startAt: string;
  durationMinutes: number;
  status: string;
  isGroupLesson: boolean;
  meetingUrl: string | null;
  reminderMinutesBefore: number | null;
  teacherNote: string | null;
  lessonReport: string | null;
  studentNotePrivate: string | null;
  studentNoteForTeacher: string | null;
}

/**
 * Извлекает базовые поля урока (общие для всех ролей)
 */
export function extractBaseLessonFields(lesson: Lesson): BaseLessonFields {
  const studentsCount = getStudentsCount(lesson);

  return {
    id: lesson.id,
    seriesId: lesson.seriesId ?? null,
    teacherId: lesson.teacherId,
    subjectId: lesson.subjectId,
    startAt: lesson.startAt.toISOString(),
    durationMinutes: lesson.durationMinutes,
    status: lesson.status,
    isGroupLesson: isGroupLesson(lesson, studentsCount),
    meetingUrl: lesson.meetingUrl ?? null,
    reminderMinutesBefore: lesson.reminderMinutesBefore ?? null,
    teacherNote: lesson.teacherNote ?? null,
    lessonReport: lesson.lessonReport ?? null,
    studentNotePrivate: lesson.studentNotePrivate ?? null,
    studentNoteForTeacher: lesson.studentNoteForTeacher ?? null,
  };
}
