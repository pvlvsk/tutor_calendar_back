export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export interface AuthInitRequest {
    initData: string;
}
export interface AuthInitResponseNewUser {
    isNewUser: true;
    telegramUser: {
        id: number;
        firstName?: string;
        lastName?: string;
        username?: string;
    };
}
export interface AuthInitResponseExistingUser {
    isNewUser: false;
    user: {
        id: string;
        telegramId: number;
        firstName?: string;
        lastName?: string;
        username?: string;
    };
    roles: string[];
    currentRole: string | null;
    token: string | null;
}
export type AuthInitResponse = AuthInitResponseNewUser | AuthInitResponseExistingUser;
export interface AuthRegisterRequest {
    initData: string;
    role: 'teacher' | 'student' | 'parent';
}
export interface AuthRegisterResponse {
    user: {
        id: string;
        telegramId: number;
        firstName?: string;
        lastName?: string;
        username?: string;
    };
    roles: string[];
    currentRole: string;
    profile: Record<string, unknown>;
    token: string;
}
export interface AuthSelectRoleRequest {
    initData: string;
    role: string;
}
export interface AuthSelectRoleResponse {
    user: {
        id: string;
        telegramId: number;
        firstName?: string;
        lastName?: string;
        username?: string;
    };
    roles: string[];
    currentRole: string;
    token: string;
}
export interface CreateLessonRequest {
    studentId: string;
    subjectId: string;
    startAt: string;
    durationMinutes: number;
    priceRub: number;
    teacherNote?: string;
    reminderMinutesBefore?: number;
    recurrence?: {
        frequency: 'none' | 'weekly' | 'biweekly';
        dayOfWeek?: string;
        endDate?: string;
        maxOccurrences?: number;
    };
}
export interface UpdateLessonRequest {
    startAt?: string;
    durationMinutes?: number;
    priceRub?: number;
    status?: 'planned' | 'done' | 'cancelled';
    attendance?: 'attended' | 'missed' | 'unknown';
    isPaid?: boolean;
    teacherNote?: string;
    reminderMinutesBefore?: number;
}
export interface CreateSubjectRequest {
    name: string;
    code: string;
    colorHex: string;
}
export interface UpdateSubjectRequest {
    name?: string;
    code?: string;
    colorHex?: string;
}
