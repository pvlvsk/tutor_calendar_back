"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("../database/entities");
const stats_service_1 = require("./stats.service");
const debt_service_1 = require("./debt.service");
const achievements_service_1 = require("./achievements.service");
const logger_service_1 = require("./logger.service");
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([entities_1.Lesson])],
        providers: [stats_service_1.StatsService, debt_service_1.DebtService, achievements_service_1.AchievementsService, logger_service_1.LoggerService],
        exports: [stats_service_1.StatsService, debt_service_1.DebtService, achievements_service_1.AchievementsService, logger_service_1.LoggerService],
    })
], SharedModule);
//# sourceMappingURL=shared.module.js.map