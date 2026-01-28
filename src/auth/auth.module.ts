import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TelegramService } from './telegram.service';
import { BotModule } from '../bot/bot.module';
import {
  User,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
  Invitation,
  TeacherStudentLink,
  ParentStudentRelation,
  Lesson,
  LessonSeries,
  Subject,
  Subscription,
  UserNotificationSettings,
  AnalyticsEvent,
  LessonStudent,
  LessonSeriesStudent,
} from '../database/entities';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    TypeOrmModule.forFeature([
      User,
      TeacherProfile,
      StudentProfile,
      ParentProfile,
      Invitation,
      TeacherStudentLink,
      ParentStudentRelation,
      Lesson,
      LessonSeries,
      Subject,
      Subscription,
      UserNotificationSettings,
      AnalyticsEvent,
      LessonStudent,
      LessonSeriesStudent,
    ]),
    BotModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TelegramService],
  exports: [AuthService],
})
export class AuthModule {}

