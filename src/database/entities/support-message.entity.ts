import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

export type SupportMessageStatus = "new" | "in_progress" | "resolved" | "closed";

@Entity("support_messages")
export class SupportMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar", length: 255 })
  subject: string;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "varchar", length: 50, default: "new" })
  status: SupportMessageStatus;

  @Column({ type: "text", nullable: true })
  adminNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
