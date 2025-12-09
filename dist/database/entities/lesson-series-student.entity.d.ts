import { LessonSeries } from "./lesson-series.entity";
import { StudentProfile } from "./student-profile.entity";
export declare class LessonSeriesStudent {
    id: string;
    seriesId: string;
    studentId: string;
    priceRub: number;
    createdAt: Date;
    series: LessonSeries;
    student: StudentProfile;
}
