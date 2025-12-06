export type RecurrenceFrequency = 'none' | 'weekly' | 'biweekly' | 'monthly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type LessonStatus = 'planned' | 'done' | 'cancelled' | 'rescheduled';
export type AttendanceStatus = 'attended' | 'missed' | 'unknown';
export type PaymentStatus = 'unpaid' | 'paid' | 'prepaid';
export type CancelledBy = 'teacher' | 'student';
export type CancellationReason = 'illness' | 'other' | null;
export interface LessonRecurrence {
    frequency: RecurrenceFrequency;
    dayOfWeek?: DayOfWeek;
    endDate?: string;
    maxOccurrences?: number;
}
export interface LessonSeries {
    id: string;
    teacherId: string;
    studentId?: string;
    subjectId: string;
    recurrence: LessonRecurrence;
    timeOfDay: string;
    durationMinutes: number;
    priceRub: number;
    createdAt: string;
    updatedAt: string;
}
export interface Lesson {
    id: string;
    seriesId?: string;
    teacherId: string;
    studentId?: string;
    subjectId: string;
    startAt: string;
    durationMinutes: number;
    priceRub: number;
    status: LessonStatus;
    attendance: AttendanceStatus;
    paymentStatus: PaymentStatus;
    cancelledBy?: CancelledBy;
    cancellationReason?: CancellationReason;
    teacherNote?: string;
    teacherNoteUpdatedAt?: string;
    lessonReport?: string;
    studentNotePrivate?: string;
    studentNoteForTeacher?: string;
    reminderMinutesBefore?: number;
    createdAt: string;
    updatedAt: string;
}
export interface LessonWithDetailsForTeacher extends Lesson {
    student?: {
        firstName?: string;
        lastName?: string;
        username?: string;
    };
    subject: {
        name: string;
        colorHex: string;
    };
}
export interface LessonWithDetailsForStudent {
    id: string;
    seriesId?: string;
    teacherId: string;
    subjectId: string;
    startAt: string;
    durationMinutes: number;
    status: LessonStatus;
    attendance: AttendanceStatus;
    paymentStatus?: PaymentStatus;
    cancelledBy?: CancelledBy;
    teacherNote?: string;
    teacherNoteUpdatedAt?: string;
    lessonReport?: string;
    studentNotePrivate?: string;
    studentNoteForTeacher?: string;
    reminderMinutesBefore?: number;
    teacher: {
        firstName?: string;
        lastName?: string;
        username?: string;
        avatarUrl?: string;
    };
    subject: {
        name: string;
        colorHex: string;
    };
}
export interface LessonWithDetailsForParent {
    id: string;
    seriesId?: string;
    teacherId: string;
    subjectId: string;
    startAt: string;
    durationMinutes: number;
    priceRub: number;
    status: LessonStatus;
    attendance: AttendanceStatus;
    paymentStatus: PaymentStatus;
    cancelledBy?: CancelledBy;
    teacherNote?: string;
    teacherNoteUpdatedAt?: string;
    lessonReport?: string;
    teacher: {
        firstName?: string;
        lastName?: string;
        username?: string;
        avatarUrl?: string;
    };
    subject: {
        name: string;
        colorHex: string;
    };
}
export interface StudentStats {
    totalLessonsPlanned: number;
    totalLessonsAttended: number;
    totalLessonsMissed: number;
    cancelledByStudent: number;
    cancelledByTeacher: number;
    cancelledByIllness: number;
    attendanceRate: number;
}
import { DebtInfo } from './stats';
export interface StudentListItem {
    studentId: string;
    studentUser: {
        id: string;
        firstName?: string;
        lastName?: string;
        username?: string;
        avatarUrl?: string;
    };
    subjects: Array<{
        subjectId: string;
        name: string;
        colorHex: string;
    }>;
    customFields?: Record<string, string | undefined>;
    stats: StudentStats;
    debt: DebtInfo;
    createdAt?: string;
}
export interface StudentDetails extends StudentListItem {
    customFields?: Record<string, string | undefined>;
    parentInvite?: {
        code: string;
        url: string;
    };
}
export interface TeacherListItem {
    teacherId: string;
    teacherUser: {
        id: string;
        firstName?: string;
        lastName?: string;
        username?: string;
        avatarUrl?: string;
    };
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    subjects: Array<{
        subjectId: string;
        name: string;
        colorHex: string;
    }>;
}
export interface TeacherDetailsForStudent extends TeacherListItem {
    statsWithTeacher: {
        totalLessonsDone: number;
        totalLessonsAttended: number;
        totalLessonsMissed: number;
    };
}
export interface StudentNotificationSettings {
    studentId: string;
    defaultReminderMinutesBefore: number;
    enableLessonReminders: boolean;
    enableLessonReports: boolean;
}
export interface ParentNotificationSettings {
    parentId: string;
    enableLessonReports: boolean;
}
