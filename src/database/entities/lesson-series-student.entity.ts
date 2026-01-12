import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { LessonSeries } from "./lesson-series.entity";
import { StudentProfile } from "./student-profile.entity";

@Entity("lesson_series_students")
@Unique(["seriesId", "studentId"])
export class LessonSeriesStudent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  seriesId: string;

  @Column()
  studentId: string;

  @Column()
  priceRub: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => LessonSeries, (series) => series.seriesStudents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "seriesId" })
  series: LessonSeries;

  @ManyToOne(() => StudentProfile, (student) => student.seriesStudents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "studentId" })
  student: StudentProfile;
}
















