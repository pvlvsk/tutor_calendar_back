/**
 * Общие типы данных для всего приложения
 */

export type LessonStatus = 'planned' | 'done' | 'cancelled' | 'rescheduled';
export type AttendanceStatus = 'unknown' | 'attended' | 'missed';
export type PaymentStatus = 'unpaid' | 'paid' | 'prepaid';
export type CancelledBy = 'teacher' | 'student';
export type CancellationReason = 'illness' | 'other' | null;

export interface LessonFilters {
  subjectId?: string;
  studentId?: string;
  teacherId?: string;
  status?: string;
  paymentStatus?: string;
  attendance?: string;
}

// Базовая статистика посещаемости
export interface AttendanceStats {
  totalLessonsPlanned: number;
  totalLessonsAttended: number;
  totalLessonsMissed: number;
  cancelledByStudent: number;
  cancelledByTeacher: number;
  cancelledByIllness: number;
  attendanceRate: number;
}

// Статистика по предмету
export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  colorHex: string;
  lessonsPlanned: number;
  lessonsAttended: number;
  attendanceRate: number;
}

// Статистика по учителю
export interface TeacherStats {
  teacherId: string;
  teacherName: string;
  lessonsPlanned: number;
  lessonsAttended: number;
  attendanceRate: number;
}

// Полная статистика с разбивкой
export interface DetailedStats {
  total: AttendanceStats;
  bySubject: SubjectStats[];
  byTeacher?: TeacherStats[];
  currentStreak: number;
  maxStreak: number;
}

// Информация о долге (базовая)
export interface DebtInfo {
  hasDebt: boolean;
  unpaidLessonsCount: number;
  unpaidAmountRub: number;
}

// Детальный долг с уроками
export interface DetailedDebt extends DebtInfo {
  lessons: Array<{
    lessonId: string;
    startAt: string;
    priceRub: number;
    subjectName: string;
  }>;
}

// Долг с разбивкой по учителям
export interface DebtByTeachers {
  totalDebt: DebtInfo;
  byTeacher: Array<DebtInfo & {
    teacherId: string;
    teacherName: string;
    lessons: Array<{
      lessonId: string;
      startAt: string;
      priceRub: number;
      subjectName: string;
    }>;
  }>;
}

// Данные пользователя для ответов
export interface UserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl?: string | null;
}

// Краткие данные учителя
export interface TeacherInfo {
  firstName: string | null;
  lastName: string | null;
  username?: string | null;
}

// Краткие данные ученика
export interface StudentInfo {
  firstName: string | null;
  lastName: string | null;
  username?: string | null;
}

// Данные предмета
export interface SubjectInfo {
  name: string;
  colorHex: string;
}

// Расширенная статистика для карточки ученика (для учителя)
export interface StudentCardStats {
  debt: DebtInfo;
  nextLesson: {
    date: string;
    dayOfWeek: string;
    subjectName: string;
  } | null;
}

// Детальная статистика ученика (для учителя)
export interface StudentDetailedStatsForTeacher {
  debt: DetailedDebt;
  attendance: AttendanceStats;
  bySubject: SubjectStats[];
  recentMissedLessons: Array<{
    lessonId: string;
    startAt: string;
    subjectName: string;
    reason?: string;
  }>;
}

// Достижение
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  progress?: number;
  target?: number;
}

// Статистика ученика с геймификацией
export interface StudentGamifiedStats {
  total: AttendanceStats;
  bySubject: SubjectStats[];
  streak: {
    current: number;
    max: number;
  };
  achievements: Achievement[];
}

