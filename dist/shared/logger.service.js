"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
let LoggerService = class LoggerService extends common_1.Logger {
    setRequestId(requestId) {
        this.requestId = requestId;
    }
    formatMessage(message) {
        const prefix = this.requestId ? `[${this.requestId}] ` : '';
        return `${prefix}${message}`;
    }
    log(message, context) {
        super.log(this.formatMessage(message), context);
    }
    error(message, trace, context) {
        super.error(this.formatMessage(message), trace, context);
    }
    warn(message, context) {
        super.warn(this.formatMessage(message), context);
    }
    debug(message, context) {
        super.debug(this.formatMessage(message), context);
    }
    verbose(message, context) {
        super.verbose(this.formatMessage(message), context);
    }
    logRequest(method, url, userId) {
        const userInfo = userId ? ` user=${userId}` : '';
        this.log(`→ ${method} ${url}${userInfo}`, 'HTTP');
    }
    logResponse(method, url, statusCode, duration) {
        const level = statusCode >= 400 ? 'warn' : 'log';
        const message = `← ${method} ${url} ${statusCode} ${duration}ms`;
        if (level === 'warn') {
            this.warn(message, 'HTTP');
        }
        else {
            this.log(message, 'HTTP');
        }
    }
    logAuth(action, telegramId, role) {
        const info = [
            telegramId ? `tg=${telegramId}` : '',
            role ? `role=${role}` : '',
        ].filter(Boolean).join(' ');
        this.log(`${action} ${info}`, 'Auth');
    }
    logError(error, context) {
        this.error(`${error.name}: ${error.message}`, error.stack, context);
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT })
], LoggerService);
//# sourceMappingURL=logger.service.js.map