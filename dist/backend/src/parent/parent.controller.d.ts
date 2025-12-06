import { ParentService } from './parent.service';
export declare class ParentController {
    private parentService;
    constructor(parentService: ParentService);
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
    getChildren(req: any): Promise<any[]>;
    getChildDetails(req: any, childId: string): Promise<{
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
    getChildTeachers(req: any, childId: string): Promise<{
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
    getChildTeacherDetails(req: any, childId: string, teacherId: string): Promise<{
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
    getChildLessons(req: any, childId: string, from: string, to: string, subjectId?: string, teacherId?: string, status?: string): Promise<{
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
    getChildLessonDetails(req: any, childId: string, lessonId: string): Promise<{
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
    getChildStats(req: any, childId: string): Promise<import("../shared").DetailedStats>;
    getChildDebt(req: any, childId: string): Promise<import("../shared").DebtByTeachers>;
    getNotificationSettings(req: any): Promise<{
        children: any[];
    }>;
    updateNotificationSettings(req: any, body: {
        children: Array<{
            childId: string;
            notificationsEnabled: boolean;
        }>;
    }): Promise<{
        children: any[];
    }>;
    updateChildNotifications(req: any, childId: string, body: {
        notificationsEnabled: boolean;
    }): Promise<{
        childId: string;
        notificationsEnabled: boolean;
    }>;
}
