import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ParentProfile } from './parent-profile.entity';
import { StudentProfile } from './student-profile.entity';
import { TeacherProfile } from './teacher-profile.entity';

@Entity('parent_student_relations')
@Unique(['parentId', 'studentId', 'teacherId'])
export class ParentStudentRelation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentId: string;

  @Column()
  studentId: string;

  @Column()
  teacherId: string;

  @Column({ default: true })
  notificationsEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ParentProfile, (parent) => parent.parentStudentRelations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: ParentProfile;

  @ManyToOne(() => StudentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: StudentProfile;

  @ManyToOne(() => TeacherProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: TeacherProfile;
}

