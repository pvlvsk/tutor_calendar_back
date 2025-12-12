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
    constructor(lessonRepo, lessonStudentRepo) {
        this.lessonRepo = lessonRepo;
        this.lessonStudentRepo = lessonStudentRepo;
    }
    async getStatsForStudentWithTeacher(studentId, teacherId) {
        const records = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: ["lesson"],
        });
        const filtered = records.filter((r) => r.lesson?.teacherId === teacherId && r.lesson?.status === "done");
        return this.calculateAttendanceFromRecords(filtered);
    }
    async getStudentStatsForTeacher(teacherId, studentId) {
        return this.getStatsForStudentWithTeacher(studentId, teacherId);
    }
    async getDetailedStatsForStudent(studentId) {
        const records = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: [
                "lesson",
                "lesson.subject",
                "lesson.teacher",
                "lesson.teacher.user",
            ],
        });
        const doneRecords = records.filter((r) => r.lesson?.status === "done");
        return {
            total: this.calculateAttendanceFromRecords(doneRecords),
            bySubject: this.calculateStatsBySubject(doneRecords),
            byTeacher: this.calculateStatsByTeacher(doneRecords),
            currentStreak: 0,
            maxStreak: 0,
        };
    }
    async getSubjectStatsForStudent(studentId) {
        const records = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: ["lesson", "lesson.subject"],
        });
        return this.calculateStatsBySubject(records);
    }
    async getTeacherStatsForStudent(studentId) {
        const records = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: ["lesson", "lesson.teacher"],
        });
        return this.calculateStatsByTeacher(records);
    }
    async getStudentCardStats(teacherId, studentId) {
        const records = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: ["lesson", "lesson.subject"],
        });
        const teacherRecords = records.filter((r) => r.lesson?.teacherId === teacherId);
        const unpaidRecords = teacherRecords.filter((r) => r.lesson?.status === "done" &&
            r.attendance === "attended" &&
            r.paymentStatus === "unpaid");
        const debt = {
            hasDebt: unpaidRecords.length > 0,
            unpaidLessonsCount: unpaidRecords.length,
            unpaidAmountRub: unpaidRecords.reduce((sum, r) => sum + r.priceRub, 0),
        };
        const now = new Date();
        const nextLessonRecord = teacherRecords
            .filter((r) => r.lesson?.status === "planned" && new Date(r.lesson.startAt) > now)
            .sort((a, b) => new Date(a.lesson.startAt).getTime() -
            new Date(b.lesson.startAt).getTime())[0];
        return {
            debt,
            nextLesson: nextLessonRecord
                ? {
                    date: nextLessonRecord.lesson.startAt.toISOString(),
                    dayOfWeek: (0, utils_1.getDayOfWeekRu)(new Date(nextLessonRecord.lesson.startAt)),
                    subjectName: nextLessonRecord.lesson.subject?.name || "",
                }
                : null,
        };
    }
    async getStudentDetailedStats(teacherId, studentId) {
        const records = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: ["lesson", "lesson.subject"],
        });
        const teacherRecords = records.filter((r) => r.lesson?.teacherId === teacherId);
        const unpaidRecords = teacherRecords.filter((r) => r.lesson?.status === "done" &&
            r.attendance === "attended" &&
            r.paymentStatus === "unpaid");
        const debt = {
            hasDebt: unpaidRecords.length > 0,
            unpaidLessonsCount: unpaidRecords.length,
            unpaidAmountRub: unpaidRecords.reduce((sum, r) => sum + r.priceRub, 0),
            lessons: unpaidRecords.map((r) => ({
                lessonId: r.lesson.id,
                startAt: r.lesson.startAt.toISOString(),
                priceRub: r.priceRub,
                subjectName: r.lesson.subject?.name || "",
            })),
        };
        const doneRecords = teacherRecords.filter((r) => r.lesson?.status === "done");
        const attendance = this.calculateAttendanceFromRecords(doneRecords);
        const bySubject = this.calculateStatsBySubject(doneRecords);
        const missedRecords = doneRecords
            .filter((r) => r.attendance === "missed")
            .sort((a, b) => new Date(b.lesson.startAt).getTime() -
            new Date(a.lesson.startAt).getTime())
            .slice(0, 10);
        const recentMissedLessons = missedRecords.map((r) => ({
            lessonId: r.lesson.id,
            startAt: r.lesson.startAt.toISOString(),
            subjectName: r.lesson.subject?.name || "",
        }));
        const now = new Date();
        console.log(`[getStudentDetailedStats] teacherRecords total: ${teacherRecords.length}`);
        console.log(`[getStudentDetailedStats] planned lessons:`, teacherRecords.filter((r) => r.lesson?.status === "planned").length);
        console.log(`[getStudentDetailedStats] future planned:`, teacherRecords.filter((r) => r.lesson?.status === "planned" && new Date(r.lesson.startAt) > now).length);
        const upcomingLessons = teacherRecords
            .filter((r) => r.lesson?.status === "planned" && new Date(r.lesson.startAt) > now)
            .sort((a, b) => new Date(a.lesson.startAt).getTime() -
            new Date(b.lesson.startAt).getTime())
            .slice(0, 5)
            .map((r) => ({
            lessonId: r.lesson.id,
            startAt: r.lesson.startAt.toISOString(),
            subjectName: r.lesson.subject?.name || "",
            colorHex: r.lesson.subject?.colorHex || "#888888",
        }));
        return {
            debt,
            attendance,
            bySubject,
            recentMissedLessons,
            upcomingLessons,
        };
    }
    calculateAttendanceFromRecords(records) {
        const total = records.length;
        const attended = records.filter((r) => r.attendance === "attended").length;
        const missed = records.filter((r) => r.attendance === "missed").length;
        const cancelled = records.filter((r) => r.lesson?.status === "cancelled").length;
        const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
        return {
            totalLessonsPlanned: total,
            totalLessonsAttended: attended,
            totalLessonsMissed: missed,
            cancelledByStudent: cancelled,
            cancelledByTeacher: 0,
            cancelledByIllness: 0,
            attendanceRate: rate,
        };
    }
    calculateStatsBySubject(records) {
        const bySubject = new Map();
        for (const r of records) {
            const subjectId = r.lesson?.subjectId;
            const subjectName = r.lesson?.subject?.name || "";
            const colorHex = r.lesson?.subject?.colorHex || "#888888";
            if (!subjectId)
                continue;
            if (!bySubject.has(subjectId)) {
                bySubject.set(subjectId, {
                    name: subjectName,
                    colorHex,
                    attended: 0,
                    total: 0,
                });
            }
            const stats = bySubject.get(subjectId);
            stats.total++;
            if (r.attendance === "attended")
                stats.attended++;
        }
        return Array.from(bySubject.entries()).map(([id, s]) => ({
            subjectId: id,
            subjectName: s.name,
            colorHex: s.colorHex,
            lessonsPlanned: s.total,
            lessonsAttended: s.attended,
            attendanceRate: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
        }));
    }
    calculateStatsByTeacher(records) {
        const byTeacher = new Map();
        for (const r of records) {
            const teacherId = r.lesson?.teacherId;
            const teacherName = r.lesson?.teacher?.displayName || "";
            if (!teacherId)
                continue;
            if (!byTeacher.has(teacherId)) {
                byTeacher.set(teacherId, { name: teacherName, attended: 0, total: 0 });
            }
            const stats = byTeacher.get(teacherId);
            stats.total++;
            if (r.attendance === "attended")
                stats.attended++;
        }
        return Array.from(byTeacher.entries()).map(([id, s]) => ({
            teacherId: id,
            teacherName: s.name,
            lessonsPlanned: s.total,
            lessonsAttended: s.attended,
            attendanceRate: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
        }));
    }
};
exports.StatsService = StatsService;
exports.StatsService = StatsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Lesson)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.LessonStudent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], StatsService);
//# sourceMappingURL=stats.service.js.map