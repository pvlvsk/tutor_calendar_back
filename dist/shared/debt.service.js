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
let DebtService = class DebtService {
    constructor(lessonStudentRepo) {
        this.lessonStudentRepo = lessonStudentRepo;
    }
    async getStudentDebtForTeacher(teacherId, studentId) {
        const unpaidRecords = await this.lessonStudentRepo.find({
            where: {
                studentId,
                attendance: "attended",
                paymentStatus: "unpaid",
            },
            relations: ["lesson"],
        });
        const filtered = unpaidRecords.filter((r) => r.lesson?.teacherId === teacherId && r.lesson?.status === "done");
        return this.calculateDebtFromRecords(filtered);
    }
    async getStudentDebtDetailsForTeacher(teacherId, studentId) {
        const unpaidRecords = await this.lessonStudentRepo.find({
            where: {
                studentId,
                attendance: "attended",
                paymentStatus: "unpaid",
            },
            relations: ["lesson", "lesson.subject"],
        });
        const filtered = unpaidRecords.filter((r) => r.lesson?.teacherId === teacherId && r.lesson?.status === "done");
        const baseDebt = this.calculateDebtFromRecords(filtered);
        return {
            ...baseDebt,
            lessons: filtered.map((r) => ({
                lessonId: r.lesson.id,
                startAt: r.lesson.startAt.toISOString(),
                priceRub: r.priceRub,
                subjectName: r.lesson.subject?.name || "",
            })),
        };
    }
    async getTotalDebtForStudent(studentId) {
        const unpaidRecords = await this.lessonStudentRepo.find({
            where: {
                studentId,
                attendance: "attended",
                paymentStatus: "unpaid",
            },
            relations: ["lesson"],
        });
        const filtered = unpaidRecords.filter((r) => r.lesson?.status === "done");
        return this.calculateDebtFromRecords(filtered);
    }
    async getDebtForStudentByTeacher(studentId, teacherId) {
        return this.getStudentDebtForTeacher(teacherId, studentId);
    }
    async getDebtByTeachersForStudent(studentId) {
        const unpaidRecords = await this.lessonStudentRepo.find({
            where: {
                studentId,
                attendance: "attended",
                paymentStatus: "unpaid",
            },
            relations: ["lesson", "lesson.subject", "lesson.teacher"],
        });
        const filtered = unpaidRecords.filter((r) => r.lesson?.status === "done");
        const totalDebt = this.calculateDebtFromRecords(filtered);
        const byTeacher = new Map();
        for (const record of filtered) {
            const teacherId = record.lesson.teacherId;
            if (!byTeacher.has(teacherId)) {
                byTeacher.set(teacherId, {
                    teacherId,
                    teacherName: record.lesson.teacher?.displayName || "",
                    hasDebt: true,
                    unpaidLessonsCount: 0,
                    unpaidAmountRub: 0,
                    lessons: [],
                });
            }
            const t = byTeacher.get(teacherId);
            t.unpaidLessonsCount++;
            t.unpaidAmountRub += record.priceRub;
            t.lessons.push({
                lessonId: record.lesson.id,
                startAt: record.lesson.startAt.toISOString(),
                priceRub: record.priceRub,
                subjectName: record.lesson.subject?.name || "",
            });
        }
        return {
            totalDebt,
            byTeacher: Array.from(byTeacher.values()),
        };
    }
    calculateDebtFromRecords(records) {
        if (records.length === 0) {
            return { hasDebt: false, unpaidLessonsCount: 0, unpaidAmountRub: 0 };
        }
        const unpaidAmountRub = records.reduce((sum, r) => sum + r.priceRub, 0);
        return {
            hasDebt: true,
            unpaidLessonsCount: records.length,
            unpaidAmountRub,
        };
    }
};
exports.DebtService = DebtService;
exports.DebtService = DebtService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.LessonStudent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DebtService);
//# sourceMappingURL=debt.service.js.map