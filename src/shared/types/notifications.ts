/**
 * Типы для системы уведомлений
 */

/**
 * Типы уведомлений
 */
export enum NotificationEventType {
  /** Уведомление о создании нового урока */
  LESSON_CREATED = "lesson_created",
  /** Напоминание за 30 минут до урока */
  LESSON_REMINDER = "lesson_reminder",
}

/**
 * Ответ с настройками уведомлений
 */
export interface NotificationSettingsResponse {
  notificationsAsked: boolean;
  notificationsEnabled: boolean;
  lessonCreatedEnabled: boolean;
  lessonReminderEnabled: boolean;
}

/**
 * Локализованные названия типов уведомлений
 */
export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
  [NotificationEventType.LESSON_CREATED]: "Новые занятия",
  [NotificationEventType.LESSON_REMINDER]: "Напоминание за 30 минут",
};

/**
 * Описание типов уведомлений
 */
export const NOTIFICATION_EVENT_DESCRIPTIONS: Record<NotificationEventType, string> = {
  [NotificationEventType.LESSON_CREATED]: "Когда учитель создаёт новое занятие",
  [NotificationEventType.LESSON_REMINDER]: "Напоминание за 30 минут до начала занятия",
};
