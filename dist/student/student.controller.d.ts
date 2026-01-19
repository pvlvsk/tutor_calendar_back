import { StudentService } from './student.service';
export declare class StudentController {
    private studentService;
    constructor(studentService: StudentService);
    getProfile(req: any): Promise<{
        id: string;
        userId: string;
        user: {
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
        };
        customFields: Record<string, string>;
        createdAt: string;
        updatedAt: string;
    }>;
    getParentInviteLink(req: any): Promise<{
        parentInviteCode: string;
        inviteUrl: string;
        fallbackUrl: string;
    }>;
    updateProfile(req: any, body: {
        customFields: Record<string, string>;
    }): Promise<{
        id: string;
        userId: string;
        user: {
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
        };
        customFields: Record<string, string>;
        createdAt: string;
        updatedAt: string;
    }>;
    getTeachers(req: any): Promise<{
        teacherId: string;
        teacherUser: {
            id: any;
            firstName: any;
            lastName: any;
            username: any;
        };
        displayName: string;
        bio: string;
        subjects: {
            subjectId: string;
            name: string;
            colorHex: string;
        }[];
    }[]>;
    getTeacherDetails(req: any, teacherId: string): Promise<{
        teacherId: string;
        teacherUser: {
            id: any;
            firstName: any;
            lastName: any;
            username: any;
        };
        displayName: string;
        bio: string;
        subjects: {
            subjectId: string;
            name: string;
            colorHex: string;
        }[];
        statsWithTeacher: import("../shared").AttendanceStats;
    }>;
    getLessons(req: any, from: string, to: string, subjectId?: string, teacherId?: string, status?: string): Promise<{
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        teacherNote: string;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        isGroupLesson: boolean;
        totalStudentsCount: number;
        otherStudentsCount: number;
        teacher: {
            firstName: string;
            lastName: string;
        };
        subject: {
            name: string;
            colorHex: string;
        };
    }[]>;
    getLessonDetails(req: any, lessonId: string): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        priceRub: number;
        rating: number | null;
        teacherNote: string;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        isGroupLesson: boolean;
        totalStudentsCount: number;
        otherStudentsCount: number;
        teacher: {
            firstName: string;
            lastName: string;
            username: string;
        };
        subject: {
            name: string;
            colorHex: string;
        };
        createdAt: string;
        updatedAt: string;
    }>;
    updateLessonNotes(req: any, lessonId: string, body: any): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        priceRub: number;
        rating: number | null;
        teacherNote: string;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        isGroupLesson: boolean;
        totalStudentsCount: number;
        otherStudentsCount: number;
        teacher: {
            firstName: string;
            lastName: string;
            username: string;
        };
        subject: {
            name: string;
            colorHex: string;
        };
        createdAt: string;
        updatedAt: string;
    }>;
    cancelLesson(req: any, lessonId: string): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        priceRub: number;
        rating: number | null;
        teacherNote: string;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        isGroupLesson: boolean;
        totalStudentsCount: number;
        otherStudentsCount: number;
        teacher: {
            firstName: string;
            lastName: string;
            username: string;
        };
        subject: {
            name: string;
            colorHex: string;
        };
        createdAt: string;
        updatedAt: string;
    }>;
    getStats(req: any): Promise<import("../shared").StudentGamifiedStats>;
    getStatsWithTeacher(req: any, teacherId: string): Promise<import("../shared").AttendanceStats>;
    getNotificationSettings(req: any): Promise<{
        defaultReminderMinutesBefore: number;
        enableLessonReminders: boolean;
        enableLessonReports: boolean;
    }>;
    updateNotificationSettings(req: any, body: any): Promise<{
        defaultReminderMinutesBefore: number;
        enableLessonReminders: boolean;
        enableLessonReports: boolean;
    }>;
    getSubscriptions(req: any): Promise<{
        id: string;
        teacherId: string;
        teacherName: string;
        type: import("../database/entities").SubscriptionType;
        totalLessons: number | null;
        usedLessons: number;
        remainingLessons: number | null;
        expiresAt: string | null;
        name: string;
        isExpired: boolean;
        isActive: boolean;
        createdAt: string;
    }[]>;
    getSubscriptionByTeacher(req: any, teacherId: string): Promise<{
        id: string;
        teacherId: string;
        teacherName: string;
        type: import("../database/entities").SubscriptionType;
        totalLessons: number | null;
        usedLessons: number;
        remainingLessons: number | null;
        expiresAt: string | null;
        name: string;
        isExpired: boolean;
        isActive: boolean;
        createdAt: string;
    } | null>;
}
