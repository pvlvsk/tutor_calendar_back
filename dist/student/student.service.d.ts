import { Repository } from "typeorm";
import { StudentProfile, TeacherStudentLink, Lesson, LessonStudent, StudentNotificationSettings, Subject, Subscription } from "../database/entities";
import { StatsService, AchievementsService } from "../shared";
import { LessonFilters, StudentGamifiedStats } from "../shared/types";
export declare class StudentService {
    private studentProfileRepo;
    private linkRepo;
    private lessonRepo;
    private lessonStudentRepo;
    private notificationSettingsRepo;
    private subjectRepo;
    private subscriptionRepo;
    private statsService;
    private achievementsService;
    constructor(studentProfileRepo: Repository<StudentProfile>, linkRepo: Repository<TeacherStudentLink>, lessonRepo: Repository<Lesson>, lessonStudentRepo: Repository<LessonStudent>, notificationSettingsRepo: Repository<StudentNotificationSettings>, subjectRepo: Repository<Subject>, subscriptionRepo: Repository<Subscription>, statsService: StatsService, achievementsService: AchievementsService);
    getProfile(studentId: string): Promise<{
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
    getParentInviteLink(studentId: string): Promise<{
        parentInviteCode: string;
        inviteUrl: string;
        fallbackUrl: string;
    }>;
    updateProfile(studentId: string, customFields: Record<string, string>): Promise<{
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
    getTeachers(studentId: string): Promise<{
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
    getTeacherDetails(studentId: string, teacherId: string): Promise<{
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
    getLessons(studentId: string, from: string, to: string, filters?: LessonFilters): Promise<{
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
    getLessonDetails(studentId: string, lessonId: string): Promise<{
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
    updateLessonNotes(studentId: string, lessonId: string, data: {
        studentNotePrivate?: string;
        studentNoteForTeacher?: string;
        reminderMinutesBefore?: number;
    }): Promise<{
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
    cancelLesson(studentId: string, lessonId: string): Promise<{
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
    getStats(studentId: string): Promise<StudentGamifiedStats>;
    private calculateStreak;
    getStatsWithTeacher(studentId: string, teacherId: string): Promise<import("../shared").AttendanceStats>;
    getNotificationSettings(studentId: string): Promise<{
        defaultReminderMinutesBefore: number;
        enableLessonReminders: boolean;
        enableLessonReports: boolean;
    }>;
    updateNotificationSettings(studentId: string, data: {
        defaultReminderMinutesBefore?: number;
        enableLessonReminders?: boolean;
        enableLessonReports?: boolean;
    }): Promise<{
        defaultReminderMinutesBefore: number;
        enableLessonReminders: boolean;
        enableLessonReports: boolean;
    }>;
    getSubscriptions(studentId: string): Promise<{
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
    getSubscriptionByTeacher(studentId: string, teacherId: string): Promise<{
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
    private formatSubscription;
    private formatUserInfo;
}
