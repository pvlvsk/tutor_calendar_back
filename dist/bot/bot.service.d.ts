import { Repository } from "typeorm";
import { User, UserNotificationSettings, Lesson, LessonStudent } from "../database/entities";
import { NotificationEventType, NotificationSettingsResponse } from "../shared/types/notifications";
interface SendMessageOptions {
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
    disableNotification?: boolean;
    replyMarkup?: object;
}
export declare class BotService {
    private readonly userRepo;
    private readonly settingsRepo;
    private readonly lessonRepo;
    private readonly lessonStudentRepo;
    private readonly logger;
    private readonly botToken;
    private readonly apiUrl;
    constructor(userRepo: Repository<User>, settingsRepo: Repository<UserNotificationSettings>, lessonRepo: Repository<Lesson>, lessonStudentRepo: Repository<LessonStudent>);
    isConfigured(): boolean;
    getOrCreateSettings(userId: string): Promise<UserNotificationSettings>;
    getNotificationSettings(userId: string): Promise<NotificationSettingsResponse>;
    setInitialNotificationPermission(userId: string, granted: boolean): Promise<void>;
    toggleNotifications(userId: string, enabled: boolean): Promise<void>;
    updateNotificationPreference(userId: string, eventType: NotificationEventType, enabled: boolean): Promise<void>;
    canSendNotification(userId: string, eventType: NotificationEventType): Promise<boolean>;
    sendMessage(telegramId: string | number, text: string, options?: SendMessageOptions): Promise<boolean>;
    sendMessageWithMiniApp(telegramId: string | number, text: string, buttonText?: string, startParam?: string): Promise<boolean>;
    notifyLessonCreated(studentUserId: string, lessonInfo: {
        subject: string;
        date: string;
        time: string;
        teacherName: string;
    }): Promise<boolean>;
    sendLessonReminders(): Promise<void>;
    private sendReminderForLesson;
    testSendMessage(telegramId: string | number, text: string, buttonText?: string): Promise<boolean>;
}
export {};
