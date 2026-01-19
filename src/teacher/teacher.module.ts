import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TeacherController } from "./teacher.controller";
import { TeacherService } from "./teacher.service";
import { BotModule } from "../bot/bot.module";
import {
  TeacherProfile,
  StudentProfile,
  Subject,
  TeacherStudentLink,
  Lesson,
  LessonSeries,
  LessonStudent,
  LessonSeriesStudent,
  Invitation,
  ParentStudentRelation,
  Subscription,
} from "../database/entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherProfile,
      StudentProfile,
      Subject,
      TeacherStudentLink,
      Lesson,
      LessonSeries,
      LessonStudent,
      LessonSeriesStudent,
      Invitation,
      ParentStudentRelation,
      Subscription,
    ]),
    BotModule,
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
