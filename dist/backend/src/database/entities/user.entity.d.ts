import { TeacherProfile } from './teacher-profile.entity';
import { StudentProfile } from './student-profile.entity';
import { ParentProfile } from './parent-profile.entity';
export declare class User {
    id: string;
    telegramId: string;
    firstName: string;
    lastName: string;
    username: string;
    isBetaTester: boolean;
    createdAt: Date;
    updatedAt: Date;
    teacherProfile: TeacherProfile;
    studentProfile: StudentProfile;
    parentProfile: ParentProfile;
}
