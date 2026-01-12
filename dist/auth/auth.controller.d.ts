import { AuthService } from './auth.service';
import { InitDto, RegisterDto, SelectRoleDto, AddRoleDto, AcceptInvitationDto, JoinByReferralDto, ActivateBetaDto } from './auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    init(dto: InitDto): Promise<{
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
        roles: ("teacher" | "student" | "parent")[];
        currentRole: "teacher" | "student" | "parent";
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
        roles: ("teacher" | "student" | "parent")[];
        currentRole: null;
        token: null;
        telegramUser?: undefined;
    }>;
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: ("teacher" | "student" | "parent")[];
        currentRole: "teacher" | "student" | "parent";
        profile: {
            id: any;
            displayName: any;
        } | {
            id: any;
            displayName?: undefined;
        };
        token: string;
    }>;
    selectRole(dto: SelectRoleDto): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: ("teacher" | "student" | "parent")[];
        currentRole: "teacher" | "student" | "parent";
        token: string;
    }>;
    addRole(req: any, dto: AddRoleDto): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: ("teacher" | "student" | "parent")[];
        currentRole: "teacher" | "student" | "parent";
        token: string;
    }>;
    acceptInvitation(req: any, dto: AcceptInvitationDto): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: ("teacher" | "student" | "parent")[];
        currentRole: "teacher" | "student" | "parent";
        token: string;
        invitation: {
            type: string;
            teacher: {
                id: string;
                displayName: string;
            };
        };
    }>;
    joinByReferral(dto: JoinByReferralDto): Promise<{
        user: {
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: ("teacher" | "student" | "parent")[];
        currentRole: "teacher" | "student" | "parent";
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
        roles: ("teacher" | "student" | "parent")[];
        currentRole: "teacher" | "student" | "parent";
        token: string;
        student: {
            id: string;
            name: string;
        };
    }>;
    getMe(req: any): Promise<{
        user: {
            createdAt: string;
            id: string;
            telegramId: number;
            firstName: string;
            lastName: string;
            username: string;
            isBetaTester: boolean;
        };
        roles: ("teacher" | "student" | "parent")[];
        currentRole: "teacher" | "student" | "parent";
        profiles: Record<string, any>;
    }>;
    refresh(req: any): Promise<{
        token: string;
        expiresAt: string;
    }>;
    logout(): {
        message: string;
    };
    activateBeta(req: any, dto: ActivateBetaDto): Promise<{
        userId: string;
        isBetaTester: boolean;
        message: string;
    }>;
    getBetaStatus(req: any): {
        isBetaTester: any;
    };
}
