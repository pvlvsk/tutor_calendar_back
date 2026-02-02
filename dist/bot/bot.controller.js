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
exports.BotController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const bot_service_1 = require("./bot.service");
let BotController = class BotController {
    constructor(botService) {
        this.botService = botService;
    }
    async getNotificationSettings(req) {
        return this.botService.getNotificationSettings(req.user.sub);
    }
    async setInitialPermission(req, dto) {
        await this.botService.setInitialNotificationPermission(req.user.sub, dto.granted);
        return { success: true };
    }
    async toggleNotifications(req, dto) {
        await this.botService.toggleNotifications(req.user.sub, dto.enabled);
        return { success: true };
    }
    async updatePreference(req, dto) {
        await this.botService.updateNotificationPreference(req.user.sub, dto.eventType, dto.enabled);
        return { success: true };
    }
    async testSendMessage(adminSecret, dto) {
        const validSecrets = [
            process.env.BOT_TOKEN,
            process.env.BETA_CODE,
            process.env.JWT_SECRET,
        ].filter(Boolean);
        if (!adminSecret || !validSecrets.includes(adminSecret)) {
            throw new common_1.UnauthorizedException("Invalid admin secret");
        }
        const success = await this.botService.testSendMessage(dto.telegramId, dto.text, dto.buttonText);
        return {
            success,
            telegramId: dto.telegramId,
            message: success ? "Message sent" : "Failed to send message",
        };
    }
    async handleWebhook(update) {
        this.botService
            .handleWebhook(update)
            .catch((err) => console.error("Webhook error:", err));
        return { ok: true };
    }
    async setWebhook(adminSecret, dto) {
        if (!adminSecret || adminSecret !== process.env.BOT_TOKEN) {
            throw new common_1.UnauthorizedException("Invalid admin secret");
        }
        const success = await this.botService.setWebhook(dto.url);
        return {
            success,
            url: dto.url,
            message: success ? "Webhook set successfully" : "Failed to set webhook",
        };
    }
    async getWebhookInfo(adminSecret) {
        if (!adminSecret || adminSecret !== process.env.BOT_TOKEN) {
            throw new common_1.UnauthorizedException("Invalid admin secret");
        }
        const info = await this.botService.getWebhookInfo();
        return { info };
    }
    async deleteWebhook(adminSecret) {
        if (!adminSecret || adminSecret !== process.env.BOT_TOKEN) {
            throw new common_1.UnauthorizedException("Invalid admin secret");
        }
        const success = await this.botService.deleteWebhook();
        return { success };
    }
};
exports.BotController = BotController;
__decorate([
    (0, common_1.Get)("notifications"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "getNotificationSettings", null);
__decorate([
    (0, common_1.Post)("notifications/initial"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "setInitialPermission", null);
__decorate([
    (0, common_1.Post)("notifications/toggle"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "toggleNotifications", null);
__decorate([
    (0, common_1.Post)("notifications/preference"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "updatePreference", null);
__decorate([
    (0, common_1.Post)("test-send"),
    __param(0, (0, common_1.Headers)("x-admin-secret")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "testSendMessage", null);
__decorate([
    (0, common_1.Post)("webhook"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)("set-webhook"),
    __param(0, (0, common_1.Headers)("x-admin-secret")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "setWebhook", null);
__decorate([
    (0, common_1.Get)("webhook-info"),
    __param(0, (0, common_1.Headers)("x-admin-secret")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "getWebhookInfo", null);
__decorate([
    (0, common_1.Post)("delete-webhook"),
    __param(0, (0, common_1.Headers)("x-admin-secret")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "deleteWebhook", null);
exports.BotController = BotController = __decorate([
    (0, common_1.Controller)("bot"),
    __metadata("design:paramtypes", [bot_service_1.BotService])
], BotController);
//# sourceMappingURL=bot.controller.js.map