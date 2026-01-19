import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  DeleteDateColumn,
} from "typeorm";
import { TeacherProfile } from "./teacher-profile.entity";
import { StudentProfile } from "./student-profile.entity";

export type SubscriptionType = "lessons" | "date";

@Entity("subscriptions")
@Unique(["teacherId", "studentId", "deletedAt"]) // Один активный абонемент на пару
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  teacherId: string;

  @Column()
  studentId: string;

  @Column({ type: "varchar", length: 20 })
  type: SubscriptionType;

  // Для type='lessons': сколько уроков куплено
  @Column({ type: "int", nullable: true })
  totalLessons: number | null;

  // Для type='lessons': сколько уроков использовано
  @Column({ type: "int", default: 0 })
  usedLessons: number;

  // Для type='date': дата окончания
  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date | null;

  // Название/описание (опционально)
  @Column({ nullable: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Мягкое удаление
  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => TeacherProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "teacherId" })
  teacher: TeacherProfile;

  @ManyToOne(() => StudentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "studentId" })
  student: StudentProfile;

  // Вычисляемые свойства
  get remainingLessons(): number | null {
    if (this.type !== "lessons" || this.totalLessons === null) return null;
    return Math.max(0, this.totalLessons - this.usedLessons);
  }

  get isExpired(): boolean {
    if (this.type === "lessons") {
      return this.remainingLessons === 0;
    }
    if (this.type === "date" && this.expiresAt) {
      return new Date() > this.expiresAt;
    }
    return false;
  }

  get isActive(): boolean {
    return !this.deletedAt && !this.isExpired;
  }
}
