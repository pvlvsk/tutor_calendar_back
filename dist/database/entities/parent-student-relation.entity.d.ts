import { ParentProfile } from './parent-profile.entity';
import { StudentProfile } from './student-profile.entity';
import { TeacherProfile } from './teacher-profile.entity';
export declare class ParentStudentRelation {
    id: string;
    parentId: string;
    studentId: string;
    teacherId: string;
    notificationsEnabled: boolean;
    createdAt: Date;
    parent: ParentProfile;
    student: StudentProfile;
    teacher: TeacherProfile;
}
