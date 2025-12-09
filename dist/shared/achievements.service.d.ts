import { Lesson } from "../database/entities";
import { Achievement } from "./types";
interface LessonStudentWithLesson {
    attendance: string;
    lesson: Lesson;
}
export declare class AchievementsService {
    calculateAchievementsFromRecords(records: LessonStudentWithLesson[], streak: number): Achievement[];
}
export {};
