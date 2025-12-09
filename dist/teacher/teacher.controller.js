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
exports.TeacherController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const teacher_service_1 = require("./teacher.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
let TeacherController = class TeacherController {
    constructor(teacherService) {
        this.teacherService = teacherService;
    }
    getProfile(req) {
        return this.teacherService.getProfile(req.user.profileId);
    }
    getInviteLink(req) {
        return this.teacherService.getInviteLink(req.user.profileId);
    }
    updateProfile(req, body) {
        return this.teacherService.updateProfile(req.user.profileId, body);
    }
    getSubjects(req) {
        return this.teacherService.getSubjects(req.user.profileId);
    }
    createSubject(req, body) {
        return this.teacherService.createSubject(req.user.profileId, body);
    }
    updateSubject(req, subjectId, body) {
        return this.teacherService.updateSubject(req.user.profileId, subjectId, body);
    }
    deleteSubject(req, subjectId) {
        return this.teacherService.deleteSubject(req.user.profileId, subjectId);
    }
    getStudents(req) {
        return this.teacherService.getStudents(req.user.profileId);
    }
    createStudentInvitation(req) {
        return this.teacherService.createStudentInvitation(req.user.profileId);
    }
    getStudentDetails(req, studentId) {
        return this.teacherService.getStudentDetails(req.user.profileId, studentId);
    }
    updateStudent(req, studentId, body) {
        return this.teacherService.updateStudentCustomFields(req.user.profileId, studentId, body.customFields);
    }
    deleteStudent(req, studentId) {
        return this.teacherService.deleteStudent(req.user.profileId, studentId);
    }
    createParentInvitation(req, studentId) {
        return this.teacherService.createParentInvitation(req.user.profileId, studentId);
    }
    getStudentParents(req, studentId) {
        return this.teacherService.getStudentParents(req.user.profileId, studentId);
    }
    updateParentNotifications(req, studentId, parentId, body) {
        return this.teacherService.updateParentNotifications(req.user.profileId, studentId, parentId, body.notificationsEnabled);
    }
    getLessons(req, from, to, subjectId, studentId, status) {
        return this.teacherService.getLessons(req.user.profileId, from, to, {
            subjectId,
            studentId,
            status,
        });
    }
    createLesson(req, body) {
        return this.teacherService.createLesson(req.user.profileId, body);
    }
    getLessonDetails(req, lessonId) {
        return this.teacherService.getLessonDetails(req.user.profileId, lessonId);
    }
    updateLesson(req, lessonId, body, applyToSeries) {
        return this.teacherService.updateLesson(req.user.profileId, lessonId, body, applyToSeries);
    }
    deleteLesson(req, lessonId, applyToSeries) {
        return this.teacherService.deleteLesson(req.user.profileId, lessonId, applyToSeries);
    }
    addStudentToLesson(req, lessonId, body) {
        return this.teacherService.addStudentToLesson(req.user.profileId, lessonId, body.studentId, body.priceRub);
    }
    removeStudentFromLesson(req, lessonId, studentId) {
        return this.teacherService.removeStudentFromLesson(req.user.profileId, lessonId, studentId);
    }
    completeLesson(req, lessonId, body) {
        return this.teacherService.completeLesson(req.user.profileId, lessonId, body.students);
    }
    bulkUpdateLessonStudents(req, lessonId, body) {
        return this.teacherService.bulkUpdateLessonStudents(req.user.profileId, lessonId, body.action, body.value);
    }
    getLessonSeries(req) {
        return this.teacherService.getLessonSeries(req.user.profileId);
    }
    getStudentLessons(req, studentId, filters) {
        return this.teacherService.getStudentLessons(req.user.profileId, studentId, filters);
    }
    getStudentDebt(req, studentId) {
        return this.teacherService.getStudentDebtDetails(req.user.profileId, studentId);
    }
    getStudentStats(req, studentId) {
        return this.teacherService.getStudentCardStats(req.user.profileId, studentId);
    }
    getStudentDetailedStats(req, studentId) {
        return this.teacherService.getStudentDetailedStats(req.user.profileId, studentId);
    }
};
exports.TeacherController = TeacherController;
__decorate([
    (0, common_1.Get)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Получить профиль учителя" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)("me/invite-link"),
    (0, swagger_1.ApiOperation)({
        summary: "Получить постоянную ссылку для приглашения учеников",
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getInviteLink", null);
__decorate([
    (0, common_1.Patch)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Обновить профиль учителя" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)("me/subjects"),
    (0, swagger_1.ApiOperation)({ summary: "Получить список предметов" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getSubjects", null);
__decorate([
    (0, common_1.Post)("me/subjects"),
    (0, swagger_1.ApiOperation)({ summary: "Создать новый предмет" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "createSubject", null);
__decorate([
    (0, common_1.Patch)("me/subjects/:subjectId"),
    (0, swagger_1.ApiOperation)({ summary: "Обновить предмет" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("subjectId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "updateSubject", null);
__decorate([
    (0, common_1.Delete)("me/subjects/:subjectId"),
    (0, swagger_1.ApiOperation)({ summary: "Удалить предмет" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("subjectId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "deleteSubject", null);
__decorate([
    (0, common_1.Get)("me/students"),
    (0, swagger_1.ApiOperation)({ summary: "Получить список учеников" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Post)("me/students/invitations"),
    (0, swagger_1.ApiOperation)({
        summary: "Создать приглашение для ученика (ссылка для регистрации)",
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "createStudentInvitation", null);
__decorate([
    (0, common_1.Get)("me/students/:studentId"),
    (0, swagger_1.ApiOperation)({ summary: "Получить детали ученика" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getStudentDetails", null);
__decorate([
    (0, common_1.Patch)("me/students/:studentId"),
    (0, swagger_1.ApiOperation)({ summary: "Обновить данные ученика" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Delete)("me/students/:studentId"),
    (0, swagger_1.ApiOperation)({ summary: "Удалить связь с учеником" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "deleteStudent", null);
__decorate([
    (0, common_1.Post)("me/students/:studentId/parents/invitations"),
    (0, swagger_1.ApiOperation)({ summary: "Создать приглашение для родителя ученика" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "createParentInvitation", null);
__decorate([
    (0, common_1.Get)("me/students/:studentId/parents"),
    (0, swagger_1.ApiOperation)({ summary: "Получить родителей ученика" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getStudentParents", null);
__decorate([
    (0, common_1.Patch)("me/students/:studentId/parents/:parentId"),
    (0, swagger_1.ApiOperation)({ summary: "Обновить настройки уведомлений родителя" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __param(2, (0, common_1.Param)("parentId")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "updateParentNotifications", null);
__decorate([
    (0, common_1.Get)("me/lessons"),
    (0, swagger_1.ApiOperation)({ summary: "Получить уроки за период" }),
    (0, swagger_1.ApiQuery)({
        name: "from",
        required: true,
        description: "Начало периода (ISO date)",
        example: "2025-01-01",
    }),
    (0, swagger_1.ApiQuery)({
        name: "to",
        required: true,
        description: "Конец периода (ISO date)",
        example: "2025-12-31",
    }),
    (0, swagger_1.ApiQuery)({ name: "subjectId", required: false }),
    (0, swagger_1.ApiQuery)({ name: "studentId", required: false }),
    (0, swagger_1.ApiQuery)({
        name: "status",
        required: false,
        enum: ["planned", "done", "cancelled"],
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __param(3, (0, common_1.Query)("subjectId")),
    __param(4, (0, common_1.Query)("studentId")),
    __param(5, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getLessons", null);
__decorate([
    (0, common_1.Post)("me/lessons"),
    (0, swagger_1.ApiOperation)({ summary: "Создать урок" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "createLesson", null);
__decorate([
    (0, common_1.Get)("me/lessons/:lessonId"),
    (0, swagger_1.ApiOperation)({ summary: "Получить детали урока" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("lessonId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getLessonDetails", null);
__decorate([
    (0, common_1.Patch)("me/lessons/:lessonId"),
    (0, swagger_1.ApiOperation)({ summary: "Обновить урок" }),
    (0, swagger_1.ApiQuery)({
        name: "applyToSeries",
        required: false,
        enum: ["this", "future", "all"],
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("lessonId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Query)("applyToSeries")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "updateLesson", null);
__decorate([
    (0, common_1.Delete)("me/lessons/:lessonId"),
    (0, swagger_1.ApiOperation)({ summary: "Удалить урок" }),
    (0, swagger_1.ApiQuery)({
        name: "applyToSeries",
        required: false,
        enum: ["this", "future", "all"],
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("lessonId")),
    __param(2, (0, common_1.Query)("applyToSeries")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "deleteLesson", null);
__decorate([
    (0, common_1.Post)("me/lessons/:lessonId/students"),
    (0, swagger_1.ApiOperation)({ summary: "Добавить ученика на урок" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("lessonId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "addStudentToLesson", null);
__decorate([
    (0, common_1.Delete)("me/lessons/:lessonId/students/:studentId"),
    (0, swagger_1.ApiOperation)({ summary: "Удалить ученика с урока" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("lessonId")),
    __param(2, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "removeStudentFromLesson", null);
__decorate([
    (0, common_1.Patch)("me/lessons/:lessonId/complete"),
    (0, swagger_1.ApiOperation)({ summary: "Отметить урок как проведённый" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("lessonId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "completeLesson", null);
__decorate([
    (0, common_1.Patch)("me/lessons/:lessonId/students/bulk"),
    (0, swagger_1.ApiOperation)({ summary: "Массовое обновление учеников на уроке" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("lessonId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "bulkUpdateLessonStudents", null);
__decorate([
    (0, common_1.Get)("me/lesson-series"),
    (0, swagger_1.ApiOperation)({ summary: "Получить серии повторяющихся уроков" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getLessonSeries", null);
__decorate([
    (0, common_1.Get)("me/students/:studentId/lessons"),
    (0, swagger_1.ApiOperation)({ summary: "Получить уроки конкретного ученика" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getStudentLessons", null);
__decorate([
    (0, common_1.Get)("me/students/:studentId/debt"),
    (0, swagger_1.ApiOperation)({ summary: "Получить информацию о долге ученика" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getStudentDebt", null);
__decorate([
    (0, common_1.Get)("me/students/:studentId/stats"),
    (0, swagger_1.ApiOperation)({
        summary: "Получить краткую статистику ученика (для карточки)",
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getStudentStats", null);
__decorate([
    (0, common_1.Get)("me/students/:studentId/stats/detailed"),
    (0, swagger_1.ApiOperation)({ summary: "Получить детальную статистику ученика" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getStudentDetailedStats", null);
exports.TeacherController = TeacherController = __decorate([
    (0, swagger_1.ApiTags)("teachers"),
    (0, common_1.Controller)("teachers"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)("teacher"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [teacher_service_1.TeacherService])
], TeacherController);
//# sourceMappingURL=teacher.controller.js.map