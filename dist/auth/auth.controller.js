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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const auth_dto_1 = require("./auth.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    init(dto) {
        return this.authService.init(dto.initData);
    }
    register(dto) {
        return this.authService.register(dto.initData, dto.role);
    }
    selectRole(dto) {
        return this.authService.selectRole(dto.initData, dto.role);
    }
    addRole(req, dto) {
        return this.authService.addRole(req.user.sub, dto.role);
    }
    acceptInvitation(req, dto) {
        const userId = req.user?.sub;
        return this.authService.acceptInvitation(dto.initData || null, dto.invitationToken, userId);
    }
    joinByReferral(dto) {
        return this.authService.joinByReferral(dto.initData, dto.referralCode);
    }
    getMe(req) {
        return this.authService.getMe(req.user.sub, req.user.role);
    }
    refresh(req) {
        return this.authService.refresh(req.user.sub, req.user.role);
    }
    logout() {
        return { message: 'Вы успешно вышли из системы' };
    }
    activateBeta(req, dto) {
        return this.authService.activateBetaTester(req.user.sub, dto.betaCode);
    }
    getBetaStatus(req) {
        return {
            isBetaTester: req.user.isBetaTester || false,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('init'),
    (0, swagger_1.ApiOperation)({ summary: 'Инициализация - проверка пользователя' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.InitDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "init", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Регистрация нового пользователя' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('select-role'),
    (0, swagger_1.ApiOperation)({ summary: 'Выбор роли (для пользователей с несколькими ролями)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SelectRoleDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "selectRole", null);
__decorate([
    (0, common_1.Post)('add-role'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Добавить новую роль к существующему аккаунту' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.AddRoleDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "addRole", null);
__decorate([
    (0, common_1.Post)('accept-invitation'),
    (0, swagger_1.ApiOperation)({ summary: 'Принять разовое приглашение (устаревший метод)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.AcceptInvitationDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Post)('join'),
    (0, swagger_1.ApiOperation)({ summary: 'Присоединиться по постоянной ссылке учителя или ученика' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.JoinByReferralDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "joinByReferral", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить информацию о текущем пользователе' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить JWT токен' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Выход из системы' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('activate-beta'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Активировать статус бета-тестера по коду' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.ActivateBetaDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "activateBeta", null);
__decorate([
    (0, common_1.Get)('beta-status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Проверить статус бета-тестера' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getBetaStatus", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map