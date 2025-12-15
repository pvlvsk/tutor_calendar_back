import { TeacherProfile } from "./teacher-profile.entity";
import { StudentProfile } from "./student-profile.entity";
import { ParentProfile } from "./parent-profile.entity";
import { UserNotificationSettings } from "./user-notification-settings.entity";
export declare class User {
    id: string;
    telegramId: string;
    firstName: string;
    lastName: string;
    username: string;
    city: string;
    timezone: string;
    isBetaTester: boolean;
    createdAt: Date;
    updatedAt: Date;
    teacherProfile: TeacherProfile;
    studentProfile: StudentProfile;
    parentProfile: ParentProfile;
    notificationSettings: UserNotificationSettings;
}
