import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Сущность для хранения аналитических событий с фронтенда.
 */
@Entity("analytics_events")
@Index(["createdAt"])
@Index(["eventName"])
@Index(["userId"])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** Название события (page_view, button_click, feature_used) */
  @Column({ type: "varchar", length: 100 })
  eventName: string;

  /** Категория события */
  @Column({ type: "varchar", length: 50, nullable: true })
  category: string | null;

  /** ID пользователя */
  @Column({ type: "uuid", nullable: true })
  userId: string | null;

  /** Роль пользователя */
  @Column({ type: "varchar", length: 20, nullable: true })
  userRole: string | null;

  /** Страница/путь */
  @Column({ type: "varchar", length: 500, nullable: true })
  pagePath: string | null;

  /** Дополнительные данные (JSON) */
  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  /** Версия приложения */
  @Column({ type: "varchar", length: 20, nullable: true })
  appVersion: string | null;

  /** Платформа (web, ios, android) */
  @Column({ type: "varchar", length: 20, default: "web" })
  platform: string;

  /** ID сессии */
  @Column({ type: "varchar", length: 100, nullable: true })
  sessionId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
