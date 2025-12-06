import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { StudentProfile } from './student-profile.entity';

@Entity('student_notification_settings')
export class StudentNotificationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @OneToOne(() => StudentProfile)
  @JoinColumn({ name: 'studentId' })
  student: StudentProfile;

  @Column({ default: 60 })
  defaultReminderMinutesBefore: number;

  @Column({ default: true })
  enableLessonReminders: boolean;

  @Column({ default: true })
  enableLessonReports: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

