import { Repository } from 'typeorm';
import { Lesson } from '../database/entities';
import { AttendanceStats, DetailedStats, SubjectStats, TeacherStats, StudentCardStats, StudentDetailedStatsForTeacher } from './types';
export declare class StatsService {
    private lessonRepo;
    constructor(lessonRepo: Repository<Lesson>);
    getStatsForStudentWithTeacher(studentId: string, teacherId: string): Promise<AttendanceStats>;
    getStudentStatsForTeacher(teacherId: string, studentId: string): Promise<AttendanceStats>;
    getDetailedStatsForStudent(studentId: string): Promise<DetailedStats>;
    getSubjectStatsForStudent(studentId: string): Promise<SubjectStats[]>;
    getTeacherStatsForStudent(studentId: string): Promise<TeacherStats[]>;
    getStudentCardStats(teacherId: string, studentId: string): Promise<StudentCardStats>;
    getStudentDetailedStats(teacherId: string, studentId: string): Promise<StudentDetailedStatsForTeacher>;
    calculateStreak(lessons: Lesson[]): {
        current: number;
        max: number;
    };
}
