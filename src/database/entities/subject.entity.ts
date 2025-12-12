import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from "typeorm";
import { TeacherProfile } from "./teacher-profile.entity";
import { Lesson } from "./lesson.entity";
import { LessonSeries } from "./lesson-series.entity";

@Entity("subjects")
@Unique(["teacherId", "code"])
export class Subject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  teacherId: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  colorHex: string;

  @Column({ type: "timestamp", nullable: true })
  archivedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => TeacherProfile, (teacher) => teacher.subjects, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "teacherId" })
  teacher: TeacherProfile;

  @OneToMany(() => Lesson, (lesson) => lesson.subject)
  lessons: Lesson[];

  @OneToMany(() => LessonSeries, (series) => series.subject)
  lessonSeries: LessonSeries[];
}
