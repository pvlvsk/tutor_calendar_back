import { TeacherProfile } from './teacher-profile.entity';
export declare class Invitation {
    id: string;
    type: string;
    teacherId: string;
    studentId: string;
    token: string;
    usedAt: Date;
    expiresAt: Date;
    createdAt: Date;
    teacher: TeacherProfile;
}
