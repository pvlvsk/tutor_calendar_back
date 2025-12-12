import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Lesson } from "./lesson.entity";
import { StudentProfile } from "./student-profile.entity";

@Entity("lesson_students")
@Unique(["lessonId", "studentId"])
export class LessonStudent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  lessonId: string;

  @Column()
  studentId: string;

  @Column()
  priceRub: number;

  @Column({ default: "unknown" })
  attendance: string;

  @Column({ type: "int", nullable: true })
  rating: number | null;

  @Column({ default: "unpaid" })
  paymentStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Lesson, (lesson) => lesson.lessonStudents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "lessonId" })
  lesson: Lesson;

  @ManyToOne(() => StudentProfile, (student) => student.lessonStudents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "studentId" })
  student: StudentProfile;
}



