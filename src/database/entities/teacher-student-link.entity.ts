import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { TeacherProfile } from './teacher-profile.entity';
import { StudentProfile } from './student-profile.entity';

@Entity('teacher_student_links')
@Unique(['teacherId', 'studentId'])
export class TeacherStudentLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  teacherId: string;

  @Column()
  studentId: string;

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, string>;

  /**
   * Дата архивации. NULL = активный ученик.
   * Через 7 дней после архивации запись удаляется автоматически.
   */
  @Column({ type: 'timestamptz', nullable: true, default: null })
  @Index({ where: '"archivedAt" IS NOT NULL' })
  archivedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => TeacherProfile, (teacher) => teacher.teacherStudentLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: TeacherProfile;

  @ManyToOne(() => StudentProfile, (student) => student.teacherStudentLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: StudentProfile;
}
