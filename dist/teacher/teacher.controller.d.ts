import { TeacherService } from "./teacher.service";
import { CalendarImportService } from "./calendar-import.service";
import { CalendarPreviewDto, CalendarImportDto, CalendarPreviewResponseDto, ImportResultResponseDto } from "./calendar-import.dto";
export declare class TeacherController {
    private teacherService;
    private calendarImportService;
    constructor(teacherService: TeacherService, calendarImportService: CalendarImportService);
    getProfile(req: any): Promise<{
        id: string;
        displayName: string;
        bio: string;
        referralCode: string;
        inviteUrl: string;
        city: string;
        timezone: string;
    }>;
    getInviteLink(req: any): Promise<{
        referralCode: string;
        inviteUrl: string;
        fallbackUrl: string;
    }>;
    updateProfile(req: any, body: {
        displayName?: string;
        bio?: string;
    }): Promise<{
        id: string;
        displayName: string;
        bio: string;
        referralCode: string;
        inviteUrl: string;
        city: string;
        timezone: string;
    }>;
    getSubjects(req: any): Promise<import("../database/entities").Subject[]>;
    createSubject(req: any, body: {
        name: string;
        code?: string;
        colorHex: string;
    }): Promise<import("../database/entities").Subject>;
    updateSubject(req: any, subjectId: string, body: {
        name?: string;
        colorHex?: string;
    }): Promise<import("../database/entities").Subject | null>;
    deleteSubject(req: any, subjectId: string): Promise<{
        success: boolean;
        action: string;
        lessonsCount: number;
    } | {
        success: boolean;
        action: string;
        lessonsCount?: undefined;
    }>;
    getArchivedSubjects(req: any): Promise<import("../database/entities").Subject[]>;
    restoreSubject(req: any, subjectId: string): Promise<{
        success: boolean;
    }>;
    getStudents(req: any): Promise<{
        students: {
            studentId: string;
            studentUser: {
                id: any;
                firstName: any;
                lastName: any;
                username: any;
            };
            customFields: Record<string, string>;
            subjects: {
                subjectId: string;
                name: string;
                colorHex: string;
            }[];
            stats: import("../shared").AttendanceStats;
            debt: import("../shared").DebtInfo;
            createdAt: string;
        }[];
        archivedCount: number;
    }>;
    createStudentInvitation(req: any): Promise<{
        invitationId: string;
        token: string;
        inviteUrl: string;
        expiresAt: string;
    }>;
    getArchivedStudents(req: any): Promise<{
        studentId: string;
        studentUser: {
            id: any;
            firstName: any;
            lastName: any;
            username: any;
        };
        customFields: Record<string, string>;
        archivedAt: string;
        deleteAt: string;
        daysLeft: number;
        createdAt: string;
    }[]>;
    getStudentDetails(req: any, studentId: string): Promise<{
        studentId: string;
        studentUser: {
            id: any;
            firstName: any;
            lastName: any;
            username: any;
        };
        customFields: Record<string, string>;
        stats: import("../shared").AttendanceStats;
        debt: import("../shared").DebtInfo;
        subscription: {
            id: string;
            type: import("../database/entities").SubscriptionType;
            totalLessons: number | null;
            usedLessons: number;
            remainingLessons: number | null;
            expiresAt: string | null;
            name: string;
            isExpired: boolean;
            isActive: boolean;
            createdAt: string;
        } | null;
        parentInvite: {
            code: string;
            url: string;
        };
        createdAt: string;
    }>;
    updateStudent(req: any, studentId: string, body: {
        customFields: Record<string, string>;
    }): Promise<{
        studentId: string;
        studentUser: {
            id: any;
            firstName: any;
            lastName: any;
            username: any;
        };
        customFields: Record<string, string>;
        stats: import("../shared").AttendanceStats;
        debt: import("../shared").DebtInfo;
        subscription: {
            id: string;
            type: import("../database/entities").SubscriptionType;
            totalLessons: number | null;
            usedLessons: number;
            remainingLessons: number | null;
            expiresAt: string | null;
            name: string;
            isExpired: boolean;
            isActive: boolean;
            createdAt: string;
        } | null;
        parentInvite: {
            code: string;
            url: string;
        };
        createdAt: string;
    }>;
    deleteStudent(req: any, studentId: string, body: {
        deleteIndividualLessons?: boolean;
    }): Promise<{
        success: boolean;
        action: string;
        restoreUntil: string;
    }>;
    restoreStudent(req: any, studentId: string): Promise<{
        success: boolean;
    }>;
    createParentInvitation(req: any, studentId: string): Promise<{
        invitationId: string;
        token: string;
        inviteUrl: string;
        expiresAt: string;
    }>;
    getStudentParents(req: any, studentId: string): Promise<{
        parentId: string;
        parentUser: {
            id: any;
            firstName: any;
            lastName: any;
            username: any;
        };
        notificationsEnabled: boolean;
        createdAt: string;
    }[]>;
    updateParentNotifications(req: any, studentId: string, parentId: string, body: {
        notificationsEnabled: boolean;
    }): Promise<{
        success: boolean;
        notificationsEnabled: boolean;
    }>;
    getLessons(req: any, from: string, to: string, subjectId?: string, studentId?: string, status?: string): Promise<{
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        isGroupLesson: boolean;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        createdAt: string;
        updatedAt: string;
        students: {
            id: string;
            studentId: string;
            firstName: string;
            lastName: string;
            username: string;
            priceRub: number;
            attendance: string;
            rating: number | null;
            paymentStatus: string;
            paymentType: import("../database/entities").PaymentType;
            paidFromSubscription: boolean;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
    }[]>;
    createLesson(req: any, body: any): Promise<{
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        isGroupLesson: boolean;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        createdAt: string;
        updatedAt: string;
        students: {
            id: string;
            studentId: string;
            firstName: string;
            lastName: string;
            username: string;
            priceRub: number;
            attendance: string;
            rating: number | null;
            paymentStatus: string;
            paymentType: import("../database/entities").PaymentType;
            paidFromSubscription: boolean;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
    } | {
        series: {
            id: string;
            frequency: string;
            dayOfWeek: number;
            timeOfDay: string;
        };
        lessonsCreated: number;
        lessons: {
            id: string;
            startAt: string;
            status: string;
        }[];
    }>;
    getLessonDetails(req: any, lessonId: string): Promise<{
        series: {
            id: string;
            recurrence: {
                frequency: string;
                dayOfWeek: number;
            };
        } | null;
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        isGroupLesson: boolean;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        createdAt: string;
        updatedAt: string;
        students: {
            id: string;
            studentId: string;
            firstName: string;
            lastName: string;
            username: string;
            priceRub: number;
            attendance: string;
            rating: number | null;
            paymentStatus: string;
            paymentType: import("../database/entities").PaymentType;
            paidFromSubscription: boolean;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
    }>;
    updateLesson(req: any, lessonId: string, body: any, applyToSeries?: string): Promise<{
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        isGroupLesson: boolean;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        createdAt: string;
        updatedAt: string;
        students: {
            id: string;
            studentId: string;
            firstName: string;
            lastName: string;
            username: string;
            priceRub: number;
            attendance: string;
            rating: number | null;
            paymentStatus: string;
            paymentType: import("../database/entities").PaymentType;
            paidFromSubscription: boolean;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
    } | {
        series: {
            id: string;
            frequency: string;
        };
        lessonsCreated: number;
        lessons: {
            id: string;
            startAt: string;
            status: string;
        }[];
    }>;
    deleteLesson(req: any, lessonId: string, applyToSeries?: string): Promise<{
        success: boolean;
    }>;
    addStudentToLesson(req: any, lessonId: string, body: {
        studentId: string;
        priceRub?: number;
    }): Promise<{
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        isGroupLesson: boolean;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        createdAt: string;
        updatedAt: string;
        students: {
            id: string;
            studentId: string;
            firstName: string;
            lastName: string;
            username: string;
            priceRub: number;
            attendance: string;
            rating: number | null;
            paymentStatus: string;
            paymentType: import("../database/entities").PaymentType;
            paidFromSubscription: boolean;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
    }>;
    removeStudentFromLesson(req: any, lessonId: string, studentId: string): Promise<{
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        isGroupLesson: boolean;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        createdAt: string;
        updatedAt: string;
        students: {
            id: string;
            studentId: string;
            firstName: string;
            lastName: string;
            username: string;
            priceRub: number;
            attendance: string;
            rating: number | null;
            paymentStatus: string;
            paymentType: import("../database/entities").PaymentType;
            paidFromSubscription: boolean;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
    }>;
    updateLessonStudent(req: any, lessonId: string, studentId: string, body: {
        paymentStatus?: "paid" | "unpaid";
    }): Promise<{
        success: boolean;
        paymentStatus: string;
    }>;
    completeLesson(req: any, lessonId: string, body: {
        students: Array<{
            studentId: string;
            attendance: "attended" | "missed";
            rating?: number;
            paymentStatus?: "paid" | "unpaid";
            useSubscription?: boolean;
        }>;
    }): Promise<{
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        isGroupLesson: boolean;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        createdAt: string;
        updatedAt: string;
        students: {
            id: string;
            studentId: string;
            firstName: string;
            lastName: string;
            username: string;
            priceRub: number;
            attendance: string;
            rating: number | null;
            paymentStatus: string;
            paymentType: import("../database/entities").PaymentType;
            paidFromSubscription: boolean;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
    }>;
    bulkUpdateLessonStudents(req: any, lessonId: string, body: {
        action: "set_attendance" | "set_rating" | "set_payment";
        value: string | number;
    }): Promise<{
        id: string;
        seriesId: string;
        teacherId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        isGroupLesson: boolean;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        meetingUrl: string;
        createdAt: string;
        updatedAt: string;
        students: {
            id: string;
            studentId: string;
            firstName: string;
            lastName: string;
            username: string;
            priceRub: number;
            attendance: string;
            rating: number | null;
            paymentStatus: string;
            paymentType: import("../database/entities").PaymentType;
            paidFromSubscription: boolean;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
    }>;
    getLessonSeries(req: any): Promise<{
        id: string;
        subjectId: string | null;
        recurrence: {
            frequency: string;
            dayOfWeek: number;
            endDate: string;
        };
        timeOfDay: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        students: {
            studentId: string;
            firstName: string;
            lastName: string;
            priceRub: number;
        }[];
        subject: {
            name: string;
            colorHex: string;
        } | null;
        lessonsCount: number;
        lessonsDone: number;
        lessonsRemaining: number;
    }[]>;
    getStudentLessons(req: any, studentId: string, filters: any): Promise<{
        id: string;
        seriesId: string;
        subjectId: string | null;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        isFree: boolean;
        status: string;
        cancelledBy: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNoteForTeacher: string;
        subject: {
            name: string;
            colorHex: string;
        } | null;
    }[]>;
    getStudentDebt(req: any, studentId: string): Promise<import("../shared").DetailedDebt>;
    getStudentStats(req: any, studentId: string): Promise<import("../shared").StudentCardStats>;
    getStudentDetailedStats(req: any, studentId: string): Promise<import("../shared").StudentDetailedStatsForTeacher>;
    getStudentSubscription(req: any, studentId: string): Promise<{
        id: string;
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
    createSubscription(req: any, studentId: string, body: {
        type: "lessons" | "date";
        totalLessons?: number;
        expiresAt?: string;
        name?: string;
    }): Promise<{
        id: string;
        type: import("../database/entities").SubscriptionType;
        totalLessons: number | null;
        usedLessons: number;
        remainingLessons: number | null;
        expiresAt: string | null;
        name: string;
        isExpired: boolean;
        isActive: boolean;
        createdAt: string;
    }>;
    deleteSubscription(req: any, subscriptionId: string): Promise<{
        success: boolean;
    }>;
    restoreSubscription(req: any, subscriptionId: string): Promise<{
        id: string;
        type: import("../database/entities").SubscriptionType;
        totalLessons: number | null;
        usedLessons: number;
        remainingLessons: number | null;
        expiresAt: string | null;
        name: string;
        isExpired: boolean;
        isActive: boolean;
        createdAt: string;
    }>;
    hasActiveSubscription(req: any, studentId: string): Promise<{
        hasSubscription: boolean;
        subscription?: {
            id: string;
            name: string | null;
            type: "lessons" | "date";
            remainingLessons: number | null;
            expiresAt: string | null;
            displayText: string;
        };
    }>;
    getArchivedSubscriptions(req: any, studentId: string): Promise<{
        id: string;
        type: import("../database/entities").SubscriptionType;
        totalLessons: number | null;
        usedLessons: number;
        remainingLessons: number | null;
        expiresAt: string | null;
        name: string;
        isDeleted: boolean;
        isExpired: boolean;
        createdAt: string;
        deletedAt: string | null;
    }[]>;
    getCalendarPreview(req: any, body: CalendarPreviewDto): Promise<CalendarPreviewResponseDto>;
    importCalendar(req: any, body: CalendarImportDto): Promise<ImportResultResponseDto>;
}
