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
exports.StudentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const student_service_1 = require("./student.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
let StudentController = class StudentController {
    constructor(studentService) {
        this.studentService = studentService;
    }
    getProfile(req) {
        return this.studentService.getProfile(req.user.profileId);
    }
    getParentInviteLink(req) {
        return this.studentService.getParentInviteLink(req.user.profileId);
    }
    updateProfile(req, body) {
        return this.studentService.updateProfile(req.user.profileId, body.customFields);
    }
    getTeachers(req) {
        return this.studentService.getTeachers(req.user.profileId);
    }
    getTeacherDetails(req, teacherId) {
        return this.studentService.getTeacherDetails(req.user.profileId, teacherId);
    }
    getLessons(req, from, to, subjectId, teacherId, status) {
        return this.studentService.getLessons(req.user.profileId, from, to, { subjectId, teacherId, status });
    }
    getLessonDetails(req, lessonId) {
        return this.studentService.getLessonDetails(req.user.profileId, lessonId);
    }
    updateLessonNotes(req, lessonId, body) {
        return this.studentService.updateLessonNotes(req.user.profileId, lessonId, body);
    }
    cancelLesson(req, lessonId) {
        return this.studentService.cancelLesson(req.user.profileId, lessonId);
    }
    getStats(req) {
        return this.studentService.getStats(req.user.profileId);
    }
    getStatsWithTeacher(req, teacherId) {
        return this.studentService.getStatsWithTeacher(req.user.profileId, teacherId);
    }
    getNotificationSettings(req) {
        return this.studentService.getNotificationSettings(req.user.profileId);
    }
    updateNotificationSettings(req, body) {
        return this.studentService.updateNotificationSettings(req.user.profileId, body);
    }
    getSubscriptions(req) {
        return this.studentService.getSubscriptions(req.user.profileId);
    }
    getSubscriptionByTeacher(req, teacherId) {
        return this.studentService.getSubscriptionByTeacher(req.user.profileId, teacherId);
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить профиль ученика' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('me/parent-invite-link'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить ссылку для приглашения родителей' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getParentInviteLink", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить профиль ученика' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('me/teachers'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить список учителей' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getTeachers", null);
__decorate([
    (0, common_1.Get)('me/teachers/:teacherId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить информацию об учителе' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getTeacherDetails", null);
__decorate([
    (0, common_1.Get)('me/lessons'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить уроки за период' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: true, example: '2025-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: true, example: '2025-12-31' }),
    (0, swagger_1.ApiQuery)({ name: 'subjectId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'teacherId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['planned', 'done', 'cancelled'] }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('subjectId')),
    __param(4, (0, common_1.Query)('teacherId')),
    __param(5, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getLessons", null);
__decorate([
    (0, common_1.Get)('me/lessons/:lessonId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить детали урока' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getLessonDetails", null);
__decorate([
    (0, common_1.Patch)('me/lessons/:lessonId'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить заметки к уроку' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('lessonId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "updateLessonNotes", null);
__decorate([
    (0, common_1.Post)('me/lessons/:lessonId/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Отменить урок (учеником)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "cancelLesson", null);
__decorate([
    (0, common_1.Get)('me/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить статистику ученика' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('me/stats/teacher/:teacherId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить статистику с конкретным учителем' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getStatsWithTeacher", null);
__decorate([
    (0, common_1.Get)('me/notification-settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить настройки уведомлений' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getNotificationSettings", null);
__decorate([
    (0, common_1.Patch)('me/notification-settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить настройки уведомлений' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "updateNotificationSettings", null);
__decorate([
    (0, common_1.Get)('me/subscriptions'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все абонементы ученика' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getSubscriptions", null);
__decorate([
    (0, common_1.Get)('me/subscriptions/teacher/:teacherId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить абонемент от конкретного учителя' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getSubscriptionByTeacher", null);
exports.StudentController = StudentController = __decorate([
    (0, swagger_1.ApiTags)('students'),
    (0, common_1.Controller)('students'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('student'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [student_service_1.StudentService])
], StudentController);
//# sourceMappingURL=student.controller.js.map