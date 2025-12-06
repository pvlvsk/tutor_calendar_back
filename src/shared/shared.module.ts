/**
 * Общий модуль с переиспользуемыми сервисами
 */

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from '../database/entities';
import { StatsService } from './stats.service';
import { DebtService } from './debt.service';
import { AchievementsService } from './achievements.service';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Lesson])],
  providers: [StatsService, DebtService, AchievementsService, LoggerService],
  exports: [StatsService, DebtService, AchievementsService, LoggerService],
})
export class SharedModule {}

