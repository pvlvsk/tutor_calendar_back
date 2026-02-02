export declare class InitDto {
    initData: string;
}
export declare class RegisterDto {
    initData: string;
    role: 'teacher' | 'student' | 'parent';
    referralSource?: string;
}
export declare class SelectRoleDto {
    initData: string;
    role: 'teacher' | 'student' | 'parent';
}
export declare class AddRoleDto {
    role: 'teacher' | 'student' | 'parent';
}
export declare class AcceptInvitationDto {
    initData?: string;
    invitationToken: string;
}
export declare class JoinByReferralDto {
    initData: string;
    referralCode: string;
}
export declare class ActivateBetaDto {
    betaCode: string;
}
