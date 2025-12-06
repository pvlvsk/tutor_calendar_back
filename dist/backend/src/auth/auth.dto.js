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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBetaDto = exports.JoinByReferralDto = exports.AcceptInvitationDto = exports.AddRoleDto = exports.SelectRoleDto = exports.RegisterDto = exports.InitDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class InitDto {
}
exports.InitDto = InitDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Telegram initData или "test" для dev режима',
        example: 'test'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitDto.prototype, "initData", void 0);
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Telegram initData или "test" для dev режима',
        example: 'test'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "initData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Роль пользователя',
        enum: ['teacher', 'student', 'parent'],
        example: 'teacher'
    }),
    (0, class_validator_1.IsIn)(['teacher', 'student', 'parent']),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
class SelectRoleDto {
}
exports.SelectRoleDto = SelectRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Telegram initData',
        example: 'test'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SelectRoleDto.prototype, "initData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Выбранная роль',
        enum: ['teacher', 'student', 'parent'],
        example: 'teacher'
    }),
    (0, class_validator_1.IsIn)(['teacher', 'student', 'parent']),
    __metadata("design:type", String)
], SelectRoleDto.prototype, "role", void 0);
class AddRoleDto {
}
exports.AddRoleDto = AddRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Новая роль для добавления',
        enum: ['teacher', 'student', 'parent'],
        example: 'student'
    }),
    (0, class_validator_1.IsIn)(['teacher', 'student', 'parent']),
    __metadata("design:type", String)
], AddRoleDto.prototype, "role", void 0);
class AcceptInvitationDto {
}
exports.AcceptInvitationDto = AcceptInvitationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Telegram initData (опционально если есть токен)',
        example: 'test'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "initData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Токен приглашения',
        example: 'INV_abc123'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptInvitationDto.prototype, "invitationToken", void 0);
class JoinByReferralDto {
}
exports.JoinByReferralDto = JoinByReferralDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Telegram initData',
        example: 'test'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JoinByReferralDto.prototype, "initData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Код приглашения: T_xxx для учителя, P_xxx для родителя',
        example: 'T_abc123def456'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JoinByReferralDto.prototype, "referralCode", void 0);
class ActivateBetaDto {
}
exports.ActivateBetaDto = ActivateBetaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Код для активации бета-тестера',
        example: 'beta_2025'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivateBetaDto.prototype, "betaCode", void 0);
//# sourceMappingURL=auth.dto.js.map