import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Сущность администратора системы.
 * Используется для доступа к админ-панели.
 */
@Entity("admin_users")
export class AdminUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  login: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
