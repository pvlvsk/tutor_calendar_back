import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';
import {
  ParentProfile,
  StudentProfile,
  TeacherProfile,
  ParentStudentRelation,
  TeacherStudentLink,
  Lesson,
  Subject,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParentProfile,
      StudentProfile,
      TeacherProfile,
      ParentStudentRelation,
      TeacherStudentLink,
      Lesson,
      Subject,
    ]),
  ],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}
