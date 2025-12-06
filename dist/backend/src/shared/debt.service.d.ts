import { Repository } from 'typeorm';
import { Lesson } from '../database/entities';
import { DebtInfo, DetailedDebt, DebtByTeachers } from './types';
export declare class DebtService {
    private lessonRepo;
    constructor(lessonRepo: Repository<Lesson>);
    getStudentDebtForTeacher(teacherId: string, studentId: string): Promise<DebtInfo>;
    getStudentDebtDetailsForTeacher(teacherId: string, studentId: string): Promise<DetailedDebt>;
    getTotalDebtForStudent(studentId: string): Promise<DebtInfo>;
    getDebtForStudentByTeacher(studentId: string, teacherId: string): Promise<DebtInfo>;
    getDebtByTeachersForStudent(studentId: string): Promise<DebtByTeachers>;
}
