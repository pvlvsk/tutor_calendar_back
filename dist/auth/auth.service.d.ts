import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { TelegramService } from "./telegram.service";
import { User, TeacherProfile, StudentProfile, ParentProfile, Invitation, TeacherStudentLink, ParentStudentRelation } from "../database/entities";
type UserRole = "teacher" | "student" | "parent";
export declare class AuthService {
    private userRepository;
    private teacherProfileRepository;
    private studentProfileRepository;
    private parentProfileRepository;
    private invitationRepository;
    private teacherStudentLinkRepository;
    private parentStudentRelationRepository;
    private jwtService;
    private telegramService;
    private readonly logger;
    constructor(userRepository: Repository<User>, teacherProfileRepository: Repository<TeacherProfile>, studentProfileRepository: Repository<StudentProfile>, parentProfileRepository: Repository<ParentProfile>, invitationRepository: Repository<Invitation>, teacherStudentLinkRepository: Repository<TeacherStudentLink>, parentStudentRelationRepository: Repository<ParentStudentRelation>, jwtService: JwtService, telegramService: TelegramService);
    init(initData: string): Promise<{
        isNewUser: boolean;
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
    }>;
    register(initData: string, role: UserRole): Promise<{
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
        newRole: UserRole;
        profile: {
            id: any;
            displayName: any;
        } | {
            id: any;
            displayName?: undefined;
        };
        message: string;
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
}
export {};
