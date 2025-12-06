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
exports.StatsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../database/entities");
const utils_1 = require("./utils");
let StatsService = class StatsService {
    constructor(lessonRepo) {
        this.lessonRepo = lessonRepo;
    }
    async getStatsForStudentWithTeacher(studentId, teacherId) {
        const lessons = await this.lessonRepo.find({
            where: { studentId, teacherId },
        });
        return (0, utils_1.calculateAttendanceStats)(lessons);
    }
    async getStudentStatsForTeacher(teacherId, studentId) {
        const lessons = await this.lessonRepo.find({
            where: { teacherId, studentId },
        });
        return (0, utils_1.calculateAttendanceStats)(lessons);
    }
    async getDetailedStatsForStudent(studentId) {
        const lessons = await this.lessonRepo.find({
            where: { studentId },
            relations: ['subject', 'teacher', 'teacher.user'],
        });
        return {
            total: (0, utils_1.calculateAttendanceStats)(lessons),
            bySubject: (0, utils_1.calculateStatsBySubject)(lessons),
            byTeacher: (0, utils_1.calculateStatsByTeacher)(lessons),
            currentStreak: 0,
            maxStreak: 0,
        };
    }
    async getSubjectStatsForStudent(studentId) {
        const lessons = await this.lessonRepo.find({
            where: { studentId },
            relations: ['subject'],
        });
        return (0, utils_1.calculateStatsBySubject)(lessons);
    }
    async getTeacherStatsForStudent(studentId) {
        const lessons = await this.lessonRepo.find({
            where: { studentId },
            relations: ['teacher'],
        });
        return (0, utils_1.calculateStatsByTeacher)(lessons);
    }
    async getStudentCardStats(teacherId, studentId) {
        const lessons = await this.lessonRepo.find({
            where: { teacherId, studentId },
            relations: ['subject'],
            order: { startAt: 'ASC' },
        });
        const unpaidLessons = lessons.filter(l => l.status === 'done' && l.paymentStatus === 'unpaid');
        const debt = (0, utils_1.calculateDebtInfo)(unpaidLessons);
        const now = new Date();
        const nextLesson = lessons.find(l => l.status === 'planned' && new Date(l.startAt) > now);
        return {
            debt,
            nextLesson: nextLesson ? {
                date: nextLesson.startAt.toISOString(),
                dayOfWeek: (0, utils_1.getDayOfWeekRu)(new Date(nextLesson.startAt)),
                subjectName: nextLesson.subject?.name || '',
            } : null,
        };
    }
    async getStudentDetailedStats(teacherId, studentId) {
        const lessons = await this.lessonRepo.find({
            where: { teacherId, studentId },
            relations: ['subject'],
            order: { startAt: 'DESC' },
        });
        const unpaidLessons = lessons.filter(l => l.status === 'done' && l.paymentStatus === 'unpaid');
        const debt = {
            ...(0, utils_1.calculateDebtInfo)(unpaidLessons),
            lessons: unpaidLessons.map(l => ({
                lessonId: l.id,
                startAt: l.startAt.toISOString(),
                priceRub: l.priceRub,
                subjectName: l.subject?.name || '',
            })),
        };
        const attendance = (0, utils_1.calculateAttendanceStats)(lessons);
        const bySubject = (0, utils_1.calculateStatsBySubject)(lessons);
        const missedLessons = lessons
            .filter(l => l.status === 'done' && l.attendance === 'missed')
            .slice(0, 10);
        const recentMissedLessons = missedLessons.map(l => ({
            lessonId: l.id,
            startAt: l.startAt.toISOString(),
            subjectName: l.subject?.name || '',
        }));
        return {
            debt,
            attendance,
            bySubject,
            recentMissedLessons,
        };
    }
    calculateStreak(lessons) {
        const doneLessons = lessons
            .filter(l => l.status === 'done')
            .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
        if (doneLessons.length === 0)
            return { current: 0, max: 0 };
        let current = 0;
        let max = 0;
        let streak = 0;
        let foundMissed = false;
        for (const lesson of doneLessons) {
            if (lesson.attendance === 'attended') {
                streak++;
                if (!foundMissed)
                    current = streak;
                max = Math.max(max, streak);
            }
            else {
                foundMissed = true;
                streak = 0;
            }
        }
        return { current, max };
    }
};
exports.StatsService = StatsService;
exports.StatsService = StatsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Lesson)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StatsService);
//# sourceMappingURL=stats.service.js.map