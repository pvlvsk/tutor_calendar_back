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
export interface AttendanceStats {
    totalLessonsPlanned: number;
    totalLessonsAttended: number;
    totalLessonsMissed: number;
    cancelledByStudent: number;
    cancelledByTeacher: number;
    cancelledByIllness: number;
    attendanceRate: number;
}
export interface SubjectStats {
    subjectId: string;
    subjectName: string;
    colorHex: string;
    lessonsPlanned: number;
    lessonsAttended: number;
    attendanceRate: number;
}
export interface TeacherStats {
    teacherId: string;
    teacherName: string;
    lessonsPlanned: number;
    lessonsAttended: number;
    attendanceRate: number;
}
export interface DetailedStats {
    total: AttendanceStats;
    bySubject: SubjectStats[];
    byTeacher?: TeacherStats[];
    currentStreak: number;
    maxStreak: number;
}
export interface DebtInfo {
    hasDebt: boolean;
    unpaidLessonsCount: number;
    unpaidAmountRub: number;
}
export interface DetailedDebt extends DebtInfo {
    lessons: Array<{
        lessonId: string;
        startAt: string;
        priceRub: number;
        subjectName: string;
    }>;
}
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
export interface UserInfo {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    avatarUrl?: string | null;
}
export interface TeacherInfo {
    firstName: string | null;
    lastName: string | null;
    username?: string | null;
}
export interface StudentInfo {
    firstName: string | null;
    lastName: string | null;
    username?: string | null;
}
export interface SubjectInfo {
    name: string;
    colorHex: string;
}
export interface StudentCardStats {
    debt: DebtInfo;
    nextLesson: {
        date: string;
        dayOfWeek: string;
        subjectName: string;
    } | null;
}
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
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string | null;
    progress?: number;
    target?: number;
}
export interface StudentGamifiedStats {
    total: AttendanceStats;
    bySubject: SubjectStats[];
    streak: {
        current: number;
        max: number;
    };
    achievements: Achievement[];
}
