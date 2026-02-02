import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TeacherController } from "./teacher.controller";
import { TeacherService } from "./teacher.service";
import { TeacherTasks } from "./teacher.tasks";
import { CalendarImportService } from "./calendar-import.service";
import { BotModule } from "../bot/bot.module";
import { GoogleCalendarModule } from "../google-calendar/google-calendar.module";
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
  User,
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
      User,
    ]),
    BotModule,
    forwardRef(() => GoogleCalendarModule),
  ],
  controllers: [TeacherController],
  providers: [TeacherService, TeacherTasks, CalendarImportService],
  exports: [CalendarImportService],
})
export class TeacherModule {}
