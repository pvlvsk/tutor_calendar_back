import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import {
  TeacherProfile,
  StudentProfile,
  Subject,
  TeacherStudentLink,
  Lesson,
  LessonSeries,
  Invitation,
  ParentStudentRelation,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherProfile,
      StudentProfile,
      Subject,
      TeacherStudentLink,
      Lesson,
      LessonSeries,
      Invitation,
      ParentStudentRelation,
    ]),
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
