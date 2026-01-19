"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let TelegramService = class TelegramService {
    constructor() {
        this.botToken = process.env.BOT_TOKEN;
        this.isDev = !this.botToken || process.env.NODE_ENV === 'development';
    }
    validateInitData(initData) {
        if (this.isDev) {
            return this.parseDevInitData(initData);
        }
        return this.parseAndValidate(initData);
    }
    parseDevInitData(initData) {
        try {
            const params = new URLSearchParams(initData);
            const userStr = params.get('user');
            if (userStr) {
                return JSON.parse(userStr);
            }
        }
        catch { }
        return {
            id: 123456789,
            first_name: 'Dev',
            last_name: 'User',
            username: 'devuser',
        };
    }
    parseAndValidate(initData) {
        try {
            const params = new URLSearchParams(initData);
            const hash = params.get('hash');
            if (!hash)
                return null;
            params.delete('hash');
            const sortedParams = Array.from(params.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = crypto
                .createHmac('sha256', 'WebAppData')
                .update(this.botToken)
                .digest();
            const calculatedHash = crypto
                .createHmac('sha256', secretKey)
                .update(sortedParams)
                .digest('hex');
            if (calculatedHash !== hash)
                return null;
            const userStr = params.get('user');
            if (!userStr)
                return null;
            return JSON.parse(userStr);
        }
        catch {
            return null;
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = __decorate([
    (0, common_1.Injectable)()
], TelegramService);
//# sourceMappingURL=telegram.service.js.map