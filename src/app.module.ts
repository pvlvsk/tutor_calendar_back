/**
 * Главный модуль приложения
 * Подключает все модули и настраивает TypeORM
 */

import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { TeacherModule } from "./teacher/teacher.module";
import { StudentModule } from "./student/student.module";
import { ParentModule } from "./parent/parent.module";
import { SharedModule } from "./shared/shared.module";
import { HealthModule } from "./health/health.module";
import { BotModule } from "./bot/bot.module";
import { AdminModule, RequestLoggerMiddleware } from "./admin";
import { SupportModule } from "./support/support.module";
import { GoogleCalendarModule } from "./google-calendar";
import { EmailModule } from "./email";
import { NotificationModule } from "./notifications";
import { LoggingMiddleware } from "./shared/logging.middleware";
import * as entities from "./database/entities";

@Module({
  imports: [
    // Подключение к PostgreSQL через TypeORM
    TypeOrmModule.forRoot({
      type: "postgres",
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/teach_mini_app",
      entities: Object.values(entities),
      synchronize: true,
      logging: process.env.NODE_ENV !== "production",
    }),
    // Планировщик задач (для напоминаний)
    ScheduleModule.forRoot(),
    // Общий модуль с переиспользуемыми сервисами
    SharedModule,
    // Модуль авторизации (JWT, Telegram)
    AuthModule,
    // Модуль учителя
    TeacherModule,
    // Модуль ученика
    StudentModule,
    // Модуль родителя
    ParentModule,
    // Health check
    HealthModule,
    // Модуль Telegram бота
    BotModule,
    // Модуль админ-панели
    AdminModule,
    // Модуль поддержки
    SupportModule,
    // Google Calendar интеграция
    GoogleCalendarModule,
    // Email сервис (SMTP)
    EmailModule,
    // Мультиканальные уведомления (Telegram + MAX + Email)
    NotificationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Логирование для консоли (dev)
    consumer.apply(LoggingMiddleware).forRoutes("*");
    // Логирование запросов в БД для админ-панели
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}
