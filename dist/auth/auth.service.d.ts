import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { TelegramService } from "./telegram.service";
import { User, TeacherProfile, StudentProfile, ParentProfile, Invitation, TeacherStudentLink, ParentStudentRelation, Lesson, LessonSeries, Subject, Subscription, UserNotificationSettings, AnalyticsEvent, LessonStudent, LessonSeriesStudent } from "../database/entities";
import { BotService } from "../bot/bot.service";
type UserRole = "teacher" | "student" | "parent";
export declare class AuthService {
    private userRepository;
    private teacherProfileRepository;
    private studentProfileRepository;
    private parentProfileRepository;
    private invitationRepository;
    private teacherStudentLinkRepository;
    private parentStudentRelationRepository;
    private lessonRepository;
    private lessonSeriesRepository;
    private subjectRepository;
    private subscriptionRepository;
    private notificationSettingsRepository;
    private analyticsEventRepository;
    private lessonStudentRepository;
    private lessonSeriesStudentRepository;
    private jwtService;
    private telegramService;
    private botService;
    private readonly logger;
    constructor(userRepository: Repository<User>, teacherProfileRepository: Repository<TeacherProfile>, studentProfileRepository: Repository<StudentProfile>, parentProfileRepository: Repository<ParentProfile>, invitationRepository: Repository<Invitation>, teacherStudentLinkRepository: Repository<TeacherStudentLink>, parentStudentRelationRepository: Repository<ParentStudentRelation>, lessonRepository: Repository<Lesson>, lessonSeriesRepository: Repository<LessonSeries>, subjectRepository: Repository<Subject>, subscriptionRepository: Repository<Subscription>, notificationSettingsRepository: Repository<UserNotificationSettings>, analyticsEventRepository: Repository<AnalyticsEvent>, lessonStudentRepository: Repository<LessonStudent>, lessonSeriesStudentRepository: Repository<LessonSeriesStudent>, jwtService: JwtService, telegramService: TelegramService, botService: BotService);
    private readonly ACCOUNT_RESTORE_DAYS;
    init(initData: string): Promise<{
        isNewUser: boolean;
        telegramUser: {
            id: number;
            firstName: string | undefined;
            lastName: string | undefined;
            username: string | undefined;
        };
        isDeleted?: undefined;
        canRestore?: undefined;
        daysLeft?: undefined;
        deletedAt?: undefined;
        user?: undefined;
        roles?: undefined;
        currentRole?: undefined;
        token?: undefined;
    } | {
        isNewUser: boolean;
        isDeleted: boolean;
        canRestore: boolean;
        daysLeft: number;
        deletedAt: string;
        telegramUser: {
            id: number;
            firstName: string | undefined;
            lastName: string | undefined;
            username: string | undefined;
        };
        user?: undefined;
        roles?: undefined;
        currentRole?: undefined;
        token?: undefined;
    } | {
        isNewUser: boolean;
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        token: string;
        telegramUser?: undefined;
        isDeleted?: undefined;
        canRestore?: undefined;
        daysLeft?: undefined;
        deletedAt?: undefined;
    } | {
        isNewUser: boolean;
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: null;
        token: null;
        telegramUser?: undefined;
        isDeleted?: undefined;
        canRestore?: undefined;
        daysLeft?: undefined;
        deletedAt?: undefined;
    }>;
    register(initData: string, role: UserRole, referralSource?: string): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        profile: {
            id: any;
            displayName: any;
        } | {
            id: any;
            displayName?: undefined;
        };
        token: string;
    }>;
    selectRole(initData: string, role: UserRole): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        token: string;
    }>;
    addRole(userId: string, role: UserRole): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        token: string;
    }>;
    getMe(userId: string, role: UserRole): Promise<{
        user: {
            createdAt: string;
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        profiles: Record<string, any>;
    }>;
    refresh(userId: string, role: UserRole): Promise<{
        token: string;
        expiresAt: string;
    }>;
    setBetaTester(userId: string, isBetaTester: boolean, adminCode?: string): Promise<{
        userId: string;
        isBetaTester: boolean;
        message: string;
    }>;
    activateBetaTester(userId: string, betaCode: string): Promise<{
        userId: string;
        isBetaTester: boolean;
        message: string;
    }>;
    acceptInvitation(initData: string | null, invitationToken: string, userId?: string): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        token: string;
        invitation: {
            type: string;
            teacher: {
                id: string;
                displayName: string;
            };
        };
    }>;
    joinByReferral(initData: string, referralCode: string): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        token: string;
        teacher: {
            id: string;
            displayName: string;
        };
        parentInviteCode: string;
        parentInviteUrl: string;
    } | {
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        token: string;
        student: {
            id: string;
            name: string;
        };
    }>;
    private joinTeacher;
    private joinAsParent;
    private findOrCreateUser;
    private ensureTeacherStudentLink;
    private ensureParentStudentRelation;
    private getUserRoles;
    private getProfile;
    private createProfile;
    private generateToken;
    private formatUser;
    private formatProfile;
    deleteAccount(userId: string): Promise<{
        success: boolean;
        message: string;
        deletedAt: string;
        restoreDays: number;
    }>;
    restoreAccount(initData: string): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: UserRole;
        token: string;
    } | {
        success: boolean;
        message: string;
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: UserRole[];
        currentRole: null;
        token: null;
    }>;
    private purgeDeletedUser;
}
export {};
