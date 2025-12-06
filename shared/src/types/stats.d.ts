export interface AttendanceStats {
    totalLessonsPlanned: number;
    totalLessonsAttended: number;
    totalLessonsMissed: number;
    cancelledByStudent: number;
    cancelledByTeacher: number;
    cancelledByIllness: number;
    attendanceRate: number;
}
export interface SubjectStats {
    subjectId: string;
    subjectName: string;
    colorHex: string;
    lessonsPlanned: number;
    lessonsAttended: number;
    attendanceRate: number;
}
export interface DebtInfo {
    hasDebt: boolean;
    unpaidLessonsCount: number;
    unpaidAmountRub: number;
    description?: string;
}
export interface DetailedDebt extends DebtInfo {
    lessons: Array<{
        lessonId: string;
        startAt: string;
        priceRub: number;
        subjectName: string;
    }>;
}
export interface StudentCardStats {
    debt: DebtInfo;
    nextLesson: {
        date: string;
        dayOfWeek: string;
        subjectName: string;
    } | null;
}
export interface StudentDetailedStatsForTeacher {
    debt: DetailedDebt;
    attendance: AttendanceStats;
    bySubject: SubjectStats[];
    recentMissedLessons: Array<{
        lessonId: string;
        startAt: string;
        subjectName: string;
        reason?: string;
    }>;
}
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string | null;
    progress?: number;
    target?: number;
}
export interface StudentGamifiedStats {
    total: AttendanceStats;
    bySubject: SubjectStats[];
    streak: {
        current: number;
        max: number;
    };
    achievements: Achievement[];
}
export interface StudentStatsDetailed {
    total: AttendanceStats;
    bySubject: SubjectStats[];
    byTeacher?: Array<{
        teacherId: string;
        teacherName: string;
        lessonsPlanned: number;
        lessonsAttended: number;
        attendanceRate: number;
    }>;
    currentStreak: number;
    maxStreak: number;
}
