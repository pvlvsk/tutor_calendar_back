interface Lesson {
    id: string;
    status: string;
    startAt: Date;
}
interface LessonStudentWithLesson {
    attendance: string;
    lesson: Lesson;
}
interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string | null;
    progress: number;
    target: number;
}
declare function calculateAchievementsFromRecords(records: LessonStudentWithLesson[], streak: number): Achievement[];
declare const createRecord: (attendance: string, status: string, date: string) => LessonStudentWithLesson;
