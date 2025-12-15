"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const teacher_module_1 = require("./teacher/teacher.module");
const student_module_1 = require("./student/student.module");
const parent_module_1 = require("./parent/parent.module");
const shared_module_1 = require("./shared/shared.module");
const health_module_1 = require("./health/health.module");
const bot_module_1 = require("./bot/bot.module");
const logging_middleware_1 = require("./shared/logging.middleware");
const entities = require("./database/entities");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(logging_middleware_1.LoggingMiddleware).forRoutes("*");
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: "postgres",
                url: process.env.DATABASE_URL ||
                    "postgresql://postgres:postgres@localhost:5432/teach_mini_app",
                entities: Object.values(entities),
                synchronize: true,
                logging: process.env.NODE_ENV !== "production",
            }),
            schedule_1.ScheduleModule.forRoot(),
            shared_module_1.SharedModule,
            auth_module_1.AuthModule,
            teacher_module_1.TeacherModule,
            student_module_1.StudentModule,
            parent_module_1.ParentModule,
            health_module_1.HealthModule,
            bot_module_1.BotModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map