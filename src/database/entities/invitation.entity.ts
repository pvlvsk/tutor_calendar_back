import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TeacherProfile } from './teacher-profile.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  teacherId: string;

  @Column({ nullable: true })
  studentId: string;

  @Column({ unique: true })
  token: string;

  @Column({ nullable: true })
  usedAt: Date;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => TeacherProfile, (teacher) => teacher.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: TeacherProfile;
}
