import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Subject } from './subject.entity';
import { TeacherStudentLink } from './teacher-student-link.entity';
import { Lesson } from './lesson.entity';
import { LessonSeries } from './lesson-series.entity';
import { Invitation } from './invitation.entity';

@Entity('teacher_profiles')
export class TeacherProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ unique: true })
  referralCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.teacherProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Subject, (subject) => subject.teacher)
  subjects: Subject[];

  @OneToMany(() => TeacherStudentLink, (link) => link.teacher)
  teacherStudentLinks: TeacherStudentLink[];

  @OneToMany(() => Lesson, (lesson) => lesson.teacher)
  lessons: Lesson[];

  @OneToMany(() => LessonSeries, (series) => series.teacher)
  lessonSeries: LessonSeries[];

  @OneToMany(() => Invitation, (invitation) => invitation.teacher)
  invitations: Invitation[];
}

