/**
 * Фоновые задачи для модуля учителя
 * Включает автоудаление архивных учеников
 */

import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TeacherService } from "./teacher.service";

@Injectable()
export class TeacherTasks {
  private readonly logger = new Logger(TeacherTasks.name);

  constructor(private teacherService: TeacherService) {}

  /**
   * Удаляет архивных учеников старше 7 дней
   * Запускается каждую ночь в 3:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredArchives() {
    this.logger.log("Starting cleanup of expired archived students...");
    
    try {
      const result = await this.teacherService.cleanupExpiredArchives();
      this.logger.log(`Cleanup completed: ${result.deleted} records deleted`);
    } catch (error) {
      this.logger.error("Failed to cleanup expired archives", error);
    }
  }
}
