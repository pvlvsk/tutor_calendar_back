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
    constructor(studentProfileRepo, linkRepo, lessonRepo, lessonStudentRepo, notificationSettingsRepo, subjectRepo, subscriptionRepo, statsService, achievementsService) {
        this.studentProfileRepo = studentProfileRepo;
        this.linkRepo = linkRepo;
        this.lessonRepo = lessonRepo;
        this.lessonStudentRepo = lessonStudentRepo;
        this.notificationSettingsRepo = notificationSettingsRepo;
        this.subjectRepo = subjectRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.statsService = statsService;
        this.achievementsService = achievementsService;
    }
    async getProfile(studentId) {
        const profile = await this.studentProfileRepo.findOne({
            where: { id: studentId },
            relations: ["user"],
        });
        if (!profile)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
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
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        return {
            parentInviteCode: profile.parentInviteCode,
            inviteUrl: (0, utils_1.generateInviteUrl)(profile.parentInviteCode),
            fallbackUrl: (0, utils_1.generateFallbackUrl)(profile.parentInviteCode),
        };
    }
    async updateProfile(studentId, customFields) {
        const profile = await this.studentProfileRepo.findOne({
            where: { id: studentId },
        });
        if (!profile)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        profile.customFields = customFields;
        await this.studentProfileRepo.save(profile);
        return this.getProfile(studentId);
    }
    async getTeachers(studentId) {
        const links = await this.linkRepo.find({
            where: { studentId },
            relations: ["teacher", "teacher.user"],
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
            relations: ["teacher", "teacher.user"],
        });
        if (!link)
            throw new common_1.NotFoundException("TEACHER_NOT_FOUND");
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
        const lessonStudents = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: [
                "lesson",
                "lesson.teacher",
                "lesson.teacher.user",
                "lesson.subject",
                "lesson.lessonStudents",
            ],
        });
        let lessons = lessonStudents
            .filter((ls) => ls.lesson)
            .filter((ls) => {
            const startAt = new Date(ls.lesson.startAt);
            return startAt >= new Date(from) && startAt <= new Date(to);
        });
        if (filters?.subjectId) {
            lessons = lessons.filter((ls) => ls.lesson.subjectId === filters.subjectId);
        }
        if (filters?.teacherId) {
            lessons = lessons.filter((ls) => ls.lesson.teacherId === filters.teacherId);
        }
        if (filters?.status) {
            lessons = lessons.filter((ls) => ls.lesson.status === filters.status);
        }
        lessons.sort((a, b) => new Date(a.lesson.startAt).getTime() -
            new Date(b.lesson.startAt).getTime());
        return lessons.map((ls) => {
            const totalStudentsCount = ls.lesson.lessonStudents?.length || 1;
            const otherStudentsCount = Math.max(0, totalStudentsCount - 1);
            return {
                id: ls.lesson.id,
                seriesId: ls.lesson.seriesId,
                teacherId: ls.lesson.teacherId,
                subjectId: ls.lesson.subjectId,
                startAt: ls.lesson.startAt.toISOString(),
                durationMinutes: ls.lesson.durationMinutes,
                status: ls.lesson.status,
                attendance: ls.attendance,
                paymentStatus: ls.paymentStatus,
                teacherNote: ls.lesson.teacherNote,
                lessonReport: ls.lesson.lessonReport,
                studentNotePrivate: ls.lesson.studentNotePrivate,
                studentNoteForTeacher: ls.lesson.studentNoteForTeacher,
                reminderMinutesBefore: ls.lesson.reminderMinutesBefore,
                meetingUrl: ls.lesson.meetingUrl,
                isGroupLesson: totalStudentsCount > 1,
                totalStudentsCount,
                otherStudentsCount,
                teacher: {
                    firstName: ls.lesson.teacher?.user?.firstName,
                    lastName: ls.lesson.teacher?.user?.lastName,
                },
                subject: {
                    name: ls.lesson.subject?.name,
                    colorHex: ls.lesson.subject?.colorHex,
                },
            };
        });
    }
    async getLessonDetails(studentId, lessonId) {
        const lessonStudent = await this.lessonStudentRepo.findOne({
            where: { lessonId, studentId },
            relations: [
                "lesson",
                "lesson.teacher",
                "lesson.teacher.user",
                "lesson.subject",
                "lesson.lessonStudents",
            ],
        });
        if (!lessonStudent)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        const lesson = lessonStudent.lesson;
        const totalStudentsCount = lesson.lessonStudents?.length || 1;
        const otherStudentsCount = Math.max(0, totalStudentsCount - 1);
        return {
            id: lesson.id,
            teacherId: lesson.teacherId,
            subjectId: lesson.subjectId,
            startAt: lesson.startAt.toISOString(),
            durationMinutes: lesson.durationMinutes,
            status: lesson.status,
            attendance: lessonStudent.attendance,
            paymentStatus: lessonStudent.paymentStatus,
            priceRub: lessonStudent.priceRub,
            rating: lessonStudent.rating,
            teacherNote: lesson.teacherNote,
            lessonReport: lesson.lessonReport,
            studentNotePrivate: lesson.studentNotePrivate,
            studentNoteForTeacher: lesson.studentNoteForTeacher,
            reminderMinutesBefore: lesson.reminderMinutesBefore,
            meetingUrl: lesson.meetingUrl,
            isGroupLesson: totalStudentsCount > 1,
            totalStudentsCount,
            otherStudentsCount,
            teacher: {
                firstName: lesson.teacher?.user?.firstName,
                lastName: lesson.teacher?.user?.lastName,
                username: lesson.teacher?.user?.username,
            },
            subject: {
                name: lesson.subject?.name,
                colorHex: lesson.subject?.colorHex,
            },
            createdAt: lesson.createdAt.toISOString(),
            updatedAt: lesson.updatedAt.toISOString(),
        };
    }
    async updateLessonNotes(studentId, lessonId, data) {
        const lessonStudent = await this.lessonStudentRepo.findOne({
            where: { lessonId, studentId },
            relations: ["lesson"],
        });
        if (!lessonStudent)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        const lesson = lessonStudent.lesson;
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
        const lessonStudent = await this.lessonStudentRepo.findOne({
            where: { lessonId, studentId },
            relations: ["lesson"],
        });
        if (!lessonStudent)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        const lesson = lessonStudent.lesson;
        if (lesson.status !== "planned")
            throw new common_1.ForbiddenException("LESSON_NOT_CANCELLABLE");
        lesson.status = "cancelled";
        lesson.cancelledBy = "student";
        await this.lessonRepo.save(lesson);
        return this.getLessonDetails(studentId, lessonId);
    }
    async getStats(studentId) {
        const lessonStudents = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: ["lesson", "lesson.subject", "lesson.teacher"],
        });
        const detailedStats = await this.statsService.getDetailedStatsForStudent(studentId);
        const streakData = this.calculateStreak(lessonStudents);
        const achievements = this.achievementsService.calculateAchievementsFromRecords(lessonStudents, streakData.current);
        return {
            total: detailedStats.total,
            bySubject: detailedStats.bySubject,
            streak: streakData,
            achievements,
        };
    }
    calculateStreak(records) {
        const attendedDates = records
            .filter((r) => r.attendance === "attended" && r.lesson)
            .map((r) => r.lesson.startAt.toISOString().split("T")[0])
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort()
            .reverse();
        if (attendedDates.length === 0)
            return { current: 0, max: 0 };
        let currentStreak = 1;
        let maxStreak = 1;
        let tempStreak = 1;
        for (let i = 0; i < attendedDates.length - 1; i++) {
            const diff = (new Date(attendedDates[i]).getTime() -
                new Date(attendedDates[i + 1]).getTime()) /
                (1000 * 60 * 60 * 24);
            if (diff <= 7) {
                tempStreak++;
                if (i === 0)
                    currentStreak = tempStreak;
            }
            else {
                maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 1;
            }
        }
        maxStreak = Math.max(maxStreak, tempStreak);
        return { current: currentStreak, max: maxStreak };
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
        let settings = await this.notificationSettingsRepo.findOne({
            where: { studentId },
        });
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
    async getSubscriptions(studentId) {
        const subscriptions = await this.subscriptionRepo.find({
            where: { studentId },
            relations: ["teacher", "teacher.user"],
            order: { createdAt: "DESC" },
        });
        return subscriptions.map((sub) => this.formatSubscription(sub));
    }
    async getSubscriptionByTeacher(studentId, teacherId) {
        const subscription = await this.subscriptionRepo.findOne({
            where: { studentId, teacherId, deletedAt: null },
            relations: ["teacher", "teacher.user"],
        });
        if (!subscription)
            return null;
        return this.formatSubscription(subscription);
    }
    formatSubscription(subscription) {
        const remainingLessons = subscription.type === "lessons" && subscription.totalLessons !== null
            ? Math.max(0, subscription.totalLessons - subscription.usedLessons)
            : null;
        const isExpired = subscription.type === "lessons"
            ? remainingLessons === 0
            : subscription.expiresAt
                ? new Date() > subscription.expiresAt
                : false;
        return {
            id: subscription.id,
            teacherId: subscription.teacherId,
            teacherName: subscription.teacher?.displayName ||
                subscription.teacher?.user?.firstName ||
                "Учитель",
            type: subscription.type,
            totalLessons: subscription.totalLessons,
            usedLessons: subscription.usedLessons,
            remainingLessons,
            expiresAt: subscription.expiresAt?.toISOString() || null,
            name: subscription.name,
            isExpired,
            isActive: !subscription.deletedAt && !isExpired,
            createdAt: subscription.createdAt.toISOString(),
        };
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
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.LessonStudent)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.StudentNotificationSettings)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.Subject)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        shared_1.StatsService,
        shared_1.AchievementsService])
], StudentService);
//# sourceMappingURL=student.service.js.map