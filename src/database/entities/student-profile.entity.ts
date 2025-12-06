import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { TeacherStudentLink } from './teacher-student-link.entity';
import { Lesson } from './lesson.entity';
import { LessonSeries } from './lesson-series.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ unique: true })
  parentInviteCode: string;

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => TeacherStudentLink, (link) => link.student)
  teacherStudentLinks: TeacherStudentLink[];

  @OneToMany(() => Lesson, (lesson) => lesson.student)
  lessons: Lesson[];

  @OneToMany(() => LessonSeries, (series) => series.student)
  lessonSeries: LessonSeries[];
}

