/**
 * Модуль для работы с Telegram Bot
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  User,
  UserNotificationSettings,
  Lesson,
  LessonStudent,
} from "../database/entities";
import { BotService } from "./bot.service";
import { BotController } from "./bot.controller";
import { MaxBotService } from "./max-bot.service";
import { MaxBotController } from "./max-bot.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserNotificationSettings,
      Lesson,
      LessonStudent,
    ]),
  ],
  controllers: [BotController, MaxBotController],
  providers: [BotService, MaxBotService],
  exports: [BotService, MaxBotService],
})
export class BotModule {}
