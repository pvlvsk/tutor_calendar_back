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
exports.ParentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../database/entities");
const shared_1 = require("../shared");
let ParentService = class ParentService {
    constructor(parentProfileRepo, relationRepo, linkRepo, lessonRepo, studentProfileRepo, teacherProfileRepo, subjectRepo, statsService, debtService) {
        this.parentProfileRepo = parentProfileRepo;
        this.relationRepo = relationRepo;
        this.linkRepo = linkRepo;
        this.lessonRepo = lessonRepo;
        this.studentProfileRepo = studentProfileRepo;
        this.teacherProfileRepo = teacherProfileRepo;
        this.subjectRepo = subjectRepo;
        this.statsService = statsService;
        this.debtService = debtService;
    }
    async getProfile(parentId) {
        const profile = await this.parentProfileRepo.findOne({
            where: { id: parentId },
            relations: ['user'],
        });
        if (!profile)
            throw new common_1.NotFoundException('PARENT_NOT_FOUND');
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
    async updateProfile(parentId, customFields) {
        const profile = await this.parentProfileRepo.findOne({ where: { id: parentId } });
        if (!profile)
            throw new common_1.NotFoundException('PARENT_NOT_FOUND');
        profile.customFields = customFields;
        await this.parentProfileRepo.save(profile);
        return this.getProfile(parentId);
    }
    async getChildren(parentId) {
        const relations = await this.relationRepo.find({
            where: { parentId },
            relations: ['student', 'student.user', 'teacher'],
        });
        const childMap = new Map();
        for (const rel of relations) {
            if (!childMap.has(rel.studentId)) {
                const stats = await this.statsService.getDetailedStatsForStudent(rel.studentId);
                childMap.set(rel.studentId, {
                    childId: rel.studentId,
                    childUser: this.formatUserInfo(rel.student.user),
                    teachers: [],
                    stats: stats.total,
                    notificationsEnabled: rel.notificationsEnabled,
                });
            }
            childMap.get(rel.studentId).teachers.push({
                teacherId: rel.teacherId,
                teacherName: rel.teacher.displayName,
            });
        }
        return Array.from(childMap.values());
    }
    async getChildDetails(parentId, childId) {
        const relation = await this.relationRepo.findOne({
            where: { parentId, studentId: childId },
        });
        if (!relation)
            throw new common_1.ForbiddenException('NOT_YOUR_CHILD');
        const student = await this.studentProfileRepo.findOne({
            where: { id: childId },
            relations: ['user'],
        });
        if (!student)
            throw new common_1.NotFoundException('CHILD_NOT_FOUND');
        const teachers = await this.getChildTeachers(parentId, childId);
        const stats = await this.statsService.getDetailedStatsForStudent(childId);
        const debt = await this.debtService.getTotalDebtForStudent(childId);
        return {
            childId,
            childUser: this.formatUserInfo(student.user),
            teachers,
            stats,
            debt,
            notificationsEnabled: relation.notificationsEnabled,
        };
    }
    async getChildTeachers(parentId, childId) {
        const relations = await this.relationRepo.find({
            where: { parentId, studentId: childId },
            relations: ['teacher', 'teacher.user'],
        });
        if (relations.length === 0)
            throw new common_1.ForbiddenException('NOT_YOUR_CHILD');
        const result = [];
        for (const rel of relations) {
            const subjects = await this.subjectRepo.find({
                where: { teacherId: rel.teacherId },
            });
            const statsWithTeacher = await this.statsService.getStatsForStudentWithTeacher(childId, rel.teacherId);
            result.push({
                teacherId: rel.teacherId,
                teacherUser: this.formatUserInfo(rel.teacher.user),
                displayName: rel.teacher.displayName,
                bio: rel.teacher.bio,
                subjects: subjects.map((s) => ({
                    subjectId: s.id,
                    name: s.name,
                    colorHex: s.colorHex,
                })),
                statsWithTeacher,
            });
        }
        return result;
    }
    async getChildTeacherDetails(parentId, childId, teacherId) {
        const relation = await this.relationRepo.findOne({
            where: { parentId, studentId: childId, teacherId },
        });
        if (!relation)
            throw new common_1.ForbiddenException('NOT_YOUR_CHILD');
        const teacher = await this.teacherProfileRepo.findOne({
            where: { id: teacherId },
            relations: ['user'],
        });
        if (!teacher)
            throw new common_1.NotFoundException('TEACHER_NOT_FOUND');
        const subjects = await this.subjectRepo.find({
            where: { teacherId },
        });
        const statsWithTeacher = await this.statsService.getStatsForStudentWithTeacher(childId, teacherId);
        const debt = await this.debtService.getDebtForStudentByTeacher(childId, teacherId);
        return {
            teacherId,
            teacherUser: this.formatUserInfo(teacher.user),
            displayName: teacher.displayName,
            bio: teacher.bio,
            subjects: subjects.map((s) => ({
                subjectId: s.id,
                name: s.name,
                colorHex: s.colorHex,
            })),
            statsWithTeacher,
            debt,
        };
    }
    async getChildLessons(parentId, childId, from, to, filters) {
        const relation = await this.relationRepo.findOne({
            where: { parentId, studentId: childId },
        });
        if (!relation)
            throw new common_1.ForbiddenException('NOT_YOUR_CHILD');
        const whereClause = {
            studentId: childId,
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
            teacherId: l.teacherId,
            subjectId: l.subjectId,
            startAt: l.startAt.toISOString(),
            durationMinutes: l.durationMinutes,
            priceRub: l.priceRub,
            status: l.status,
            attendance: l.attendance,
            paymentStatus: l.paymentStatus,
            teacherNote: l.teacherNote,
            lessonReport: l.lessonReport,
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
    async getChildLessonDetails(parentId, childId, lessonId) {
        const relation = await this.relationRepo.findOne({
            where: { parentId, studentId: childId },
        });
        if (!relation)
            throw new common_1.ForbiddenException('NOT_YOUR_CHILD');
        const lesson = await this.lessonRepo.findOne({
            where: { id: lessonId, studentId: childId },
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
            priceRub: lesson.priceRub,
            status: lesson.status,
            attendance: lesson.attendance,
            paymentStatus: lesson.paymentStatus,
            teacherNote: lesson.teacherNote,
            lessonReport: lesson.lessonReport,
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
    async getChildStatsDetailed(parentId, childId) {
        const relation = await this.relationRepo.findOne({
            where: { parentId, studentId: childId },
        });
        if (!relation)
            throw new common_1.ForbiddenException('NOT_YOUR_CHILD');
        return this.statsService.getDetailedStatsForStudent(childId);
    }
    async getChildDebt(parentId, childId) {
        const relation = await this.relationRepo.findOne({
            where: { parentId, studentId: childId },
        });
        if (!relation)
            throw new common_1.ForbiddenException('NOT_YOUR_CHILD');
        return this.debtService.getDebtByTeachersForStudent(childId);
    }
    async getNotificationSettings(parentId) {
        const relations = await this.relationRepo.find({
            where: { parentId },
            relations: ['student', 'student.user'],
        });
        const childrenMap = new Map();
        for (const r of relations) {
            if (!childrenMap.has(r.studentId)) {
                childrenMap.set(r.studentId, {
                    childId: r.studentId,
                    childName: [r.student.user.firstName, r.student.user.lastName].filter(Boolean).join(' '),
                    notificationsEnabled: r.notificationsEnabled,
                });
            }
        }
        return { children: Array.from(childrenMap.values()) };
    }
    async updateNotificationSettings(parentId, children) {
        for (const child of children) {
            await this.relationRepo.update({ parentId, studentId: child.childId }, { notificationsEnabled: child.notificationsEnabled });
        }
        return this.getNotificationSettings(parentId);
    }
    async updateChildNotifications(parentId, childId, notificationsEnabled) {
        const relation = await this.relationRepo.findOne({
            where: { parentId, studentId: childId },
        });
        if (!relation)
            throw new common_1.ForbiddenException('NOT_YOUR_CHILD');
        relation.notificationsEnabled = notificationsEnabled;
        await this.relationRepo.save(relation);
        return { childId, notificationsEnabled };
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
exports.ParentService = ParentService;
exports.ParentService = ParentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ParentProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ParentStudentRelation)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TeacherStudentLink)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Lesson)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.StudentProfile)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.TeacherProfile)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.Subject)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        shared_1.StatsService,
        shared_1.DebtService])
], ParentService);
//# sourceMappingURL=parent.service.js.map