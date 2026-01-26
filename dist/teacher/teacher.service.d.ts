import { Repository } from "typeorm";
import { TeacherProfile, StudentProfile, Subject, TeacherStudentLink, Lesson, LessonSeries, LessonStudent, LessonSeriesStudent, Invitation, ParentStudentRelation, Subscription, SubscriptionType } from "../database/entities";
import { StatsService, DebtService } from "../shared";
import { LessonFilters } from "../shared/types";
import { BotService } from "../bot/bot.service";
export declare class TeacherService {
    private teacherProfileRepo;
    private subjectRepo;
    private linkRepo;
    private lessonRepo;
    private seriesRepo;
    private lessonStudentRepo;
    private seriesStudentRepo;
    private invitationRepo;
    private parentRelationRepo;
    private studentProfileRepo;
    private subscriptionRepo;
    private statsService;
    private debtService;
    private botService;
    constructor(teacherProfileRepo: Repository<TeacherProfile>, subjectRepo: Repository<Subject>, linkRepo: Repository<TeacherStudentLink>, lessonRepo: Repository<Lesson>, seriesRepo: Repository<LessonSeries>, lessonStudentRepo: Repository<LessonStudent>, seriesStudentRepo: Repository<LessonSeriesStudent>, invitationRepo: Repository<Invitation>, parentRelationRepo: Repository<ParentStudentRelation>, studentProfileRepo: Repository<StudentProfile>, subscriptionRepo: Repository<Subscription>, statsService: StatsService, debtService: DebtService, botService: BotService);
    getProfile(teacherId: string): Promise<{
        id: string;
        displayName: string;
        bio: string;
        referralCode: string;
        inviteUrl: string;
        city: string;
        timezone: string;
    }>;
    getInviteLink(teacherId: string): Promise<{
        referralCode: string;
        inviteUrl: string;
        fallbackUrl: string;
    }>;
    updateProfile(teacherId: string, data: {
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
    getSubjects(teacherId: string): Promise<Subject[]>;
    getArchivedSubjects(teacherId: string): Promise<Subject[]>;
    createSubject(teacherId: string, data: {
        name: string;
        code?: string;
        colorHex: string;
    }): Promise<Subject>;
    private generateCode;
    updateSubject(teacherId: string, subjectId: string, data: {
        name?: string;
        colorHex?: string;
    }): Promise<Subject | null>;
    deleteSubject(teacherId: string, subjectId: string): Promise<{
        success: boolean;
        action: string;
        lessonsCount: number;
    } | {
        success: boolean;
        action: string;
        lessonsCount?: undefined;
    }>;
    restoreSubject(teacherId: string, subjectId: string): Promise<{
        success: boolean;
    }>;
    getStudents(teacherId: string): Promise<{
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
    }[]>;
    getStudentDetails(teacherId: string, studentId: string): Promise<{
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
            type: SubscriptionType;
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
    updateStudentCustomFields(teacherId: string, studentId: string, customFields: Record<string, string>): Promise<{
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
            type: SubscriptionType;
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
    deleteStudent(teacherId: string, studentId: string, deleteIndividualLessons?: boolean): Promise<{
        success: boolean;
        action: string;
        restoreUntil: string;
    }>;
    private processStudentLessonsOnArchive;
    getArchivedStudents(teacherId: string): Promise<{
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
    restoreStudent(teacherId: string, studentId: string): Promise<{
        success: boolean;
    }>;
    cleanupExpiredArchives(): Promise<{
        deleted: number;
    }>;
    createStudentInvitation(teacherId: string): Promise<{
        invitationId: string;
        token: string;
        inviteUrl: string;
        expiresAt: string;
    }>;
    createParentInvitation(teacherId: string, studentId: string): Promise<{
        invitationId: string;
        token: string;
        inviteUrl: string;
        expiresAt: string;
    }>;
    getStudentParents(teacherId: string, studentId: string): Promise<{
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
    updateParentNotifications(teacherId: string, studentId: string, parentId: string, notificationsEnabled: boolean): Promise<{
        success: boolean;
        notificationsEnabled: boolean;
    }>;
    getLessons(teacherId: string, from: string, to: string, filters?: LessonFilters): Promise<{
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
    getLessonDetails(teacherId: string, lessonId: string): Promise<{
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
    createLesson(teacherId: string, data: any): Promise<{
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
    private createRecurringLessons;
    private convertToSeries;
    updateLesson(teacherId: string, lessonId: string, data: any, applyToSeries?: string): Promise<{
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
    deleteLesson(teacherId: string, lessonId: string, applyToSeries?: string): Promise<{
        success: boolean;
    }>;
    getLessonSeries(teacherId: string): Promise<{
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
    getStudentLessons(teacherId: string, studentId: string, filters?: any): Promise<{
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
    getStudentDebtDetails(teacherId: string, studentId: string): Promise<import("../shared").DetailedDebt>;
    getStudentCardStats(teacherId: string, studentId: string): Promise<import("../shared").StudentCardStats>;
    getStudentDetailedStats(teacherId: string, studentId: string): Promise<import("../shared").StudentDetailedStatsForTeacher>;
    addStudentToLesson(teacherId: string, lessonId: string, studentId: string, priceRub?: number): Promise<{
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
    removeStudentFromLesson(teacherId: string, lessonId: string, studentId: string): Promise<{
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
    updateLessonStudent(teacherId: string, lessonId: string, studentId: string, data: {
        paymentStatus?: "paid" | "unpaid";
    }): Promise<{
        success: boolean;
        paymentStatus: string;
    }>;
    completeLesson(teacherId: string, lessonId: string, studentsData: Array<{
        studentId: string;
        attendance: "attended" | "missed";
        rating?: number;
        paymentStatus?: "paid" | "unpaid";
        useSubscription?: boolean;
    }>): Promise<{
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
    bulkUpdateLessonStudents(teacherId: string, lessonId: string, action: "set_attendance" | "set_rating" | "set_payment", value: string | number): Promise<{
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
    private getLessonWithDetails;
    private formatLessonWithStudents;
    private formatLesson;
    private formatUserInfo;
    private notifyStudentsAboutNewLesson;
    getStudentSubscription(teacherId: string, studentId: string): Promise<{
        id: string;
        type: SubscriptionType;
        totalLessons: number | null;
        usedLessons: number;
        remainingLessons: number | null;
        expiresAt: string | null;
        name: string;
        isExpired: boolean;
        isActive: boolean;
        createdAt: string;
    } | null>;
    createSubscription(teacherId: string, studentId: string, data: {
        type: SubscriptionType;
        totalLessons?: number;
        expiresAt?: string;
        name?: string;
    }): Promise<{
        id: string;
        type: SubscriptionType;
        totalLessons: number | null;
        usedLessons: number;
        remainingLessons: number | null;
        expiresAt: string | null;
        name: string;
        isExpired: boolean;
        isActive: boolean;
        createdAt: string;
    }>;
    deleteSubscription(teacherId: string, subscriptionId: string): Promise<{
        success: boolean;
    }>;
    restoreSubscription(teacherId: string, subscriptionId: string): Promise<{
        id: string;
        type: SubscriptionType;
        totalLessons: number | null;
        usedLessons: number;
        remainingLessons: number | null;
        expiresAt: string | null;
        name: string;
        isExpired: boolean;
        isActive: boolean;
        createdAt: string;
    }>;
    useSubscriptionLesson(teacherId: string, studentId: string): Promise<boolean>;
    hasActiveSubscription(teacherId: string, studentId: string): Promise<{
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
    private getLessonEnding;
    getArchivedSubscriptions(teacherId: string, studentId: string): Promise<{
        id: string;
        type: SubscriptionType;
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
    private formatSubscription;
    private formatSubscriptionArchived;
}
