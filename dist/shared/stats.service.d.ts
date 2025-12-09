import { Repository } from "typeorm";
import { Lesson, LessonStudent } from "../database/entities";
import { AttendanceStats, DetailedStats, SubjectStats, TeacherStats, StudentCardStats, StudentDetailedStatsForTeacher } from "./types";
export declare class StatsService {
    private lessonRepo;
    private lessonStudentRepo;
    constructor(lessonRepo: Repository<Lesson>, lessonStudentRepo: Repository<LessonStudent>);
    getStatsForStudentWithTeacher(studentId: string, teacherId: string): Promise<AttendanceStats>;
    getStudentStatsForTeacher(teacherId: string, studentId: string): Promise<AttendanceStats>;
    getDetailedStatsForStudent(studentId: string): Promise<DetailedStats>;
    getSubjectStatsForStudent(studentId: string): Promise<SubjectStats[]>;
    getTeacherStatsForStudent(studentId: string): Promise<TeacherStats[]>;
    getStudentCardStats(teacherId: string, studentId: string): Promise<StudentCardStats>;
    getStudentDetailedStats(teacherId: string, studentId: string): Promise<StudentDetailedStatsForTeacher>;
    private calculateAttendanceFromRecords;
    private calculateStatsBySubject;
    private calculateStatsByTeacher;
}
