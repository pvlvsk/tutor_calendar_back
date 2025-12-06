"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../database/entities");
const utils_1 = require("./utils");
let DebtService = class DebtService {
    constructor(lessonRepo) {
        this.lessonRepo = lessonRepo;
    }
    async getStudentDebtForTeacher(teacherId, studentId) {
        const unpaidLessons = await this.lessonRepo.find({
            where: {
                teacherId,
                studentId,
                status: 'done',
                paymentStatus: 'unpaid',
            },
        });
        return (0, utils_1.calculateDebtInfo)(unpaidLessons);
    }
    async getStudentDebtDetailsForTeacher(teacherId, studentId) {
        const unpaidLessons = await this.lessonRepo.find({
            where: { teacherId, studentId, status: 'done', paymentStatus: 'unpaid' },
            relations: ['subject'],
            order: { startAt: 'ASC' },
        });
        const baseDebt = (0, utils_1.calculateDebtInfo)(unpaidLessons);
        return {
            ...baseDebt,
            lessons: unpaidLessons.map(l => ({
                lessonId: l.id,
                startAt: l.startAt.toISOString(),
                priceRub: l.priceRub,
                subjectName: l.subject.name,
            })),
        };
    }
    async getTotalDebtForStudent(studentId) {
        const unpaidLessons = await this.lessonRepo.find({
            where: { studentId, status: 'done', paymentStatus: 'unpaid' },
        });
        return (0, utils_1.calculateDebtInfo)(unpaidLessons);
    }
    async getDebtForStudentByTeacher(studentId, teacherId) {
        const unpaidLessons = await this.lessonRepo.find({
            where: { studentId, teacherId, status: 'done', paymentStatus: 'unpaid' },
        });
        return (0, utils_1.calculateDebtInfo)(unpaidLessons);
    }
    async getDebtByTeachersForStudent(studentId) {
        const unpaidLessons = await this.lessonRepo.find({
            where: { studentId, status: 'done', paymentStatus: 'unpaid' },
            relations: ['subject', 'teacher'],
            order: { startAt: 'ASC' },
        });
        const totalDebt = (0, utils_1.calculateDebtInfo)(unpaidLessons);
        const byTeacher = new Map();
        for (const lesson of unpaidLessons) {
            if (!byTeacher.has(lesson.teacherId)) {
                byTeacher.set(lesson.teacherId, {
                    teacherId: lesson.teacherId,
                    teacherName: lesson.teacher.displayName || '',
                    hasDebt: true,
                    unpaidLessonsCount: 0,
                    unpaidAmountRub: 0,
                    lessons: [],
                });
            }
            const t = byTeacher.get(lesson.teacherId);
            t.unpaidLessonsCount++;
            t.unpaidAmountRub += lesson.priceRub;
            t.lessons.push({
                lessonId: lesson.id,
                startAt: lesson.startAt.toISOString(),
                priceRub: lesson.priceRub,
                subjectName: lesson.subject.name,
            });
        }
        return {
            totalDebt,
            byTeacher: Array.from(byTeacher.values()),
        };
    }
};
exports.DebtService = DebtService;
exports.DebtService = DebtService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Lesson)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DebtService);
//# sourceMappingURL=debt.service.js.map