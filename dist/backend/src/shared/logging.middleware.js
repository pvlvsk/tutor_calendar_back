"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const nanoid_1 = require("nanoid");
let LoggingMiddleware = class LoggingMiddleware {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    use(req, res, next) {
        const requestId = (0, nanoid_1.nanoid)(8);
        const startTime = Date.now();
        const { method, originalUrl } = req;
        req.requestId = requestId;
        const userId = req.user?.sub;
        const userInfo = userId ? ` user=${userId}` : '';
        this.logger.log(`→ ${method} ${originalUrl}${userInfo} [${requestId}]`);
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const { statusCode } = res;
            const message = `← ${method} ${originalUrl} ${statusCode} ${duration}ms [${requestId}]`;
            if (statusCode >= 500) {
                this.logger.error(message);
            }
            else if (statusCode >= 400) {
                this.logger.warn(message);
            }
            else {
                this.logger.log(message);
            }
        });
        next();
    }
};
exports.LoggingMiddleware = LoggingMiddleware;
exports.LoggingMiddleware = LoggingMiddleware = __decorate([
    (0, common_1.Injectable)()
], LoggingMiddleware);
//# sourceMappingURL=logging.middleware.js.map