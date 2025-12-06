import { TeacherProfile } from './teacher-profile.entity';
import { StudentProfile } from './student-profile.entity';
import { Subject } from './subject.entity';
import { Lesson } from './lesson.entity';
export declare class LessonSeries {
    id: string;
    teacherId: string;
    studentId: string;
    subjectId: string;
    frequency: string;
    dayOfWeek: number;
    endDate: Date;
    maxOccurrences: number;
    timeOfDay: string;
    durationMinutes: number;
    priceRub: number;
    createdAt: Date;
    updatedAt: Date;
    teacher: TeacherProfile;
    student: StudentProfile;
    subject: Subject;
    lessons: Lesson[];
}
