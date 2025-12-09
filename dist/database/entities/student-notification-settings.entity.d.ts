import { StudentProfile } from './student-profile.entity';
export declare class StudentNotificationSettings {
    id: string;
    studentId: string;
    student: StudentProfile;
    defaultReminderMinutesBefore: number;
    enableLessonReminders: boolean;
    enableLessonReports: boolean;
    createdAt: Date;
    updatedAt: Date;
}
