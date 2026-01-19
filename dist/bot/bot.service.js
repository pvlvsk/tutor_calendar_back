"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const entities_1 = require("../database/entities");
const notifications_1 = require("../shared/types/notifications");
let BotService = BotService_1 = class BotService {
    constructor(userRepo, settingsRepo, lessonRepo, lessonStudentRepo) {
        this.userRepo = userRepo;
        this.settingsRepo = settingsRepo;
        this.lessonRepo = lessonRepo;
        this.lessonStudentRepo = lessonStudentRepo;
        this.logger = new common_1.Logger(BotService_1.name);
        this.botToken = process.env.BOT_TOKEN;
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    }
    isConfigured() {
        return !!this.botToken;
    }
    async getOrCreateSettings(userId) {
        let settings = await this.settingsRepo.findOne({ where: { userId } });
        if (!settings) {
            settings = this.settingsRepo.create({
                userId,
                notificationsAsked: false,
                notificationsEnabled: false,
                lessonCreatedEnabled: true,
                lessonReminderEnabled: true,
            });
            await this.settingsRepo.save(settings);
        }
        return settings;
    }
    async getNotificationSettings(userId) {
        const settings = await this.getOrCreateSettings(userId);
        return {
            notificationsAsked: settings.notificationsAsked,
            notificationsEnabled: settings.notificationsEnabled,
            lessonCreatedEnabled: settings.lessonCreatedEnabled,
            lessonReminderEnabled: settings.lessonReminderEnabled,
        };
    }
    async setInitialNotificationPermission(userId, granted) {
        const settings = await this.getOrCreateSettings(userId);
        settings.notificationsAsked = true;
        settings.notificationsEnabled = granted;
        await this.settingsRepo.save(settings);
        this.logger.log(`User ${userId} initial notification permission: ${granted}`);
    }
    async toggleNotifications(userId, enabled) {
        const settings = await this.getOrCreateSettings(userId);
        settings.notificationsAsked = true;
        settings.notificationsEnabled = enabled;
        await this.settingsRepo.save(settings);
        this.logger.log(`User ${userId} notifications toggled: ${enabled}`);
    }
    async updateNotificationPreference(userId, eventType, enabled) {
        const settings = await this.getOrCreateSettings(userId);
        if (eventType === notifications_1.NotificationEventType.LESSON_CREATED) {
            settings.lessonCreatedEnabled = enabled;
        }
        else if (eventType === notifications_1.NotificationEventType.LESSON_REMINDER) {
            settings.lessonReminderEnabled = enabled;
        }
        await this.settingsRepo.save(settings);
        this.logger.log(`User ${userId} preference ${eventType}: ${enabled}`);
    }
    async canSendNotification(userId, eventType) {
        const settings = await this.settingsRepo.findOne({ where: { userId } });
        if (!settings || !settings.notificationsEnabled) {
            return false;
        }
        if (eventType === notifications_1.NotificationEventType.LESSON_CREATED) {
            return settings.lessonCreatedEnabled;
        }
        else if (eventType === notifications_1.NotificationEventType.LESSON_REMINDER) {
            return settings.lessonReminderEnabled;
        }
        return false;
    }
    async sendMessage(telegramId, text, options = {}) {
        if (!this.isConfigured()) {
            this.logger.warn("Bot token not configured, skipping message");
            return false;
        }
        try {
            const response = await fetch(`${this.apiUrl}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: telegramId,
                    text,
                    parse_mode: options.parseMode || "HTML",
                    disable_notification: options.disableNotification || false,
                    reply_markup: options.replyMarkup,
                }),
            });
            const data = await response.json();
            if (!data.ok) {
                this.logger.error(`Failed to send message: ${data.description}`);
                return false;
            }
            this.logger.log(`Message sent to ${telegramId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error sending message: ${error.message}`);
            return false;
        }
    }
    async sendMessageWithMiniApp(telegramId, text, buttonText = "Открыть", startParam = "open") {
        const botUsername = process.env.BOT_USERNAME || "your_bot";
        const url = `https://t.me/${botUsername}?startapp=${startParam}`;
        return this.sendMessage(telegramId, text, {
            replyMarkup: {
                inline_keyboard: [
                    [
                        {
                            text: buttonText,
                            url,
                        },
                    ],
                ],
            },
        });
    }
    async notifyLessonCreated(studentUserId, lessonInfo) {
        const canSend = await this.canSendNotification(studentUserId, notifications_1.NotificationEventType.LESSON_CREATED);
        if (!canSend) {
            this.logger.debug(`Lesson created notification disabled for user ${studentUserId}`);
            return false;
        }
        const user = await this.userRepo.findOne({ where: { id: studentUserId } });
        if (!user) {
            this.logger.warn(`User not found: ${studentUserId}`);
            return false;
        }
        const { subject, date, time, teacherName, meetingUrl } = lessonInfo;
        let text = `📚 <b>Новое занятие</b>\n\n` +
            `📖 Предмет: ${subject}\n` +
            `📅 Дата: ${date}\n` +
            `🕐 Время: ${time}\n` +
            `👨‍🏫 Учитель: ${teacherName}`;
        if (meetingUrl) {
            text += `\n🔗 <a href="${meetingUrl}">Ссылка на встречу</a>`;
        }
        return this.sendMessageWithMiniApp(user.telegramId, text, "📅 Открыть расписание");
    }
    async sendLessonReminders() {
        if (!this.isConfigured()) {
            return;
        }
        const now = new Date();
        const reminderTime = new Date(now.getTime() + 30 * 60 * 1000);
        const minTime = new Date(reminderTime.getTime() - 30 * 1000);
        const maxTime = new Date(reminderTime.getTime() + 30 * 1000);
        try {
            const lessons = await this.lessonRepo.find({
                where: {
                    status: "planned",
                    startAt: (0, typeorm_2.LessThanOrEqual)(maxTime),
                },
                relations: ["subject", "teacher", "teacher.user"],
            });
            const upcomingLessons = lessons.filter((lesson) => new Date(lesson.startAt) >= minTime);
            if (upcomingLessons.length === 0) {
                return;
            }
            this.logger.log(`Found ${upcomingLessons.length} lessons for reminders`);
            for (const lesson of upcomingLessons) {
                await this.sendReminderForLesson(lesson);
            }
        }
        catch (error) {
            this.logger.error(`Error in sendLessonReminders: ${error.message}`);
        }
    }
    async sendReminderForLesson(lesson) {
        const lessonStudents = await this.lessonStudentRepo.find({
            where: { lessonId: lesson.id },
            relations: ["student", "student.user"],
        });
        const timezone = lesson.teacher?.user?.timezone || "Europe/Moscow";
        for (const ls of lessonStudents) {
            if (!ls.student?.user)
                continue;
            const studentUserId = ls.student.user.id;
            const canSend = await this.canSendNotification(studentUserId, notifications_1.NotificationEventType.LESSON_REMINDER);
            if (!canSend)
                continue;
            const startAt = new Date(lesson.startAt);
            const timeStr = startAt.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: timezone,
            });
            let text = `⏰ <b>Напоминание</b>\n\n` +
                `Занятие по <b>${lesson.subject?.name || "предмету"}</b> начнётся через 30 минут\n` +
                `🕐 Время: ${timeStr}`;
            if (lesson.meetingUrl) {
                text += `\n🔗 <a href="${lesson.meetingUrl}">Присоединиться к встрече</a>`;
            }
            await this.sendMessageWithMiniApp(ls.student.user.telegramId, text, "📚 Открыть");
            this.logger.log(`Reminder sent to student ${studentUserId} for lesson ${lesson.id}`);
        }
    }
    async notifyUserWelcome(telegramId, role, teacherName) {
        if (!this.isConfigured()) {
            this.logger.warn("Bot token not configured, skipping welcome message");
            return false;
        }
        let text = '';
        let buttonText = '📱 Открыть приложение';
        switch (role) {
            case 'teacher':
                text =
                    `🎉 <b>Добро пожаловать!</b>\n\n` +
                        `Вы успешно зарегистрировались как <b>репетитор</b>.\n\n` +
                        `Теперь вы можете:\n` +
                        `📚 Управлять расписанием\n` +
                        `👨‍🎓 Добавлять учеников\n` +
                        `💰 Отслеживать оплаты\n` +
                        `📊 Смотреть статистику`;
                break;
            case 'student':
                text =
                    `🎉 <b>Добро пожаловать!</b>\n\n` +
                        `Вы успешно зарегистрировались как <b>ученик</b>` +
                        (teacherName ? ` у репетитора <b>${teacherName}</b>` : '') + `.\n\n` +
                        `Теперь вы можете:\n` +
                        `📅 Просматривать расписание\n` +
                        `📊 Следить за статистикой\n` +
                        `👨‍👩‍👧 Пригласить родителя`;
                buttonText = '📅 Открыть расписание';
                break;
            case 'parent':
                text =
                    `🎉 <b>Добро пожаловать!</b>\n\n` +
                        `Вы успешно зарегистрировались как <b>родитель</b>.\n\n` +
                        `Теперь вы можете:\n` +
                        `📅 Просматривать расписание ребёнка\n` +
                        `📊 Следить за успеваемостью\n` +
                        `🔔 Получать уведомления о занятиях`;
                buttonText = '👨‍👩‍👧 Открыть';
                break;
        }
        return this.sendMessageWithMiniApp(telegramId, text, buttonText);
    }
    async notifyTeacherNewStudent(teacherTelegramId, studentName) {
        if (!this.isConfigured()) {
            return false;
        }
        const text = `👨‍🎓 <b>Новый ученик!</b>\n\n` +
            `<b>${studentName}</b> присоединился к вам по ссылке-приглашению.`;
        return this.sendMessageWithMiniApp(teacherTelegramId, text, '👥 Открыть список учеников');
    }
    async testSendMessage(telegramId, text, buttonText) {
        if (buttonText) {
            return this.sendMessageWithMiniApp(telegramId, text, buttonText);
        }
        else {
            return this.sendMessage(telegramId, text);
        }
    }
};
exports.BotService = BotService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BotService.prototype, "sendLessonReminders", null);
exports.BotService = BotService = BotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.UserNotificationSettings)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Lesson)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.LessonStudent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BotService);
//# sourceMappingURL=bot.service.js.map