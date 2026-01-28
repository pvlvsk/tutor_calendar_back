import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
} from "typeorm";
import { TeacherProfile } from "./teacher-profile.entity";
import { StudentProfile } from "./student-profile.entity";
import { ParentProfile } from "./parent-profile.entity";
import { UserNotificationSettings } from "./user-notification-settings.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "bigint", unique: true })
  telegramId: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ default: false })
  isBetaTester: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** Дата удаления аккаунта (soft delete). Null = активный аккаунт */
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => TeacherProfile, (profile) => profile.user)
  teacherProfile: TeacherProfile;

  @OneToOne(() => StudentProfile, (profile) => profile.user)
  studentProfile: StudentProfile;

  @OneToOne(() => ParentProfile, (profile) => profile.user)
  parentProfile: ParentProfile;

  @OneToOne(() => UserNotificationSettings, (settings) => settings.user)
  notificationSettings: UserNotificationSettings;
}
