import { Lesson } from "./lesson.entity";
import { StudentProfile } from "./student-profile.entity";
export declare class LessonStudent {
    id: string;
    lessonId: string;
    studentId: string;
    priceRub: number;
    attendance: string;
    rating: number | null;
    paymentStatus: string;
    createdAt: Date;
    updatedAt: Date;
    lesson: Lesson;
    student: StudentProfile;
}
