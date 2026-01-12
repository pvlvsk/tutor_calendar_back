interface LessonStudent {
    attendance: string;
    lesson?: {
        status?: string;
        subjectId?: string;
        teacherId?: string;
        subject?: {
            name: string;
            colorHex: string;
        };
        teacher?: {
            displayName: string;
        };
    };
}
interface AttendanceStats {
    totalLessonsPlanned: number;
    totalLessonsAttended: number;
    totalLessonsMissed: number;
    cancelledByStudent: number;
    cancelledByTeacher: number;
    cancelledByIllness: number;
    attendanceRate: number;
}
interface SubjectStats {
    subjectId: string;
    subjectName: string;
    colorHex: string;
    lessonsPlanned: number;
    lessonsAttended: number;
    attendanceRate: number;
}
interface TeacherStats {
    teacherId: string;
    teacherName: string;
    lessonsPlanned: number;
    lessonsAttended: number;
    attendanceRate: number;
}
declare function calculateAttendanceFromRecords(records: LessonStudent[]): AttendanceStats;
declare function calculateStatsBySubject(records: LessonStudent[]): SubjectStats[];
declare function calculateStatsByTeacher(records: LessonStudent[]): TeacherStats[];
