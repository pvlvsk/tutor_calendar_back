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
import { TeacherProfile } from "./teacher-profile.entity";
import { Subject } from "./subject.entity";
import { Lesson } from "./lesson.entity";
import { LessonSeriesStudent } from "./lesson-series-student.entity";

@Entity("lesson_series")
export class LessonSeries {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  teacherId: string;

  @Column()
  subjectId: string;

  @Column()
  frequency: string;

  @Column({ nullable: true })
  dayOfWeek: number;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  maxOccurrences: number;

  @Column()
  timeOfDay: string;

  @Column()
  durationMinutes: number;

  @Column()
  priceRub: number;

  @Column({ default: false })
  isFree: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => TeacherProfile, (teacher) => teacher.lessonSeries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "teacherId" })
  teacher: TeacherProfile;

  @ManyToOne(() => Subject, (subject) => subject.lessonSeries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "subjectId" })
  subject: Subject;

  @OneToMany(() => Lesson, (lesson) => lesson.series)
  lessons: Lesson[];

  @OneToMany(() => LessonSeriesStudent, (ss) => ss.series)
  seriesStudents: LessonSeriesStudent[];
}
