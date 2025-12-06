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
exports.ParentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const parent_service_1 = require("./parent.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
let ParentController = class ParentController {
    constructor(parentService) {
        this.parentService = parentService;
    }
    getProfile(req) {
        return this.parentService.getProfile(req.user.profileId);
    }
    updateProfile(req, body) {
        return this.parentService.updateProfile(req.user.profileId, body.customFields);
    }
    getChildren(req) {
        return this.parentService.getChildren(req.user.profileId);
    }
    getChildDetails(req, childId) {
        return this.parentService.getChildDetails(req.user.profileId, childId);
    }
    getChildTeachers(req, childId) {
        return this.parentService.getChildTeachers(req.user.profileId, childId);
    }
    getChildTeacherDetails(req, childId, teacherId) {
        return this.parentService.getChildTeacherDetails(req.user.profileId, childId, teacherId);
    }
    getChildLessons(req, childId, from, to, subjectId, teacherId, status) {
        return this.parentService.getChildLessons(req.user.profileId, childId, from, to, { subjectId, teacherId, status });
    }
    getChildLessonDetails(req, childId, lessonId) {
        return this.parentService.getChildLessonDetails(req.user.profileId, childId, lessonId);
    }
    getChildStats(req, childId) {
        return this.parentService.getChildStatsDetailed(req.user.profileId, childId);
    }
    getChildDebt(req, childId) {
        return this.parentService.getChildDebt(req.user.profileId, childId);
    }
    getNotificationSettings(req) {
        return this.parentService.getNotificationSettings(req.user.profileId);
    }
    updateNotificationSettings(req, body) {
        return this.parentService.updateNotificationSettings(req.user.profileId, body.children);
    }
    updateChildNotifications(req, childId, body) {
        return this.parentService.updateChildNotifications(req.user.profileId, childId, body.notificationsEnabled);
    }
};
exports.ParentController = ParentController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить профиль родителя' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить профиль родителя' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('me/children'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить список детей' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getChildren", null);
__decorate([
    (0, common_1.Get)('me/children/:childId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить детали ребенка' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('childId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getChildDetails", null);
__decorate([
    (0, common_1.Get)('me/children/:childId/teachers'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить учителей ребенка' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('childId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getChildTeachers", null);
__decorate([
    (0, common_1.Get)('me/children/:childId/teachers/:teacherId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить информацию об учителе ребенка' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('childId')),
    __param(2, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getChildTeacherDetails", null);
__decorate([
    (0, common_1.Get)('me/children/:childId/lessons'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить уроки ребенка за период' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: true, example: '2025-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: true, example: '2025-12-31' }),
    (0, swagger_1.ApiQuery)({ name: 'subjectId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'teacherId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['planned', 'done', 'cancelled'] }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('childId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('subjectId')),
    __param(5, (0, common_1.Query)('teacherId')),
    __param(6, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getChildLessons", null);
__decorate([
    (0, common_1.Get)('me/children/:childId/lessons/:lessonId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить детали урока ребенка' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('childId')),
    __param(2, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getChildLessonDetails", null);
__decorate([
    (0, common_1.Get)('me/children/:childId/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить статистику ребенка' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('childId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getChildStats", null);
__decorate([
    (0, common_1.Get)('me/children/:childId/debt'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить информацию о долге за ребенка' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('childId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getChildDebt", null);
__decorate([
    (0, common_1.Get)('me/notification-settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить настройки уведомлений' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "getNotificationSettings", null);
__decorate([
    (0, common_1.Patch)('me/notification-settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить настройки уведомлений для всех детей' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "updateNotificationSettings", null);
__decorate([
    (0, common_1.Patch)('me/children/:childId/notifications'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить уведомления для конкретного ребенка' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('childId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ParentController.prototype, "updateChildNotifications", null);
exports.ParentController = ParentController = __decorate([
    (0, swagger_1.ApiTags)('parents'),
    (0, common_1.Controller)('parents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('parent'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [parent_service_1.ParentService])
], ParentController);
//# sourceMappingURL=parent.controller.js.map