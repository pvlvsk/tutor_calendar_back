import { TeacherProfile } from "./teacher-profile.entity";
import { Subject } from "./subject.entity";
import { Lesson } from "./lesson.entity";
import { LessonSeriesStudent } from "./lesson-series-student.entity";
export declare class LessonSeries {
    id: string;
    teacherId: string;
    subjectId: string;
    frequency: string;
    dayOfWeek: number;
    endDate: Date;
    maxOccurrences: number;
    timeOfDay: string;
    durationMinutes: number;
    priceRub: number;
    isFree: boolean;
    meetingUrl: string;
    createdAt: Date;
    updatedAt: Date;
    teacher: TeacherProfile;
    subject: Subject;
    lessons: Lesson[];
    seriesStudents: LessonSeriesStudent[];
}
