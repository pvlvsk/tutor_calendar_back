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
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../database/entities");
const shared_1 = require("../shared");
const utils_1 = require("../shared/utils");
let StudentService = class StudentService {
    constructor(studentProfileRepo, linkRepo, lessonRepo, notificationSettingsRepo, subjectRepo, statsService, achievementsService) {
        this.studentProfileRepo = studentProfileRepo;
        this.linkRepo = linkRepo;
        this.lessonRepo = lessonRepo;
        this.notificationSettingsRepo = notificationSettingsRepo;
        this.subjectRepo = subjectRepo;
        this.statsService = statsService;
        this.achievementsService = achievementsService;
    }
    async getProfile(studentId) {
        const profile = await this.studentProfileRepo.findOne({
            where: { id: studentId },
            relations: ['user'],
        });
        if (!profile)
            throw new common_1.NotFoundException('STUDENT_NOT_FOUND');
        return {
            id: profile.id,
            userId: profile.userId,
            user: {
                telegramId: Number(profile.user.telegramId),
                firstName: profile.user.firstName,
                lastName: profile.user.lastName,
                username: profile.user.username,
            },
            customFields: profile.customFields,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt.toISOString(),
        };
    }
    async getParentInviteLink(studentId) {
        const profile = await this.studentProfileRepo.findOne({
            where: { id: studentId },
        });
        if (!profile)
            throw new common_1.NotFoundException('STUDENT_NOT_FOUND');
        return {
            parentInviteCode: profile.parentInviteCode,
            inviteUrl: (0, utils_1.generateInviteUrl)(profile.parentInviteCode),
            fallbackUrl: (0, utils_1.generateFallbackUrl)(profile.parentInviteCode),
        };
    }
    async updateProfile(studentId, customFields) {
        const profile = await this.studentProfileRepo.findOne({ where: { id: studentId } });
        if (!profile)
            throw new common_1.NotFoundException('STUDENT_NOT_FOUND');
        profile.customFields = customFields;
        await this.studentProfileRepo.save(profile);
        return this.getProfile(studentId);
    }
    async getTeachers(studentId) {
        const links = await this.linkRepo.find({
            where: { studentId },
            relations: ['teacher', 'teacher.user'],
        });
        const teachers = [];
        for (const link of links) {
            const subjects = await this.subjectRepo.find({
                where: { teacherId: link.teacherId },
            });
            teachers.push({
                teacherId: link.teacherId,
                teacherUser: this.formatUserInfo(link.teacher.user),
                displayName: link.teacher.displayName,
                bio: link.teacher.bio,
                subjects: subjects.map((s) => ({
                    subjectId: s.id,
                    name: s.name,
                    colorHex: s.colorHex,
                })),
            });
        }
        return teachers;
    }
    async getTeacherDetails(studentId, teacherId) {
        const link = await this.linkRepo.findOne({
            where: { studentId, teacherId },
            relations: ['teacher', 'teacher.user'],
        });
        if (!link)
            throw new common_1.NotFoundException('TEACHER_NOT_FOUND');
        const subjects = await this.subjectRepo.find({
            where: { teacherId },
        });
        const stats = await this.statsService.getStatsForStudentWithTeacher(studentId, teacherId);
        return {
            teacherId,
            teacherUser: this.formatUserInfo(link.teacher.user),
            displayName: link.teacher.displayName,
            bio: link.teacher.bio,
            subjects: subjects.map((s) => ({
                subjectId: s.id,
                name: s.name,
                colorHex: s.colorHex,
            })),
            statsWithTeacher: stats,
        };
    }
    async getLessons(studentId, from, to, filters) {
        const whereClause = {
            studentId,
            startAt: (0, typeorm_2.Between)(new Date(from), new Date(to)),
        };
        if (filters?.subjectId)
            whereClause.subjectId = filters.subjectId;
        if (filters?.teacherId)
            whereClause.teacherId = filters.teacherId;
        if (filters?.status)
            whereClause.status = filters.status;
        const lessons = await this.lessonRepo.find({
            where: whereClause,
            relations: ['teacher', 'teacher.user', 'subject'],
            order: { startAt: 'ASC' },
        });
        return lessons.map((l) => ({
            id: l.id,
            seriesId: l.seriesId,
            teacherId: l.teacherId,
            subjectId: l.subjectId,
            startAt: l.startAt.toISOString(),
            durationMinutes: l.durationMinutes,
            status: l.status,
            attendance: l.attendance,
            teacherNote: l.teacherNote,
            lessonReport: l.lessonReport,
            studentNotePrivate: l.studentNotePrivate,
            studentNoteForTeacher: l.studentNoteForTeacher,
            reminderMinutesBefore: l.reminderMinutesBefore,
            teacher: {
                firstName: l.teacher.user.firstName,
                lastName: l.teacher.user.lastName,
            },
            subject: {
                name: l.subject.name,
                colorHex: l.subject.colorHex,
            },
        }));
    }
    async getLessonDetails(studentId, lessonId) {
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, studentId },
            relations: ['teacher', 'teacher.user', 'subject'],
        });
        if (!lesson)
            throw new common_1.NotFoundException('LESSON_NOT_FOUND');
        return {
            id: lesson.id,
            teacherId: lesson.teacherId,
            subjectId: lesson.subjectId,
            startAt: lesson.startAt.toISOString(),
            durationMinutes: lesson.durationMinutes,
            status: lesson.status,
            attendance: lesson.attendance,
            teacherNote: lesson.teacherNote,
            lessonReport: lesson.lessonReport,
            studentNotePrivate: lesson.studentNotePrivate,
            studentNoteForTeacher: lesson.studentNoteForTeacher,
            reminderMinutesBefore: lesson.reminderMinutesBefore,
            teacher: {
                firstName: lesson.teacher.user.firstName,
                lastName: lesson.teacher.user.lastName,
                username: lesson.teacher.user.username,
            },
            subject: {
                name: lesson.subject.name,
                colorHex: lesson.subject.colorHex,
            },
            createdAt: lesson.createdAt.toISOString(),
            updatedAt: lesson.updatedAt.toISOString(),
        };
    }
    async updateLessonNotes(studentId, lessonId, data) {
        const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, studentId } });
        if (!lesson)
            throw new common_1.NotFoundException('LESSON_NOT_FOUND');
        if (data.studentNotePrivate !== undefined)
            lesson.studentNotePrivate = data.studentNotePrivate;
        if (data.studentNoteForTeacher !== undefined)
            lesson.studentNoteForTeacher = data.studentNoteForTeacher;
        if (data.reminderMinutesBefore !== undefined)
            lesson.reminderMinutesBefore = data.reminderMinutesBefore;
        await this.lessonRepo.save(lesson);
        return this.getLessonDetails(studentId, lessonId);
    }
    async cancelLesson(studentId, lessonId) {
        const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, studentId } });
        if (!lesson)
            throw new common_1.NotFoundException('LESSON_NOT_FOUND');
        if (lesson.status !== 'planned')
            throw new common_1.ForbiddenException('LESSON_NOT_CANCELLABLE');
        lesson.status = 'cancelled';
        lesson.cancelledBy = 'student';
        await this.lessonRepo.save(lesson);
        return this.getLessonDetails(studentId, lessonId);
    }
    async getStats(studentId) {
        const lessons = await this.lessonRepo.find({
            where: { studentId },
            relations: ['subject', 'teacher'],
        });
        const detailedStats = await this.statsService.getDetailedStatsForStudent(studentId);
        const streak = this.statsService.calculateStreak(lessons);
        const achievements = this.achievementsService.calculateAchievements(lessons, streak);
        return {
            total: detailedStats.total,
            bySubject: detailedStats.bySubject,
            streak,
            achievements,
        };
    }
    async getStatsWithTeacher(studentId, teacherId) {
        return this.statsService.getStatsForStudentWithTeacher(studentId, teacherId);
    }
    async getNotificationSettings(studentId) {
        let settings = await this.notificationSettingsRepo.findOne({
            where: { studentId },
        });
        if (!settings) {
            settings = this.notificationSettingsRepo.create({ studentId });
            await this.notificationSettingsRepo.save(settings);
        }
        return {
            defaultReminderMinutesBefore: settings.defaultReminderMinutesBefore,
            enableLessonReminders: settings.enableLessonReminders,
            enableLessonReports: settings.enableLessonReports,
        };
    }
    async updateNotificationSettings(studentId, data) {
        let settings = await this.notificationSettingsRepo.findOne({ where: { studentId } });
        if (!settings) {
            settings = this.notificationSettingsRepo.create({ studentId });
        }
        if (data.defaultReminderMinutesBefore !== undefined)
            settings.defaultReminderMinutesBefore = data.defaultReminderMinutesBefore;
        if (data.enableLessonReminders !== undefined)
            settings.enableLessonReminders = data.enableLessonReminders;
        if (data.enableLessonReports !== undefined)
            settings.enableLessonReports = data.enableLessonReports;
        await this.notificationSettingsRepo.save(settings);
        return this.getNotificationSettings(studentId);
    }
    formatUserInfo(user) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
        };
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.StudentProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.TeacherStudentLink)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Lesson)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.StudentNotificationSettings)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Subject)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        shared_1.StatsService,
        shared_1.AchievementsService])
], StudentService);
//# sourceMappingURL=student.service.js.map