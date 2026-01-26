import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Сущность для логирования HTTP запросов.
 * Используется для мониторинга ошибок и анализа API.
 */
@Entity("request_logs")
@Index(["createdAt"])
@Index(["statusCode"])
@Index(["method", "path"])
export class RequestLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** HTTP метод (GET, POST, etc.) */
  @Column({ type: "varchar", length: 10 })
  method: string;

  /** Путь запроса */
  @Column({ type: "varchar", length: 500 })
  path: string;

  /** HTTP статус ответа */
  @Column()
  statusCode: number;

  /** Время выполнения запроса в мс */
  @Column()
  durationMs: number;

  /** ID пользователя (если авторизован) */
  @Column({ type: "uuid", nullable: true })
  userId: string | null;

  /** Роль пользователя */
  @Column({ type: "varchar", length: 20, nullable: true })
  userRole: string | null;

  /** IP адрес клиента */
  @Column({ type: "varchar", length: 50, nullable: true })
  clientIp: string | null;

  /** User-Agent */
  @Column({ type: "text", nullable: true })
  userAgent: string | null;

  /** Тело запроса (для POST/PUT, обрезанное) */
  @Column({ type: "text", nullable: true })
  requestBody: string | null;

  /** Сообщение об ошибке (если есть) */
  @Column({ type: "text", nullable: true })
  errorMessage: string | null;

  /** Stack trace ошибки */
  @Column({ type: "text", nullable: true })
  errorStack: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
