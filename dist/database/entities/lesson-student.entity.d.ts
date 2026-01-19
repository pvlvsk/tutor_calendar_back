import { Lesson } from "./lesson.entity";
import { StudentProfile } from "./student-profile.entity";
export type PaymentType = "fixed" | "free" | "subscription";
export declare class LessonStudent {
    id: string;
    lessonId: string;
    studentId: string;
    priceRub: number;
    attendance: string;
    rating: number | null;
    paymentStatus: string;
    paymentType: PaymentType;
    paidFromSubscription: boolean;
    createdAt: Date;
    updatedAt: Date;
    lesson: Lesson;
    student: StudentProfile;
}
