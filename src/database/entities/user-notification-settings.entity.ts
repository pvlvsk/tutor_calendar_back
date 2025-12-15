import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

/**
 * Настройки уведомлений пользователя
 * Отдельная таблица для хранения настроек уведомлений
 */
@Entity("user_notification_settings")
export class UserNotificationSettings {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  // ============================================
  // ОБЩИЕ НАСТРОЙКИ
  // ============================================

  /** Был ли показан первоначальный запрос на уведомления */
  @Column({ default: false })
  notificationsAsked: boolean;

  /** Главный выключатель уведомлений (Telegram разрешение + наш выбор) */
  @Column({ default: false })
  notificationsEnabled: boolean;

  // ============================================
  // НАСТРОЙКИ ПО ТИПАМ УВЕДОМЛЕНИЙ
  // ============================================

  /** Уведомление о создании нового урока */
  @Column({ default: true })
  lessonCreatedEnabled: boolean;

  /** Напоминание за 30 минут до урока */
  @Column({ default: true })
  lessonReminderEnabled: boolean;

  // ============================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

