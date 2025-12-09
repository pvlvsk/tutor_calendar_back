import { TeacherProfile } from './teacher-profile.entity';
import { Lesson } from './lesson.entity';
import { LessonSeries } from './lesson-series.entity';
export declare class Subject {
    id: string;
    teacherId: string;
    name: string;
    code: string;
    colorHex: string;
    createdAt: Date;
    updatedAt: Date;
    teacher: TeacherProfile;
    lessons: Lesson[];
    lessonSeries: LessonSeries[];
}
