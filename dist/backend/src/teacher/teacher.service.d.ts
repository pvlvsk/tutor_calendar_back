import { Repository } from 'typeorm';
import { TeacherProfile, StudentProfile, Subject, TeacherStudentLink, Lesson, LessonSeries, Invitation, ParentStudentRelation } from '../database/entities';
import { StatsService, DebtService } from '../shared';
import { LessonFilters } from '../shared/types';
export declare class TeacherService {
    private teacherProfileRepo;
    private subjectRepo;
    private linkRepo;
    private lessonRepo;
    private seriesRepo;
    private invitationRepo;
    private parentRelationRepo;
    private studentProfileRepo;
    private statsService;
    private debtService;
    constructor(teacherProfileRepo: Repository<TeacherProfile>, subjectRepo: Repository<Subject>, linkRepo: Repository<TeacherStudentLink>, lessonRepo: Repository<Lesson>, seriesRepo: Repository<LessonSeries>, invitationRepo: Repository<Invitation>, parentRelationRepo: Repository<ParentStudentRelation>, studentProfileRepo: Repository<StudentProfile>, statsService: StatsService, debtService: DebtService);
    getProfile(teacherId: string): Promise<{
        id: string;
        displayName: string;
        bio: string;
        referralCode: string;
        inviteUrl: string;
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
    }>;
    getSubjects(teacherId: string): Promise<Subject[]>;
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
        parentInvite: {
            code: string;
            url: string;
        };
        createdAt: string;
    }>;
    deleteStudent(teacherId: string, studentId: string): Promise<{
        success: boolean;
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
        student: {
            firstName: string;
            lastName: string;
        } | null;
        subject: {
            name: string;
            colorHex: string;
        };
        id: string;
        seriesId: string;
        teacherId: string;
        studentId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        createdAt: string;
        updatedAt: string;
    }[]>;
    getLessonDetails(teacherId: string, lessonId: string): Promise<{
        student: {
            firstName: string;
            lastName: string;
            username: string;
        } | null;
        subject: {
            name: string;
            colorHex: string;
        };
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
        studentId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        createdAt: string;
        updatedAt: string;
    }>;
    createLesson(teacherId: string, data: any): Promise<{
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
    } | {
        student: {
            firstName: string;
            lastName: string;
        } | null;
        subject: {
            name: string;
            colorHex: string;
        };
        id: string;
        seriesId: string;
        teacherId: string;
        studentId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        createdAt: string;
        updatedAt: string;
    }>;
    private createRecurringLessons;
    private convertToSeries;
    updateLesson(teacherId: string, lessonId: string, data: any, applyToSeries?: string): Promise<{
        student: {
            firstName: string;
            lastName: string;
        } | null;
        subject: {
            name: string;
            colorHex: string;
        };
        id: string;
        seriesId: string;
        teacherId: string;
        studentId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        cancelledBy: string;
        rescheduledTo: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNotePrivate: string;
        studentNoteForTeacher: string;
        reminderMinutesBefore: number;
        createdAt: string;
        updatedAt: string;
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
        studentId: string;
        subjectId: string;
        recurrence: {
            frequency: string;
            dayOfWeek: number;
            endDate: string;
        };
        timeOfDay: string;
        durationMinutes: number;
        priceRub: number;
        student: {
            firstName: string;
            lastName: string;
        } | null;
        subject: {
            name: string;
            colorHex: string;
        };
        lessonsCount: number;
        lessonsDone: number;
        lessonsRemaining: number;
    }[]>;
    getStudentLessons(teacherId: string, studentId: string, filters?: any): Promise<{
        id: string;
        seriesId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        cancelledBy: string;
        teacherNote: string;
        teacherNoteUpdatedAt: string | null;
        lessonReport: string;
        studentNoteForTeacher: string;
        subject: {
            name: string;
            colorHex: string;
        };
    }[]>;
    getStudentDebtDetails(teacherId: string, studentId: string): Promise<import("../shared").DetailedDebt>;
    getStudentCardStats(teacherId: string, studentId: string): Promise<import("../shared").StudentCardStats>;
    getStudentDetailedStats(teacherId: string, studentId: string): Promise<import("../shared").StudentDetailedStatsForTeacher>;
    private getLessonWithDetails;
    private formatLesson;
    private formatUserInfo;
}
