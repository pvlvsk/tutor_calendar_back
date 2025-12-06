import { TeacherProfile } from './teacher-profile.entity';
import { StudentProfile } from './student-profile.entity';
export declare class TeacherStudentLink {
    id: string;
    teacherId: string;
    studentId: string;
    customFields: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
    teacher: TeacherProfile;
    student: StudentProfile;
}
