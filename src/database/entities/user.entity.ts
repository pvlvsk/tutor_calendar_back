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

  /** Telegram ID (nullable -- веб-пользователи могут не иметь Telegram) */
  @Column({ type: "bigint", unique: true, nullable: true })
  telegramId: string | null;

  /** MAX messenger ID (nullable) */
  @Column({ type: "bigint", unique: true, nullable: true })
  maxId: string | null;

  /** Email для веб-авторизации (nullable -- TG-пользователи могут не иметь email) */
  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  email: string | null;

  /** Хэш пароля (bcrypt) */
  @Column({ type: "varchar", length: 255, nullable: true })
  passwordHash: string | null;

  /** Подтверждён ли email */
  @Column({ default: false })
  emailVerified: boolean;

  /** Токен для подтверждения email / сброса пароля */
  @Column({ type: "varchar", length: 255, nullable: true })
  emailVerificationToken: string | null;

  /** Срок действия токена верификации/сброса */
  @Column({ type: "timestamp", nullable: true })
  emailTokenExpiresAt: Date | null;

  @Column({ nullable: true })
  firstName: string;

  @Column({ type: "varchar", nullable: true })
  lastName: string | null;

  @Column({ type: "varchar", nullable: true })
  username: string | null;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ default: false })
  isBetaTester: boolean;

  /** Источник регистрации (реферальная метка) */
  @Column({ type: "varchar", length: 100, nullable: true })
  referralSource: string | null;

  // Google Calendar OAuth
  @Column({ type: "text", nullable: true })
  googleRefreshToken: string | null;

  @Column({ default: false })
  googleCalendarConnected: boolean;

  @Column({ type: "varchar", nullable: true })
  googleEmail: string | null;

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
