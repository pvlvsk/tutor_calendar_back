import { Repository } from 'typeorm';
import { ParentProfile, ParentStudentRelation, TeacherStudentLink, Lesson, StudentProfile, TeacherProfile, Subject } from '../database/entities';
import { StatsService, DebtService } from '../shared';
import { LessonFilters } from '../shared/types';
export declare class ParentService {
    private parentProfileRepo;
    private relationRepo;
    private linkRepo;
    private lessonRepo;
    private studentProfileRepo;
    private teacherProfileRepo;
    private subjectRepo;
    private statsService;
    private debtService;
    constructor(parentProfileRepo: Repository<ParentProfile>, relationRepo: Repository<ParentStudentRelation>, linkRepo: Repository<TeacherStudentLink>, lessonRepo: Repository<Lesson>, studentProfileRepo: Repository<StudentProfile>, teacherProfileRepo: Repository<TeacherProfile>, subjectRepo: Repository<Subject>, statsService: StatsService, debtService: DebtService);
    getProfile(parentId: string): Promise<{
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
    updateProfile(parentId: string, customFields: Record<string, string>): Promise<{
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
    getChildren(parentId: string): Promise<any[]>;
    getChildDetails(parentId: string, childId: string): Promise<{
        childId: string;
        childUser: {
            id: any;
            firstName: any;
            lastName: any;
            username: any;
        };
        teachers: {
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
        }[];
        stats: import("../shared").DetailedStats;
        debt: import("../shared").DebtInfo;
        notificationsEnabled: boolean;
    }>;
    getChildTeachers(parentId: string, childId: string): Promise<{
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
    }[]>;
    getChildTeacherDetails(parentId: string, childId: string, teacherId: string): Promise<{
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
        debt: import("../shared").DebtInfo;
    }>;
    getChildLessons(parentId: string, childId: string, from: string, to: string, filters?: LessonFilters): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        teacherNote: string;
        lessonReport: string;
        teacher: {
            firstName: string;
            lastName: string;
        };
        subject: {
            name: string;
            colorHex: string;
        };
    }[]>;
    getChildLessonDetails(parentId: string, childId: string, lessonId: string): Promise<{
        id: string;
        teacherId: string;
        subjectId: string;
        startAt: string;
        durationMinutes: number;
        priceRub: number;
        status: string;
        attendance: string;
        paymentStatus: string;
        teacherNote: string;
        lessonReport: string;
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
    getChildStatsDetailed(parentId: string, childId: string): Promise<import("../shared").DetailedStats>;
    getChildDebt(parentId: string, childId: string): Promise<import("../shared").DebtByTeachers>;
    getNotificationSettings(parentId: string): Promise<{
        children: any[];
    }>;
    updateNotificationSettings(parentId: string, children: Array<{
        childId: string;
        notificationsEnabled: boolean;
    }>): Promise<{
        children: any[];
    }>;
    updateChildNotifications(parentId: string, childId: string, notificationsEnabled: boolean): Promise<{
        childId: string;
        notificationsEnabled: boolean;
    }>;
    private formatUserInfo;
}
