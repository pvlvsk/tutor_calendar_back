import { User } from "./user.entity";
import { TeacherStudentLink } from "./teacher-student-link.entity";
import { LessonStudent } from "./lesson-student.entity";
import { LessonSeriesStudent } from "./lesson-series-student.entity";
export declare class StudentProfile {
    id: string;
    userId: string;
    parentInviteCode: string;
    customFields: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    teacherStudentLinks: TeacherStudentLink[];
    lessonStudents: LessonStudent[];
    seriesStudents: LessonSeriesStudent[];
}
