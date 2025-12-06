export interface TeacherProfile {
    id: string;
    userId: string;
    displayName: string;
    bio?: string;
    referralCode: string;
    createdAt: string;
    updatedAt: string;
}
export interface StudentProfile {
    id: string;
    userId: string;
    parentInviteCode: string;
    customFields?: Record<string, string | undefined>;
    createdAt: string;
    updatedAt: string;
}
export interface ParentProfile {
    id: string;
    userId: string;
    customFields?: Record<string, string | undefined>;
    createdAt: string;
    updatedAt: string;
}
export interface TeacherStudentLink {
    id: string;
    teacherId: string;
    studentId: string;
    subjectId?: string;
    customFields?: Record<string, string | undefined>;
    createdAt: string;
    updatedAt: string;
}
export interface ParentStudentRelation {
    id: string;
    parentId: string;
    studentId: string;
    teacherId: string;
    notificationsEnabled: boolean;
    createdAt: string;
}
