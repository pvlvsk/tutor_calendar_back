import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import {
  StudentProfile,
  TeacherStudentLink,
  Lesson,
  LessonStudent,
  Subject,
  StudentNotificationSettings,
} from "../database/entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      TeacherStudentLink,
      Lesson,
      LessonStudent,
      Subject,
      StudentNotificationSettings,
    ]),
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
