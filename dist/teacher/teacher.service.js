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
exports.TeacherService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const entities_1 = require("../database/entities");
const shared_1 = require("../shared");
const utils_1 = require("../shared/utils");
const bot_service_1 = require("../bot/bot.service");
let TeacherService = class TeacherService {
    constructor(teacherProfileRepo, subjectRepo, linkRepo, lessonRepo, seriesRepo, lessonStudentRepo, seriesStudentRepo, invitationRepo, parentRelationRepo, studentProfileRepo, subscriptionRepo, statsService, debtService, botService) {
        this.teacherProfileRepo = teacherProfileRepo;
        this.subjectRepo = subjectRepo;
        this.linkRepo = linkRepo;
        this.lessonRepo = lessonRepo;
        this.seriesRepo = seriesRepo;
        this.lessonStudentRepo = lessonStudentRepo;
        this.seriesStudentRepo = seriesStudentRepo;
        this.invitationRepo = invitationRepo;
        this.parentRelationRepo = parentRelationRepo;
        this.studentProfileRepo = studentProfileRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.statsService = statsService;
        this.debtService = debtService;
        this.botService = botService;
    }
    async getProfile(teacherId) {
        const profile = await this.teacherProfileRepo.findOne({
            where: { id: teacherId },
            relations: ["user"],
        });
        if (!profile)
            throw new common_1.NotFoundException("TEACHER_NOT_FOUND");
        return {
            id: profile.id,
            displayName: profile.displayName,
            bio: profile.bio,
            referralCode: profile.referralCode,
            inviteUrl: (0, utils_1.generateInviteUrl)(profile.referralCode),
            city: profile.user?.city,
            timezone: profile.user?.timezone,
        };
    }
    async getInviteLink(teacherId) {
        const profile = await this.teacherProfileRepo.findOne({
            where: { id: teacherId },
        });
        if (!profile)
            throw new common_1.NotFoundException("TEACHER_NOT_FOUND");
        return {
            referralCode: profile.referralCode,
            inviteUrl: (0, utils_1.generateInviteUrl)(profile.referralCode),
            fallbackUrl: (0, utils_1.generateFallbackUrl)(profile.referralCode),
        };
    }
    async updateProfile(teacherId, data) {
        await this.teacherProfileRepo.update({ id: teacherId }, data);
        return this.getProfile(teacherId);
    }
    async getSubjects(teacherId) {
        return this.subjectRepo.find({
            where: { teacherId, archivedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: "ASC" },
        });
    }
    async getArchivedSubjects(teacherId) {
        const subjects = await this.subjectRepo.find({
            where: { teacherId },
            order: { archivedAt: "DESC" },
        });
        return subjects.filter((s) => s.archivedAt !== null);
    }
    async createSubject(teacherId, data) {
        const existingByName = await this.subjectRepo.findOne({
            where: { teacherId, name: data.name },
        });
        if (existingByName)
            throw new common_1.ConflictException("SUBJECT_NAME_EXISTS");
        const code = data.code || this.generateCode(data.name);
        const existingByCode = await this.subjectRepo.findOne({
            where: { teacherId, code },
        });
        if (existingByCode)
            throw new common_1.ConflictException("SUBJECT_CODE_EXISTS");
        const subject = this.subjectRepo.create({
            name: data.name,
            code,
            colorHex: data.colorHex,
            teacherId,
        });
        return this.subjectRepo.save(subject);
    }
    generateCode(name) {
        const translitMap = {
            а: "a",
            б: "b",
            в: "v",
            г: "g",
            д: "d",
            е: "e",
            ё: "e",
            ж: "zh",
            з: "z",
            и: "i",
            й: "y",
            к: "k",
            л: "l",
            м: "m",
            н: "n",
            о: "o",
            п: "p",
            р: "r",
            с: "s",
            т: "t",
            у: "u",
            ф: "f",
            х: "h",
            ц: "ts",
            ч: "ch",
            ш: "sh",
            щ: "sch",
            ъ: "",
            ы: "y",
            ь: "",
            э: "e",
            ю: "yu",
            я: "ya",
        };
        return name
            .toLowerCase()
            .split("")
            .map((char) => translitMap[char] || char)
            .join("")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "")
            .substring(0, 50);
    }
    async updateSubject(teacherId, subjectId, data) {
        const subject = await this.subjectRepo.findOne({
            where: { id: subjectId, teacherId },
        });
        if (!subject)
            throw new common_1.NotFoundException("SUBJECT_NOT_FOUND");
        if (data.name && data.name !== subject.name) {
            const existingByName = await this.subjectRepo.findOne({
                where: { teacherId, name: data.name },
            });
            if (existingByName)
                throw new common_1.ConflictException("SUBJECT_NAME_EXISTS");
        }
        await this.subjectRepo.update({ id: subjectId }, data);
        return this.subjectRepo.findOne({ where: { id: subjectId } });
    }
    async deleteSubject(teacherId, subjectId) {
        const subject = await this.subjectRepo.findOne({
            where: { id: subjectId, teacherId },
        });
        if (!subject)
            throw new common_1.NotFoundException("SUBJECT_NOT_FOUND");
        const lessonsCount = await this.lessonRepo.count({ where: { subjectId } });
        if (lessonsCount > 0) {
            subject.archivedAt = new Date();
            await this.subjectRepo.save(subject);
            return { success: true, action: "archived", lessonsCount };
        }
        await this.subjectRepo.delete({ id: subjectId });
        return { success: true, action: "deleted" };
    }
    async restoreSubject(teacherId, subjectId) {
        const subject = await this.subjectRepo.findOne({
            where: { id: subjectId, teacherId },
        });
        if (!subject)
            throw new common_1.NotFoundException("SUBJECT_NOT_FOUND");
        if (!subject.archivedAt) {
            throw new common_1.ConflictException("SUBJECT_NOT_ARCHIVED");
        }
        subject.archivedAt = null;
        await this.subjectRepo.save(subject);
        return { success: true };
    }
    async getStudents(teacherId) {
        const links = await this.linkRepo.find({
            where: { teacherId, archivedAt: (0, typeorm_2.IsNull)() },
            relations: ["student", "student.user"],
        });
        const allSubjects = await this.subjectRepo.find({ where: { teacherId } });
        const students = [];
        for (const link of links) {
            const stats = await this.statsService.getStudentStatsForTeacher(teacherId, link.studentId);
            const debt = await this.debtService.getStudentDebtForTeacher(teacherId, link.studentId);
            const lessonStudentRecords = await this.lessonStudentRepo.find({
                where: { studentId: link.studentId },
                relations: ["lesson"],
            });
            const teacherLessons = lessonStudentRecords.filter((ls) => ls.lesson?.teacherId === teacherId);
            const uniqueSubjectIds = [
                ...new Set(teacherLessons.map((ls) => ls.lesson?.subjectId)),
            ];
            const subjects = allSubjects
                .filter((s) => uniqueSubjectIds.includes(s.id))
                .map((s) => ({
                subjectId: s.id,
                name: s.name,
                colorHex: s.colorHex,
            }));
            students.push({
                studentId: link.studentId,
                studentUser: this.formatUserInfo(link.student.user),
                customFields: link.customFields,
                subjects,
                stats,
                debt,
                createdAt: link.createdAt.toISOString(),
            });
        }
        return students;
    }
    async getStudentDetails(teacherId, studentId) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
            relations: ["student", "student.user"],
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        const stats = await this.statsService.getStudentStatsForTeacher(teacherId, studentId);
        const debt = await this.debtService.getStudentDebtForTeacher(teacherId, studentId);
        const subscription = await this.getStudentSubscription(teacherId, studentId);
        return {
            studentId,
            studentUser: this.formatUserInfo(link.student.user),
            customFields: link.customFields || link.student.customFields,
            stats,
            debt,
            subscription,
            parentInvite: {
                code: link.student.parentInviteCode,
                url: (0, utils_1.generateInviteUrl)(link.student.parentInviteCode),
            },
            createdAt: link.createdAt.toISOString(),
        };
    }
    async updateStudentCustomFields(teacherId, studentId, customFields) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        link.customFields = customFields;
        await this.linkRepo.save(link);
        return this.getStudentDetails(teacherId, studentId);
    }
    async deleteStudent(teacherId, studentId, deleteIndividualLessons = false) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId, archivedAt: (0, typeorm_2.IsNull)() },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        await this.processStudentLessonsOnArchive(teacherId, studentId, deleteIndividualLessons);
        await this.parentRelationRepo.delete({ teacherId, studentId });
        link.archivedAt = new Date();
        await this.linkRepo.save(link);
        return {
            success: true,
            action: "archived",
            restoreUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
    }
    async processStudentLessonsOnArchive(teacherId, studentId, deleteIndividualLessons) {
        const lessonStudentRecords = await this.lessonStudentRepo.find({
            where: { studentId },
            relations: ["lesson"],
        });
        const teacherLessonRecords = lessonStudentRecords.filter((ls) => ls.lesson?.teacherId === teacherId);
        for (const record of teacherLessonRecords) {
            const lessonId = record.lessonId;
            const studentsOnLesson = await this.lessonStudentRepo.count({
                where: { lessonId },
            });
            if (studentsOnLesson === 1) {
                if (deleteIndividualLessons) {
                    await this.lessonStudentRepo.delete({ lessonId });
                    await this.lessonRepo.delete({ id: lessonId });
                }
                else {
                    await this.lessonStudentRepo.delete({ lessonId, studentId });
                }
            }
            else {
                await this.lessonStudentRepo.delete({ lessonId, studentId });
            }
        }
        const seriesStudentRecords = await this.seriesStudentRepo.find({
            where: { studentId },
            relations: ["series"],
        });
        const teacherSeriesRecords = seriesStudentRecords.filter((ss) => ss.series?.teacherId === teacherId);
        for (const record of teacherSeriesRecords) {
            await this.seriesStudentRepo.delete({ seriesId: record.seriesId, studentId });
        }
    }
    async getArchivedStudents(teacherId) {
        const links = await this.linkRepo.find({
            where: { teacherId, archivedAt: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
            relations: ["student", "student.user"],
            order: { archivedAt: "DESC" },
        });
        return links.map((link) => {
            const archivedAt = link.archivedAt;
            const deleteAt = new Date(archivedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
            const daysLeft = Math.max(0, Math.ceil((deleteAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return {
                studentId: link.studentId,
                studentUser: this.formatUserInfo(link.student.user),
                customFields: link.customFields,
                archivedAt: archivedAt.toISOString(),
                deleteAt: deleteAt.toISOString(),
                daysLeft,
                createdAt: link.createdAt.toISOString(),
            };
        });
    }
    async restoreStudent(teacherId, studentId) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId, archivedAt: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
        });
        if (!link)
            throw new common_1.NotFoundException("ARCHIVED_STUDENT_NOT_FOUND");
        const archivedAt = link.archivedAt;
        const deleteAt = new Date(archivedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (Date.now() > deleteAt.getTime()) {
            throw new common_1.ConflictException("ARCHIVE_EXPIRED");
        }
        link.archivedAt = null;
        await this.linkRepo.save(link);
        return { success: true };
    }
    async cleanupExpiredArchives() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await this.linkRepo.delete({
            archivedAt: (0, typeorm_2.LessThanOrEqual)(sevenDaysAgo),
        });
        console.log(`[TeacherService] Cleaned up ${result.affected} expired archived students`);
        return { deleted: result.affected || 0 };
    }
    async createStudentInvitation(teacherId) {
        const token = "INV_" + (0, crypto_1.randomBytes)(16).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invitation = this.invitationRepo.create({
            type: "student",
            teacherId,
            token,
            expiresAt,
        });
        await this.invitationRepo.save(invitation);
        return {
            invitationId: invitation.id,
            token,
            inviteUrl: (0, utils_1.generateInviteUrl)(token),
            expiresAt: invitation.expiresAt.toISOString(),
        };
    }
    async createParentInvitation(teacherId, studentId) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        const token = "PARENT_" + (0, crypto_1.randomBytes)(16).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invitation = this.invitationRepo.create({
            type: "parent",
            teacherId,
            studentId,
            token,
            expiresAt,
        });
        await this.invitationRepo.save(invitation);
        return {
            invitationId: invitation.id,
            token,
            inviteUrl: (0, utils_1.generateInviteUrl)(token),
            expiresAt: invitation.expiresAt.toISOString(),
        };
    }
    async getStudentParents(teacherId, studentId) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        const relations = await this.parentRelationRepo.find({
            where: { teacherId, studentId },
            relations: ["parent", "parent.user"],
        });
        return relations.map((r) => ({
            parentId: r.parent.id,
            parentUser: this.formatUserInfo(r.parent.user),
            notificationsEnabled: r.notificationsEnabled,
            createdAt: r.createdAt.toISOString(),
        }));
    }
    async updateParentNotifications(teacherId, studentId, parentId, notificationsEnabled) {
        const relation = await this.parentRelationRepo.findOne({
            where: { teacherId, studentId, parentId },
        });
        if (!relation)
            throw new common_1.NotFoundException("PARENT_RELATION_NOT_FOUND");
        relation.notificationsEnabled = notificationsEnabled;
        await this.parentRelationRepo.save(relation);
        return { success: true, notificationsEnabled };
    }
    async getLessons(teacherId, from, to, filters) {
        const whereClause = {
            teacherId,
            startAt: (0, typeorm_2.Between)(new Date(from), new Date(to)),
        };
        if (filters?.subjectId)
            whereClause.subjectId = filters.subjectId;
        if (filters?.status)
            whereClause.status = filters.status;
        let lessons = await this.lessonRepo.find({
            where: whereClause,
            relations: [
                "subject",
                "lessonStudents",
                "lessonStudents.student",
                "lessonStudents.student.user",
            ],
            order: { startAt: "ASC" },
        });
        if (filters?.studentId) {
            lessons = lessons.filter((l) => l.lessonStudents.some((ls) => ls.studentId === filters.studentId));
        }
        return lessons.map((l) => this.formatLessonWithStudents(l));
    }
    async getLessonDetails(teacherId, lessonId) {
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
            relations: [
                "subject",
                "series",
                "lessonStudents",
                "lessonStudents.student",
                "lessonStudents.student.user",
            ],
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        return {
            ...this.formatLessonWithStudents(lesson),
            series: lesson.series
                ? {
                    id: lesson.series.id,
                    recurrence: {
                        frequency: lesson.series.frequency,
                        dayOfWeek: lesson.series.dayOfWeek,
                    },
                }
                : null,
        };
    }
    async createLesson(teacherId, data) {
        const studentIds = data.studentIds || (data.studentId ? [data.studentId] : []);
        for (const studentId of studentIds) {
            const link = await this.linkRepo.findOne({
                where: { teacherId, studentId },
            });
            if (!link)
                throw new common_1.ForbiddenException("STUDENT_NOT_LINKED");
        }
        let subjectName = null;
        if (data.subjectId) {
            const subject = await this.subjectRepo.findOne({
                where: { id: data.subjectId, teacherId },
            });
            if (!subject)
                throw new common_1.NotFoundException("SUBJECT_NOT_FOUND");
            subjectName = subject.name;
        }
        if (data.recurrence && data.recurrence.frequency !== "none") {
            return this.createRecurringLessons(teacherId, data, subjectName);
        }
        const isFree = data.isFree || false;
        const priceRub = data.priceRub || 0;
        const lesson = this.lessonRepo.create({
            teacherId,
            subjectId: data.subjectId || null,
            startAt: new Date(data.startAt),
            durationMinutes: data.durationMinutes,
            priceRub,
            isFree,
            teacherNote: data.teacherNote,
            reminderMinutesBefore: data.reminderMinutesBefore,
            meetingUrl: data.meetingUrl,
        });
        const saved = await this.lessonRepo.save(lesson);
        const paymentType = data.paymentType || (isFree ? "free" : "fixed");
        for (const studentId of studentIds) {
            const lessonStudent = this.lessonStudentRepo.create({
                lessonId: saved.id,
                studentId,
                priceRub: paymentType === "subscription" || isFree ? 0 : priceRub,
                paymentType,
            });
            await this.lessonStudentRepo.save(lessonStudent);
        }
        await this.notifyStudentsAboutNewLesson(teacherId, studentIds, subjectName || "Занятие", new Date(data.startAt), data.meetingUrl);
        return this.getLessonWithDetails(saved.id);
    }
    async createRecurringLessons(teacherId, data, subjectName) {
        const startDate = new Date(data.startAt);
        const timeOfDay = startDate.toTimeString().slice(0, 5);
        const dayOfWeek = startDate.getDay();
        const studentIds = data.studentIds || (data.studentId ? [data.studentId] : []);
        const isFree = data.isFree || false;
        const priceRub = data.priceRub || 0;
        const series = new entities_1.LessonSeries();
        series.teacherId = teacherId;
        series.subjectId = data.subjectId || null;
        series.frequency = data.recurrence.frequency;
        series.dayOfWeek = dayOfWeek;
        series.timeOfDay = timeOfDay;
        series.durationMinutes = data.durationMinutes;
        series.priceRub = priceRub;
        series.isFree = isFree;
        series.maxOccurrences = data.recurrence.count || 10;
        series.meetingUrl = data.meetingUrl;
        if (data.recurrence.endDate) {
            series.endDate = new Date(data.recurrence.endDate);
        }
        await this.seriesRepo.save(series);
        for (const studentId of studentIds) {
            const seriesStudent = this.seriesStudentRepo.create({
                seriesId: series.id,
                studentId,
                priceRub: isFree ? 0 : priceRub,
            });
            await this.seriesStudentRepo.save(seriesStudent);
        }
        const lessons = [];
        let currentDate = new Date(startDate);
        const endDate = data.recurrence.endDate
            ? new Date(data.recurrence.endDate)
            : null;
        const maxCount = data.recurrence.count || (endDate ? 200 : 10);
        const intervalDays = data.recurrence.frequency === "biweekly" ? 14 : 7;
        while (lessons.length < maxCount) {
            if (endDate && currentDate > endDate)
                break;
            const lesson = this.lessonRepo.create({
                seriesId: series.id,
                teacherId,
                subjectId: data.subjectId || null,
                startAt: new Date(currentDate),
                durationMinutes: data.durationMinutes,
                priceRub,
                isFree,
                teacherNote: data.teacherNote,
                reminderMinutesBefore: data.reminderMinutesBefore,
                meetingUrl: data.meetingUrl,
            });
            await this.lessonRepo.save(lesson);
            const paymentType = data.paymentType || (isFree ? "free" : "fixed");
            for (const studentId of studentIds) {
                const lessonStudent = this.lessonStudentRepo.create({
                    lessonId: lesson.id,
                    studentId,
                    priceRub: paymentType === "subscription" || isFree ? 0 : priceRub,
                    paymentType,
                });
                await this.lessonStudentRepo.save(lessonStudent);
            }
            lessons.push(lesson);
            currentDate.setDate(currentDate.getDate() + intervalDays);
        }
        return {
            series: {
                id: series.id,
                frequency: series.frequency,
                dayOfWeek: series.dayOfWeek,
                timeOfDay: series.timeOfDay,
            },
            lessonsCreated: lessons.length,
            lessons: lessons.map((l) => ({
                id: l.id,
                startAt: l.startAt.toISOString(),
                status: l.status,
            })),
        };
    }
    async convertToSeries(teacherId, existingLesson, data) {
        const startDate = data.startAt
            ? new Date(data.startAt)
            : existingLesson.startAt;
        const dayOfWeek = startDate.getDay();
        const timeOfDay = `${startDate
            .getHours()
            .toString()
            .padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
        const series = new entities_1.LessonSeries();
        series.teacherId = teacherId;
        series.subjectId = data.subjectId ?? existingLesson.subjectId;
        series.frequency = data.recurrence.frequency;
        series.dayOfWeek = dayOfWeek;
        series.timeOfDay = timeOfDay;
        series.durationMinutes =
            data.durationMinutes ?? existingLesson.durationMinutes;
        series.priceRub = data.priceRub ?? existingLesson.priceRub;
        series.isFree = data.isFree ?? existingLesson.isFree;
        series.maxOccurrences = data.recurrence.count || 10;
        if (data.recurrence.endDate) {
            series.endDate = new Date(data.recurrence.endDate);
        }
        await this.seriesRepo.save(series);
        existingLesson.seriesId = series.id;
        existingLesson.startAt = startDate;
        if (data.subjectId !== undefined)
            existingLesson.subjectId = data.subjectId;
        if (data.durationMinutes !== undefined)
            existingLesson.durationMinutes = data.durationMinutes;
        if (data.priceRub !== undefined)
            existingLesson.priceRub = data.priceRub;
        await this.lessonRepo.save(existingLesson);
        const lessons = [existingLesson];
        let currentDate = new Date(startDate);
        const endDate = data.recurrence.endDate
            ? new Date(data.recurrence.endDate)
            : null;
        const maxCount = data.recurrence.count || (endDate ? 200 : 10);
        const intervalDays = data.recurrence.frequency === "biweekly" ? 14 : 7;
        currentDate.setDate(currentDate.getDate() + intervalDays);
        while (lessons.length < maxCount) {
            if (endDate && currentDate > endDate)
                break;
            const lesson = this.lessonRepo.create({
                seriesId: series.id,
                teacherId,
                subjectId: data.subjectId ?? existingLesson.subjectId,
                startAt: new Date(currentDate),
                durationMinutes: data.durationMinutes ?? existingLesson.durationMinutes,
                priceRub: data.priceRub ?? existingLesson.priceRub,
            });
            await this.lessonRepo.save(lesson);
            lessons.push(lesson);
            currentDate.setDate(currentDate.getDate() + intervalDays);
        }
        return {
            series: {
                id: series.id,
                frequency: series.frequency,
            },
            lessonsCreated: lessons.length,
            lessons: lessons.map((l) => ({
                id: l.id,
                startAt: l.startAt.toISOString(),
                status: l.status,
            })),
        };
    }
    async updateLesson(teacherId, lessonId, data, applyToSeries) {
        console.log(`[updateLesson] lessonId: ${lessonId}`);
        console.log(`[updateLesson] applyToSeries: ${applyToSeries}`);
        console.log(`[updateLesson] data:`, JSON.stringify(data, null, 2));
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
            relations: ["series"],
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        console.log(`[updateLesson] lesson.seriesId: ${lesson.seriesId}`);
        if (data.studentId !== undefined && data.studentId !== null) {
            const link = await this.linkRepo.findOne({
                where: { teacherId, studentId: data.studentId },
            });
            if (!link)
                throw new common_1.ForbiddenException("STUDENT_NOT_LINKED");
        }
        if (data.subjectId !== undefined) {
            const subject = await this.subjectRepo.findOne({
                where: { id: data.subjectId, teacherId },
            });
            if (!subject)
                throw new common_1.NotFoundException("SUBJECT_NOT_FOUND");
        }
        if (data.recurrence &&
            data.recurrence.frequency &&
            data.recurrence.frequency !== "none" &&
            !lesson.seriesId) {
            return this.convertToSeries(teacherId, lesson, data);
        }
        const seriesUpdateData = {};
        if (data.subjectId !== undefined)
            seriesUpdateData.subjectId = data.subjectId;
        if (data.durationMinutes !== undefined)
            seriesUpdateData.durationMinutes = data.durationMinutes;
        if (data.isFree !== undefined)
            seriesUpdateData.isFree = data.isFree;
        if (data.priceRub !== undefined)
            seriesUpdateData.priceRub = data.priceRub;
        if (data.meetingUrl !== undefined)
            seriesUpdateData.meetingUrl = data.meetingUrl;
        if (data.isFree === true)
            seriesUpdateData.priceRub = 0;
        const singleLessonData = { ...seriesUpdateData };
        if (data.startAt !== undefined)
            singleLessonData.startAt = new Date(data.startAt);
        if (data.status !== undefined)
            singleLessonData.status = data.status;
        if (data.attendance !== undefined)
            singleLessonData.attendance = data.attendance;
        if (data.paymentStatus !== undefined)
            singleLessonData.paymentStatus = data.paymentStatus;
        if (data.cancelledBy !== undefined)
            singleLessonData.cancelledBy = data.cancelledBy;
        if (data.rescheduledTo !== undefined)
            singleLessonData.rescheduledTo = data.rescheduledTo;
        if (data.teacherNote !== undefined) {
            singleLessonData.teacherNote = data.teacherNote;
            singleLessonData.teacherNoteUpdatedAt = new Date();
        }
        if (data.lessonReport !== undefined && !lesson.lessonReport) {
            singleLessonData.lessonReport = data.lessonReport;
        }
        if (data.studentNotePrivate !== undefined)
            singleLessonData.studentNotePrivate = data.studentNotePrivate;
        if (applyToSeries && applyToSeries !== "this" && lesson.seriesId) {
            console.log(`[updateLesson] Applying to series: ${applyToSeries}`);
            const whereClause = { seriesId: lesson.seriesId, teacherId };
            if (applyToSeries === "future") {
                whereClause.startAt = (0, typeorm_2.MoreThanOrEqual)(lesson.startAt);
            }
            console.log(`[updateLesson] whereClause:`, whereClause);
            if (Object.keys(seriesUpdateData).length > 0) {
                console.log(`[updateLesson] seriesUpdateData:`, seriesUpdateData);
                await this.lessonRepo.update(whereClause, seriesUpdateData);
            }
            else {
                console.log(`[updateLesson] seriesUpdateData is empty`);
            }
            const individualFields = {};
            if (data.startAt !== undefined)
                individualFields.startAt = new Date(data.startAt);
            if (data.status !== undefined)
                individualFields.status = data.status;
            if (data.attendance !== undefined)
                individualFields.attendance = data.attendance;
            if (data.paymentStatus !== undefined)
                individualFields.paymentStatus = data.paymentStatus;
            if (data.teacherNote !== undefined) {
                individualFields.teacherNote = data.teacherNote;
                individualFields.teacherNoteUpdatedAt = new Date();
            }
            if (Object.keys(individualFields).length > 0) {
                await this.lessonRepo.update({ id: lessonId }, individualFields);
            }
            const seriesUpdate = {};
            if (data.subjectId !== undefined)
                seriesUpdate.subjectId = data.subjectId;
            if (Object.keys(seriesUpdate).length > 0) {
                await this.seriesRepo.update({ id: lesson.seriesId }, seriesUpdate);
            }
            if (data.studentIds && Array.isArray(data.studentIds)) {
                console.log(`[updateLesson] Updating students for series: ${data.studentIds}`);
                const lessonsToUpdate = await this.lessonRepo.find({
                    where: whereClause,
                });
                console.log(`[updateLesson] Found ${lessonsToUpdate.length} lessons to update students`);
                const priceRub = data.isFree ? 0 : data.priceRub ?? lesson.priceRub;
                const existingSeriesStudents = await this.seriesStudentRepo.find({
                    where: { seriesId: lesson.seriesId },
                });
                const existingStudentIds = existingSeriesStudents.map(ss => ss.studentId);
                for (const lessonToUpdate of lessonsToUpdate) {
                    await this.lessonStudentRepo.delete({ lessonId: lessonToUpdate.id });
                    for (const studentId of data.studentIds) {
                        const lessonStudent = this.lessonStudentRepo.create({
                            lessonId: lessonToUpdate.id,
                            studentId,
                            priceRub,
                        });
                        await this.lessonStudentRepo.save(lessonStudent);
                    }
                }
                await this.seriesStudentRepo.delete({ seriesId: lesson.seriesId });
                for (const studentId of data.studentIds) {
                    const seriesStudent = this.seriesStudentRepo.create({
                        seriesId: lesson.seriesId,
                        studentId,
                        priceRub,
                    });
                    await this.seriesStudentRepo.save(seriesStudent);
                }
                const newStudentIds = data.studentIds.filter((id) => !existingStudentIds.includes(id));
                if (newStudentIds.length > 0) {
                    console.log(`[updateLesson] New students added to series: ${newStudentIds}`);
                    let subjectName;
                    if (lesson.subjectId) {
                        const subject = await this.subjectRepo.findOne({
                            where: { id: lesson.subjectId },
                        });
                        subjectName = subject?.name;
                    }
                    await this.notifyStudentsAboutNewLesson(teacherId, newStudentIds, subjectName, lesson.startAt, data.meetingUrl ?? lesson.meetingUrl);
                }
                console.log(`[updateLesson] Students updated successfully`);
            }
        }
        else {
            await this.lessonRepo.update({ id: lessonId }, singleLessonData);
            if (data.studentIds && Array.isArray(data.studentIds)) {
                console.log(`[updateLesson] Updating students for single lesson: ${data.studentIds}`);
                const priceRub = data.isFree ? 0 : data.priceRub ?? lesson.priceRub;
                const existingLessonStudents = await this.lessonStudentRepo.find({
                    where: { lessonId },
                });
                const existingStudentIds = existingLessonStudents.map(ls => ls.studentId);
                await this.lessonStudentRepo.delete({ lessonId });
                for (const studentId of data.studentIds) {
                    const lessonStudent = this.lessonStudentRepo.create({
                        lessonId,
                        studentId,
                        priceRub,
                    });
                    await this.lessonStudentRepo.save(lessonStudent);
                }
                const newStudentIds = data.studentIds.filter((id) => !existingStudentIds.includes(id));
                if (newStudentIds.length > 0) {
                    console.log(`[updateLesson] New students added: ${newStudentIds}`);
                    let subjectName;
                    if (lesson.subjectId) {
                        const subject = await this.subjectRepo.findOne({
                            where: { id: lesson.subjectId },
                        });
                        subjectName = subject?.name;
                    }
                    await this.notifyStudentsAboutNewLesson(teacherId, newStudentIds, subjectName, lesson.startAt, data.meetingUrl ?? lesson.meetingUrl);
                }
                console.log(`[updateLesson] Students updated for single lesson`);
            }
        }
        return this.getLessonWithDetails(lessonId);
    }
    async deleteLesson(teacherId, lessonId, applyToSeries) {
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
            relations: ["series"],
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        if (applyToSeries && applyToSeries !== "this" && lesson.seriesId) {
            const whereClause = { seriesId: lesson.seriesId, teacherId };
            if (applyToSeries === "future") {
                whereClause.startAt = (0, typeorm_2.MoreThanOrEqual)(lesson.startAt);
            }
            await this.lessonRepo.delete(whereClause);
            if (applyToSeries === "all") {
                await this.seriesRepo.delete({ id: lesson.seriesId });
            }
        }
        else {
            await this.lessonRepo.delete({ id: lessonId });
        }
        return { success: true };
    }
    async getLessonSeries(teacherId) {
        const series = await this.seriesRepo.find({
            where: { teacherId },
            relations: [
                "seriesStudents",
                "seriesStudents.student",
                "seriesStudents.student.user",
                "subject",
            ],
            order: { createdAt: "ASC" },
        });
        const result = [];
        for (const s of series) {
            const lessonsCount = await this.lessonRepo.count({
                where: { seriesId: s.id },
            });
            const lessonsDone = await this.lessonRepo.count({
                where: { seriesId: s.id, status: "done" },
            });
            result.push({
                id: s.id,
                subjectId: s.subjectId,
                recurrence: {
                    frequency: s.frequency,
                    dayOfWeek: s.dayOfWeek,
                    endDate: s.endDate?.toISOString(),
                },
                timeOfDay: s.timeOfDay,
                durationMinutes: s.durationMinutes,
                priceRub: s.priceRub,
                isFree: s.isFree,
                students: (s.seriesStudents || []).map((ss) => ({
                    studentId: ss.studentId,
                    firstName: ss.student?.user?.firstName,
                    lastName: ss.student?.user?.lastName,
                    priceRub: ss.priceRub,
                })),
                subject: s.subject
                    ? {
                        name: s.subject.name,
                        colorHex: s.subject.colorHex,
                    }
                    : null,
                lessonsCount,
                lessonsDone,
                lessonsRemaining: lessonsCount - lessonsDone,
            });
        }
        return result;
    }
    async getStudentLessons(teacherId, studentId, filters) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        const whereClause = { teacherId, studentId };
        if (filters?.status)
            whereClause.status = filters.status;
        if (filters?.paymentStatus)
            whereClause.paymentStatus = filters.paymentStatus;
        if (filters?.attendance)
            whereClause.attendance = filters.attendance;
        if (filters?.subjectId)
            whereClause.subjectId = filters.subjectId;
        const lessons = await this.lessonRepo.find({
            where: whereClause,
            relations: ["subject"],
            order: { startAt: "DESC" },
        });
        return lessons.map((l) => ({
            id: l.id,
            seriesId: l.seriesId,
            subjectId: l.subjectId,
            startAt: l.startAt.toISOString(),
            durationMinutes: l.durationMinutes,
            priceRub: l.priceRub,
            isFree: l.isFree,
            status: l.status,
            cancelledBy: l.cancelledBy,
            teacherNote: l.teacherNote,
            teacherNoteUpdatedAt: l.teacherNoteUpdatedAt?.toISOString() || null,
            lessonReport: l.lessonReport,
            studentNoteForTeacher: l.studentNoteForTeacher,
            subject: l.subject
                ? {
                    name: l.subject.name,
                    colorHex: l.subject.colorHex,
                }
                : null,
        }));
    }
    async getStudentDebtDetails(teacherId, studentId) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        return this.debtService.getStudentDebtDetailsForTeacher(teacherId, studentId);
    }
    async getStudentCardStats(teacherId, studentId) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        return this.statsService.getStudentCardStats(teacherId, studentId);
    }
    async getStudentDetailedStats(teacherId, studentId) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        return this.statsService.getStudentDetailedStats(teacherId, studentId);
    }
    async addStudentToLesson(teacherId, lessonId, studentId, priceRub) {
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.ForbiddenException("STUDENT_NOT_LINKED");
        const existing = await this.lessonStudentRepo.findOne({
            where: { lessonId, studentId },
        });
        if (existing)
            throw new common_1.ConflictException("STUDENT_ALREADY_ON_LESSON");
        const lessonStudent = this.lessonStudentRepo.create({
            lessonId,
            studentId,
            priceRub: lesson.isFree ? 0 : priceRub ?? lesson.priceRub,
        });
        await this.lessonStudentRepo.save(lessonStudent);
        let subjectName;
        if (lesson.subjectId) {
            const subject = await this.subjectRepo.findOne({
                where: { id: lesson.subjectId },
            });
            subjectName = subject?.name;
        }
        await this.notifyStudentsAboutNewLesson(teacherId, [studentId], subjectName, lesson.startAt, lesson.meetingUrl);
        return this.getLessonWithDetails(lessonId);
    }
    async removeStudentFromLesson(teacherId, lessonId, studentId) {
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        const lessonStudent = await this.lessonStudentRepo.findOne({
            where: { lessonId, studentId },
        });
        if (!lessonStudent)
            throw new common_1.NotFoundException("STUDENT_NOT_ON_LESSON");
        await this.lessonStudentRepo.delete({ lessonId, studentId });
        return this.getLessonWithDetails(lessonId);
    }
    async updateLessonStudent(teacherId, lessonId, studentId, data) {
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        const lessonStudent = await this.lessonStudentRepo.findOne({
            where: { lessonId, studentId },
        });
        if (!lessonStudent)
            throw new common_1.NotFoundException("STUDENT_NOT_ON_LESSON");
        if (data.paymentStatus !== undefined) {
            lessonStudent.paymentStatus = data.paymentStatus;
        }
        await this.lessonStudentRepo.save(lessonStudent);
        return { success: true, paymentStatus: lessonStudent.paymentStatus };
    }
    async completeLesson(teacherId, lessonId, studentsData) {
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        for (const data of studentsData) {
            const lessonStudent = await this.lessonStudentRepo.findOne({
                where: { lessonId, studentId: data.studentId },
            });
            if (!lessonStudent)
                continue;
            lessonStudent.attendance = data.attendance;
            if (data.attendance === "missed") {
                lessonStudent.rating = null;
                lessonStudent.paymentStatus = "unpaid";
                lessonStudent.paidFromSubscription = false;
            }
            else {
                if (data.rating !== undefined)
                    lessonStudent.rating = data.rating;
                if (data.useSubscription) {
                    const subscriptionUsed = await this.useSubscriptionLesson(teacherId, data.studentId);
                    if (subscriptionUsed) {
                        lessonStudent.paymentType = "subscription";
                        lessonStudent.paidFromSubscription = true;
                        lessonStudent.paymentStatus = "paid";
                    }
                    else {
                        if (data.paymentStatus !== undefined)
                            lessonStudent.paymentStatus = data.paymentStatus;
                    }
                }
                else {
                    if (data.paymentStatus !== undefined)
                        lessonStudent.paymentStatus = data.paymentStatus;
                }
            }
            await this.lessonStudentRepo.save(lessonStudent);
        }
        lesson.status = "done";
        await this.lessonRepo.save(lesson);
        return this.getLessonWithDetails(lessonId);
    }
    async bulkUpdateLessonStudents(teacherId, lessonId, action, value) {
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        const lessonStudents = await this.lessonStudentRepo.find({
            where: { lessonId },
        });
        for (const ls of lessonStudents) {
            switch (action) {
                case "set_attendance":
                    ls.attendance = value;
                    if (value === "missed") {
                        ls.rating = null;
                        ls.paymentStatus = "unpaid";
                    }
                    break;
                case "set_rating":
                    if (ls.attendance === "attended") {
                        ls.rating = value;
                    }
                    break;
                case "set_payment":
                    if (ls.attendance === "attended") {
                        ls.paymentStatus = value;
                    }
                    break;
            }
            await this.lessonStudentRepo.save(ls);
        }
        return this.getLessonWithDetails(lessonId);
    }
    async getLessonWithDetails(lessonId) {
        const full = await this.lessonRepo.findOne({
            where: { id: lessonId },
            relations: [
                "subject",
                "lessonStudents",
                "lessonStudents.student",
                "lessonStudents.student.user",
            ],
        });
        if (!full)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
        return this.formatLessonWithStudents(full);
    }
    formatLessonWithStudents(lesson) {
        const studentsCount = lesson.lessonStudents?.length || 0;
        return {
            id: lesson.id,
            seriesId: lesson.seriesId,
            teacherId: lesson.teacherId,
            subjectId: lesson.subjectId,
            startAt: lesson.startAt.toISOString(),
            durationMinutes: lesson.durationMinutes,
            priceRub: lesson.priceRub,
            isFree: lesson.isFree,
            status: lesson.status,
            isGroupLesson: studentsCount > 1,
            cancelledBy: lesson.cancelledBy,
            rescheduledTo: lesson.rescheduledTo,
            teacherNote: lesson.teacherNote,
            teacherNoteUpdatedAt: lesson.teacherNoteUpdatedAt?.toISOString() || null,
            lessonReport: lesson.lessonReport,
            studentNotePrivate: lesson.studentNotePrivate,
            studentNoteForTeacher: lesson.studentNoteForTeacher,
            reminderMinutesBefore: lesson.reminderMinutesBefore,
            meetingUrl: lesson.meetingUrl,
            createdAt: lesson.createdAt.toISOString(),
            updatedAt: lesson.updatedAt.toISOString(),
            students: (lesson.lessonStudents || []).map((ls) => ({
                id: ls.id,
                studentId: ls.studentId,
                firstName: ls.student?.user?.firstName,
                lastName: ls.student?.user?.lastName,
                username: ls.student?.user?.username,
                priceRub: ls.priceRub,
                attendance: ls.attendance,
                rating: ls.rating,
                paymentStatus: ls.paymentStatus,
                paymentType: ls.paymentType,
                paidFromSubscription: ls.paidFromSubscription,
            })),
            subject: lesson.subject
                ? {
                    name: lesson.subject.name,
                    colorHex: lesson.subject.colorHex,
                }
                : null,
        };
    }
    formatLesson(lesson) {
        return {
            id: lesson.id,
            seriesId: lesson.seriesId,
            teacherId: lesson.teacherId,
            subjectId: lesson.subjectId,
            startAt: lesson.startAt.toISOString(),
            durationMinutes: lesson.durationMinutes,
            priceRub: lesson.priceRub,
            isFree: lesson.isFree,
            status: lesson.status,
            cancelledBy: lesson.cancelledBy,
            rescheduledTo: lesson.rescheduledTo,
            teacherNote: lesson.teacherNote,
            teacherNoteUpdatedAt: lesson.teacherNoteUpdatedAt?.toISOString() || null,
            lessonReport: lesson.lessonReport,
            studentNotePrivate: lesson.studentNotePrivate,
            studentNoteForTeacher: lesson.studentNoteForTeacher,
            reminderMinutesBefore: lesson.reminderMinutesBefore,
            meetingUrl: lesson.meetingUrl,
            createdAt: lesson.createdAt.toISOString(),
            updatedAt: lesson.updatedAt.toISOString(),
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
    async notifyStudentsAboutNewLesson(teacherId, studentIds, subjectName, startAt, meetingUrl) {
        if (studentIds.length === 0)
            return;
        const teacher = await this.teacherProfileRepo.findOne({
            where: { id: teacherId },
            relations: ["user"],
        });
        const teacherName = teacher?.displayName || teacher?.user?.firstName || "Учитель";
        const timezone = teacher?.user?.timezone || "Europe/Moscow";
        const dateStr = startAt.toLocaleDateString("ru-RU", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: timezone,
        });
        const timeStr = startAt.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: timezone,
        });
        for (const studentId of studentIds) {
            const student = await this.studentProfileRepo.findOne({
                where: { id: studentId },
                relations: ["user"],
            });
            if (!student?.user)
                continue;
            await this.botService.notifyLessonCreated(student.user.id, {
                subject: subjectName || "Занятие",
                date: dateStr,
                time: timeStr,
                teacherName,
                meetingUrl,
            });
        }
    }
    async getStudentSubscription(teacherId, studentId) {
        const subscription = await this.subscriptionRepo.findOne({
            where: { teacherId, studentId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!subscription)
            return null;
        return this.formatSubscription(subscription);
    }
    async createSubscription(teacherId, studentId, data) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        const existing = await this.subscriptionRepo.findOne({
            where: { teacherId, studentId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (existing)
            throw new common_1.ConflictException("SUBSCRIPTION_ALREADY_EXISTS");
        if (data.type === "lessons" && !data.totalLessons) {
            throw new common_1.ConflictException("TOTAL_LESSONS_REQUIRED");
        }
        if (data.type === "date" && !data.expiresAt) {
            throw new common_1.ConflictException("EXPIRES_AT_REQUIRED");
        }
        const subscription = this.subscriptionRepo.create({
            teacherId,
            studentId,
            type: data.type,
            totalLessons: data.type === "lessons" ? data.totalLessons : null,
            expiresAt: data.type === "date" ? new Date(data.expiresAt) : null,
            name: data.name,
            usedLessons: 0,
        });
        await this.subscriptionRepo.save(subscription);
        return this.formatSubscription(subscription);
    }
    async deleteSubscription(teacherId, subscriptionId) {
        const subscription = await this.subscriptionRepo.findOne({
            where: { id: subscriptionId, teacherId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!subscription)
            throw new common_1.NotFoundException("SUBSCRIPTION_NOT_FOUND");
        await this.subscriptionRepo.softDelete(subscriptionId);
        return { success: true };
    }
    async restoreSubscription(teacherId, subscriptionId) {
        const subscription = await this.subscriptionRepo.findOne({
            where: { id: subscriptionId, teacherId },
            withDeleted: true,
        });
        if (!subscription)
            throw new common_1.NotFoundException("SUBSCRIPTION_NOT_FOUND");
        if (!subscription.deletedAt)
            throw new common_1.ConflictException("SUBSCRIPTION_NOT_DELETED");
        const existing = await this.subscriptionRepo.findOne({
            where: { teacherId, studentId: subscription.studentId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (existing)
            throw new common_1.ConflictException("ANOTHER_SUBSCRIPTION_EXISTS");
        await this.subscriptionRepo.restore(subscriptionId);
        const restored = await this.subscriptionRepo.findOne({
            where: { id: subscriptionId },
        });
        return this.formatSubscription(restored);
    }
    async useSubscriptionLesson(teacherId, studentId) {
        const subscription = await this.subscriptionRepo.findOne({
            where: { teacherId, studentId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!subscription)
            return false;
        if (subscription.type === "lessons") {
            if (subscription.totalLessons !== null &&
                subscription.usedLessons >= subscription.totalLessons) {
                return false;
            }
            subscription.usedLessons += 1;
            await this.subscriptionRepo.save(subscription);
            return true;
        }
        if (subscription.type === "date") {
            if (subscription.expiresAt && new Date() > subscription.expiresAt) {
                return false;
            }
            subscription.usedLessons += 1;
            await this.subscriptionRepo.save(subscription);
            return true;
        }
        return false;
    }
    async hasActiveSubscription(teacherId, studentId) {
        const subscription = await this.subscriptionRepo.findOne({
            where: { teacherId, studentId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!subscription) {
            return { hasSubscription: false };
        }
        let isActive = false;
        let displayText = "";
        let remainingLessons = null;
        if (subscription.type === "lessons") {
            remainingLessons = subscription.totalLessons === null
                ? null
                : Math.max(0, subscription.totalLessons - subscription.usedLessons);
            isActive = remainingLessons === null || remainingLessons > 0;
            displayText = remainingLessons !== null
                ? `Осталось ${remainingLessons} урок${this.getLessonEnding(remainingLessons)}`
                : "Безлимитный";
        }
        else if (subscription.type === "date") {
            isActive = !subscription.expiresAt || new Date() <= subscription.expiresAt;
            if (subscription.expiresAt) {
                const daysLeft = Math.ceil((subscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                displayText = isActive ? `Осталось ${daysLeft} дн.` : "Истёк";
            }
            else {
                displayText = "Бессрочный";
            }
        }
        if (!isActive) {
            return { hasSubscription: false };
        }
        return {
            hasSubscription: true,
            subscription: {
                id: subscription.id,
                name: subscription.name,
                type: subscription.type,
                remainingLessons,
                expiresAt: subscription.expiresAt?.toISOString() || null,
                displayText,
            },
        };
    }
    getLessonEnding(count) {
        const lastTwo = count % 100;
        if (lastTwo >= 11 && lastTwo <= 19)
            return "ов";
        const lastOne = count % 10;
        if (lastOne === 1)
            return "";
        if (lastOne >= 2 && lastOne <= 4)
            return "а";
        return "ов";
    }
    async getArchivedSubscriptions(teacherId, studentId) {
        const subscriptions = await this.subscriptionRepo.find({
            where: { teacherId, studentId },
            withDeleted: true,
            order: { deletedAt: "DESC", createdAt: "DESC" },
        });
        return subscriptions
            .filter(sub => {
            if (sub.deletedAt)
                return true;
            if (sub.type === "lessons" && sub.totalLessons !== null) {
                return sub.usedLessons >= sub.totalLessons;
            }
            if (sub.type === "date" && sub.expiresAt) {
                return new Date() > sub.expiresAt;
            }
            return false;
        })
            .map(sub => this.formatSubscriptionArchived(sub));
    }
    formatSubscription(subscription) {
        const remainingLessons = subscription.type === "lessons" && subscription.totalLessons !== null
            ? Math.max(0, subscription.totalLessons - subscription.usedLessons)
            : null;
        const isExpired = subscription.type === "lessons"
            ? remainingLessons === 0
            : subscription.expiresAt ? new Date() > subscription.expiresAt : false;
        return {
            id: subscription.id,
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
    formatSubscriptionArchived(subscription) {
        const remainingLessons = subscription.type === "lessons" && subscription.totalLessons !== null
            ? Math.max(0, subscription.totalLessons - subscription.usedLessons)
            : null;
        const isDeleted = !!subscription.deletedAt;
        const isExpired = subscription.type === "lessons"
            ? remainingLessons === 0
            : subscription.expiresAt ? new Date() > subscription.expiresAt : false;
        return {
            id: subscription.id,
            type: subscription.type,
            totalLessons: subscription.totalLessons,
            usedLessons: subscription.usedLessons,
            remainingLessons,
            expiresAt: subscription.expiresAt?.toISOString() || null,
            name: subscription.name,
            isDeleted,
            isExpired,
            createdAt: subscription.createdAt.toISOString(),
            deletedAt: subscription.deletedAt?.toISOString() || null,
        };
    }
};
exports.TeacherService = TeacherService;
exports.TeacherService = TeacherService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TeacherProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Subject)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TeacherStudentLink)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Lesson)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.LessonSeries)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.LessonStudent)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.LessonSeriesStudent)),
    __param(7, (0, typeorm_1.InjectRepository)(entities_1.Invitation)),
    __param(8, (0, typeorm_1.InjectRepository)(entities_1.ParentStudentRelation)),
    __param(9, (0, typeorm_1.InjectRepository)(entities_1.StudentProfile)),
    __param(10, (0, typeorm_1.InjectRepository)(entities_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        shared_1.StatsService,
        shared_1.DebtService,
        bot_service_1.BotService])
], TeacherService);
//# sourceMappingURL=teacher.service.js.map