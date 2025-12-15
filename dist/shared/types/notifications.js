"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_EVENT_DESCRIPTIONS = exports.NOTIFICATION_EVENT_LABELS = exports.NotificationEventType = void 0;
var NotificationEventType;
(function (NotificationEventType) {
    NotificationEventType["LESSON_CREATED"] = "lesson_created";
    NotificationEventType["LESSON_REMINDER"] = "lesson_reminder";
})(NotificationEventType || (exports.NotificationEventType = NotificationEventType = {}));
exports.NOTIFICATION_EVENT_LABELS = {
    [NotificationEventType.LESSON_CREATED]: "Новые занятия",
    [NotificationEventType.LESSON_REMINDER]: "Напоминание за 30 минут",
};
exports.NOTIFICATION_EVENT_DESCRIPTIONS = {
    [NotificationEventType.LESSON_CREATED]: "Когда учитель создаёт новое занятие",
    [NotificationEventType.LESSON_REMINDER]: "Напоминание за 30 минут до начала занятия",
};
//# sourceMappingURL=notifications.js.map