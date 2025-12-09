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
let TeacherService = class TeacherService {
    constructor(teacherProfileRepo, subjectRepo, linkRepo, lessonRepo, seriesRepo, lessonStudentRepo, seriesStudentRepo, invitationRepo, parentRelationRepo, studentProfileRepo, statsService, debtService) {
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
        this.statsService = statsService;
        this.debtService = debtService;
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
            where: { teacherId },
            order: { createdAt: "ASC" },
        });
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
        if (lessonsCount > 0)
            throw new common_1.ConflictException("SUBJECT_HAS_LESSONS");
        await this.subjectRepo.delete({ id: subjectId });
        return { success: true };
    }
    async getStudents(teacherId) {
        const links = await this.linkRepo.find({
            where: { teacherId },
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
        return {
            studentId,
            studentUser: this.formatUserInfo(link.student.user),
            customFields: link.customFields || link.student.customFields,
            stats,
            debt,
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
    async deleteStudent(teacherId, studentId) {
        const link = await this.linkRepo.findOne({
            where: { teacherId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        await this.linkRepo.delete({ teacherId, studentId });
        return { success: true };
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
            inviteUrl: `https://t.me/your_bot?start=${token}`,
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
            inviteUrl: `https://t.me/your_bot?start=${token}`,
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
        const subject = await this.subjectRepo.findOne({
            where: { id: data.subjectId, teacherId },
        });
        if (!subject)
            throw new common_1.NotFoundException("SUBJECT_NOT_FOUND");
        if (data.recurrence && data.recurrence.frequency !== "none") {
            return this.createRecurringLessons(teacherId, data);
        }
        const isFree = data.isFree || false;
        const priceRub = data.priceRub || 0;
        const lesson = this.lessonRepo.create({
            teacherId,
            subjectId: data.subjectId,
            startAt: new Date(data.startAt),
            durationMinutes: data.durationMinutes,
            priceRub,
            isFree,
            teacherNote: data.teacherNote,
            reminderMinutesBefore: data.reminderMinutesBefore,
        });
        const saved = await this.lessonRepo.save(lesson);
        for (const studentId of studentIds) {
            const lessonStudent = this.lessonStudentRepo.create({
                lessonId: saved.id,
                studentId,
                priceRub: isFree ? 0 : priceRub,
            });
            await this.lessonStudentRepo.save(lessonStudent);
        }
        return this.getLessonWithDetails(saved.id);
    }
    async createRecurringLessons(teacherId, data) {
        const startDate = new Date(data.startAt);
        const timeOfDay = startDate.toTimeString().slice(0, 5);
        const dayOfWeek = startDate.getDay();
        const studentIds = data.studentIds || (data.studentId ? [data.studentId] : []);
        const isFree = data.isFree || false;
        const priceRub = data.priceRub || 0;
        const series = new entities_1.LessonSeries();
        series.teacherId = teacherId;
        series.subjectId = data.subjectId;
        series.frequency = data.recurrence.frequency;
        series.dayOfWeek = dayOfWeek;
        series.timeOfDay = timeOfDay;
        series.durationMinutes = data.durationMinutes;
        series.priceRub = priceRub;
        series.isFree = isFree;
        series.maxOccurrences = data.recurrence.count || 10;
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
                subjectId: data.subjectId,
                startAt: new Date(currentDate),
                durationMinutes: data.durationMinutes,
                priceRub,
                isFree,
                teacherNote: data.teacherNote,
                reminderMinutesBefore: data.reminderMinutesBefore,
            });
            await this.lessonRepo.save(lesson);
            for (const studentId of studentIds) {
                const lessonStudent = this.lessonStudentRepo.create({
                    lessonId: lesson.id,
                    studentId,
                    priceRub: isFree ? 0 : priceRub,
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
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, teacherId },
            relations: ["series"],
        });
        if (!lesson)
            throw new common_1.NotFoundException("LESSON_NOT_FOUND");
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
        if (data.studentId !== undefined)
            seriesUpdateData.studentId = data.studentId;
        if (data.subjectId !== undefined)
            seriesUpdateData.subjectId = data.subjectId;
        if (data.durationMinutes !== undefined)
            seriesUpdateData.durationMinutes = data.durationMinutes;
        if (data.priceRub !== undefined)
            seriesUpdateData.priceRub = data.priceRub;
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
            const whereClause = { seriesId: lesson.seriesId, teacherId };
            if (applyToSeries === "future") {
                whereClause.startAt = (0, typeorm_2.MoreThanOrEqual)(lesson.startAt);
            }
            if (Object.keys(seriesUpdateData).length > 0) {
                await this.lessonRepo.update(whereClause, seriesUpdateData);
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
            if (data.studentId !== undefined)
                seriesUpdate.studentId = data.studentId;
            if (data.subjectId !== undefined)
                seriesUpdate.subjectId = data.subjectId;
            if (Object.keys(seriesUpdate).length > 0) {
                await this.seriesRepo.update({ id: lesson.seriesId }, seriesUpdate);
            }
        }
        else {
            await this.lessonRepo.update({ id: lessonId }, singleLessonData);
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
                subject: {
                    name: s.subject.name,
                    colorHex: s.subject.colorHex,
                },
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
            subject: {
                name: l.subject.name,
                colorHex: l.subject.colorHex,
            },
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
            }
            else {
                if (data.rating !== undefined)
                    lessonStudent.rating = data.rating;
                if (data.paymentStatus !== undefined)
                    lessonStudent.paymentStatus = data.paymentStatus;
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
        shared_1.StatsService,
        shared_1.DebtService])
], TeacherService);
//# sourceMappingURL=teacher.service.js.map