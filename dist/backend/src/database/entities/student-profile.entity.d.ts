import { User } from './user.entity';
import { TeacherStudentLink } from './teacher-student-link.entity';
import { Lesson } from './lesson.entity';
import { LessonSeries } from './lesson-series.entity';
export declare class StudentProfile {
    id: string;
    userId: string;
    parentInviteCode: string;
    customFields: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    teacherStudentLinks: TeacherStudentLink[];
    lessons: Lesson[];
    lessonSeries: LessonSeries[];
}
