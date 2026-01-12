import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { LessonSeries } from "./lesson-series.entity";
import { TeacherProfile } from "./teacher-profile.entity";
import { Subject } from "./subject.entity";
import { LessonStudent } from "./lesson-student.entity";

@Entity("lessons")
export class Lesson {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  seriesId: string;

  @Column()
  teacherId: string;

  @Column()
  subjectId: string;

  @Column()
  startAt: Date;

  @Column()
  durationMinutes: number;

  @Column()
  priceRub: number;

  @Column({ default: false })
  isFree: boolean;

  @Column({ default: "planned" })
  status: string;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  rescheduledTo: string;

  @Column({ nullable: true })
  teacherNote: string;

  @Column({ nullable: true })
  teacherNoteUpdatedAt: Date;

  @Column({ nullable: true })
  lessonReport: string;

  @Column({ nullable: true })
  studentNotePrivate: string;

  @Column({ nullable: true })
  studentNoteForTeacher: string;

  @Column({ nullable: true })
  reminderMinutesBefore: number;

  @Column({ nullable: true })
  meetingUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => LessonSeries, (series) => series.lessons, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "seriesId" })
  series: LessonSeries;

  @ManyToOne(() => TeacherProfile, (teacher) => teacher.lessons, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "teacherId" })
  teacher: TeacherProfile;

  @ManyToOne(() => Subject, (subject) => subject.lessons, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "subjectId" })
  subject: Subject;

  @OneToMany(() => LessonStudent, (ls) => ls.lesson)
  lessonStudents: LessonStudent[];
}
