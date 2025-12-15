export declare enum NotificationEventType {
    LESSON_CREATED = "lesson_created",
    LESSON_REMINDER = "lesson_reminder"
}
export interface NotificationSettingsResponse {
    notificationsAsked: boolean;
    notificationsEnabled: boolean;
    lessonCreatedEnabled: boolean;
    lessonReminderEnabled: boolean;
}
export declare const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string>;
export declare const NOTIFICATION_EVENT_DESCRIPTIONS: Record<NotificationEventType, string>;
