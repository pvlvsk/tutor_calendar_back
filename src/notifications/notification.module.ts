import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../database/entities";
import { NotificationService } from "./notification.service";
import { BotModule } from "../bot/bot.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), BotModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
