import { User } from './user.entity';
import { Subject } from './subject.entity';
import { TeacherStudentLink } from './teacher-student-link.entity';
import { Lesson } from './lesson.entity';
import { LessonSeries } from './lesson-series.entity';
import { Invitation } from './invitation.entity';
export declare class TeacherProfile {
    id: string;
    userId: string;
    displayName: string;
    bio: string;
    referralCode: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    subjects: Subject[];
    teacherStudentLinks: TeacherStudentLink[];
    lessons: Lesson[];
    lessonSeries: LessonSeries[];
    invitations: Invitation[];
}
