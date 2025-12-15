import { User } from "./user.entity";
export declare class UserNotificationSettings {
    id: string;
    userId: string;
    user: User;
    notificationsAsked: boolean;
    notificationsEnabled: boolean;
    lessonCreatedEnabled: boolean;
    lessonReminderEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
