/**
 * Сервис для работы с Telegram Bot API
 * Отправка уведомлений, сообщений и т.д.
 */

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { User, UserNotificationSettings, Lesson, LessonStudent } from "../database/entities";
import {
  NotificationEventType,
  NotificationSettingsResponse,
} from "../shared/types/notifications";

interface SendMessageOptions {
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  disableNotification?: boolean;
  replyMarkup?: object;
}

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private readonly botToken = process.env.BOT_TOKEN;
  private readonly apiUrl = `https://api.telegram.org/bot${this.botToken}`;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserNotificationSettings)
    private readonly settingsRepo: Repository<UserNotificationSettings>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(LessonStudent)
    private readonly lessonStudentRepo: Repository<LessonStudent>
  ) {}

  /**
   * Проверяет, настроен ли бот
   */
  isConfigured(): boolean {
    return !!this.botToken;
  }

  // ============================================
  // НАСТРОЙКИ УВЕДОМЛЕНИЙ
  // ============================================

  /**
   * Получает или создаёт настройки уведомлений пользователя
   */
  async getOrCreateSettings(userId: string): Promise<UserNotificationSettings> {
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

  /**
   * Получает настройки уведомлений пользователя
   */
  async getNotificationSettings(
    userId: string
  ): Promise<NotificationSettingsResponse> {
    const settings = await this.getOrCreateSettings(userId);

    return {
      notificationsAsked: settings.notificationsAsked,
      notificationsEnabled: settings.notificationsEnabled,
      lessonCreatedEnabled: settings.lessonCreatedEnabled,
      lessonReminderEnabled: settings.lessonReminderEnabled,
    };
  }

  /**
   * Устанавливает первоначальное разрешение (после Telegram requestWriteAccess)
   */
  async setInitialNotificationPermission(
    userId: string,
    granted: boolean
  ): Promise<void> {
    const settings = await this.getOrCreateSettings(userId);

    settings.notificationsAsked = true;
    settings.notificationsEnabled = granted;

    await this.settingsRepo.save(settings);
    this.logger.log(
      `User ${userId} initial notification permission: ${granted}`
    );
  }

  /**
   * Переключает главный выключатель уведомлений
   */
  async toggleNotifications(userId: string, enabled: boolean): Promise<void> {
    const settings = await this.getOrCreateSettings(userId);

    settings.notificationsAsked = true;
    settings.notificationsEnabled = enabled;

    await this.settingsRepo.save(settings);
    this.logger.log(`User ${userId} notifications toggled: ${enabled}`);
  }

  /**
   * Обновляет настройку для конкретного типа уведомлений
   */
  async updateNotificationPreference(
    userId: string,
    eventType: NotificationEventType,
    enabled: boolean
  ): Promise<void> {
    const settings = await this.getOrCreateSettings(userId);

    if (eventType === NotificationEventType.LESSON_CREATED) {
      settings.lessonCreatedEnabled = enabled;
    } else if (eventType === NotificationEventType.LESSON_REMINDER) {
      settings.lessonReminderEnabled = enabled;
    }

    await this.settingsRepo.save(settings);
    this.logger.log(`User ${userId} preference ${eventType}: ${enabled}`);
  }

  /**
   * Проверяет, можно ли отправить уведомление пользователю
   */
  async canSendNotification(
    userId: string,
    eventType: NotificationEventType
  ): Promise<boolean> {
    const settings = await this.settingsRepo.findOne({ where: { userId } });

    if (!settings || !settings.notificationsEnabled) {
      return false;
    }

    if (eventType === NotificationEventType.LESSON_CREATED) {
      return settings.lessonCreatedEnabled;
    } else if (eventType === NotificationEventType.LESSON_REMINDER) {
      return settings.lessonReminderEnabled;
    }

    return false;
  }

  // ============================================
  // ОТПРАВКА СООБЩЕНИЙ
  // ============================================

  /**
   * Отправляет сообщение пользователю по его telegramId (низкоуровневый метод)
   */
  async sendMessage(
    telegramId: string | number,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<boolean> {
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

      const data: TelegramResponse = await response.json();

      if (!data.ok) {
        this.logger.error(`Failed to send message: ${data.description}`);
        return false;
      }

      this.logger.log(`Message sent to ${telegramId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending message: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Отправляет сообщение с кнопкой открытия Mini App
   */
  async sendMessageWithMiniApp(
    telegramId: string | number,
    text: string,
    buttonText: string = "Открыть",
    startParam?: string
  ): Promise<boolean> {
    const botUsername = process.env.BOT_USERNAME || "your_bot";
    const url = startParam
      ? `https://t.me/${botUsername}?startapp=${startParam}`
      : `https://t.me/${botUsername}`;

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

  // ============================================
  // УВЕДОМЛЕНИЯ О СОЗДАНИИ УРОКА
  // ============================================

  /**
   * Отправляет уведомление ученику о создании нового урока
   * Вызывается из TeacherService при создании урока
   */
  async notifyLessonCreated(
    studentUserId: string,
    lessonInfo: {
      subject: string;
      date: string;
      time: string;
      teacherName: string;
    }
  ): Promise<boolean> {
    // Проверяем можно ли отправить
    const canSend = await this.canSendNotification(
      studentUserId,
      NotificationEventType.LESSON_CREATED
    );

    if (!canSend) {
      this.logger.debug(`Lesson created notification disabled for user ${studentUserId}`);
      return false;
    }

    // Получаем telegramId пользователя
    const user = await this.userRepo.findOne({ where: { id: studentUserId } });
    if (!user) {
      this.logger.warn(`User not found: ${studentUserId}`);
      return false;
    }

    const { subject, date, time, teacherName } = lessonInfo;

    const text =
      `📚 <b>Новое занятие</b>\n\n` +
      `📖 Предмет: ${subject}\n` +
      `📅 Дата: ${date}\n` +
      `🕐 Время: ${time}\n` +
      `👨‍🏫 Учитель: ${teacherName}`;

    return this.sendMessageWithMiniApp(
      user.telegramId,
      text,
      "📅 Открыть расписание"
    );
  }

  // ============================================
  // НАПОМИНАНИЯ О УРОКАХ (CRON JOB)
  // ============================================

  /**
   * Крон-задача: отправка напоминаний за 30 минут до урока
   * Запускается каждую минуту
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async sendLessonReminders(): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    const now = new Date();
    const reminderTime = new Date(now.getTime() + 30 * 60 * 1000); // +30 минут

    // Ищем уроки которые начнутся через 30 минут (±1 минута)
    const minTime = new Date(reminderTime.getTime() - 30 * 1000);
    const maxTime = new Date(reminderTime.getTime() + 30 * 1000);

    try {
      // Получаем уроки со статусом 'planned' которые начинаются в нужное время
      const lessons = await this.lessonRepo.find({
        where: {
          status: "planned",
          startAt: LessThanOrEqual(maxTime),
        },
        relations: ["subject", "teacher", "teacher.user"],
      });

      // Фильтруем уроки по времени (startAt >= minTime)
      const upcomingLessons = lessons.filter(
        (lesson) => new Date(lesson.startAt) >= minTime
      );

      if (upcomingLessons.length === 0) {
        return;
      }

      this.logger.log(`Found ${upcomingLessons.length} lessons for reminders`);

      for (const lesson of upcomingLessons) {
        await this.sendReminderForLesson(lesson);
      }
    } catch (error) {
      this.logger.error(`Error in sendLessonReminders: ${(error as Error).message}`);
    }
  }

  /**
   * Отправляет напоминание для конкретного урока
   */
  private async sendReminderForLesson(lesson: Lesson): Promise<void> {
    // Получаем учеников урока
    const lessonStudents = await this.lessonStudentRepo.find({
      where: { lessonId: lesson.id },
      relations: ["student", "student.user"],
    });

    // Используем timezone учителя или Moscow по умолчанию
    const timezone = (lesson as any).teacher?.user?.timezone || "Europe/Moscow";

    for (const ls of lessonStudents) {
      if (!ls.student?.user) continue;

      const studentUserId = ls.student.user.id;

      // Проверяем можно ли отправить
      const canSend = await this.canSendNotification(
        studentUserId,
        NotificationEventType.LESSON_REMINDER
      );

      if (!canSend) continue;

      const startAt = new Date(lesson.startAt);
      const timeStr = startAt.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
      });

      const text =
        `⏰ <b>Напоминание</b>\n\n` +
        `Занятие по <b>${lesson.subject?.name || "предмету"}</b> начнётся через 30 минут\n` +
        `🕐 Время: ${timeStr}`;

      await this.sendMessageWithMiniApp(
        ls.student.user.telegramId,
        text,
        "📚 Открыть"
      );

      this.logger.log(`Reminder sent to student ${studentUserId} for lesson ${lesson.id}`);
    }

    // Также уведомляем учителя (если у него включены напоминания)
    // TODO: Добавить логику для учителя если нужно
  }

  // ============================================
  // ТЕСТИРОВАНИЕ
  // ============================================

  /**
   * Тестовая отправка сообщения
   */
  async testSendMessage(
    telegramId: string | number,
    text: string,
    buttonText?: string
  ): Promise<boolean> {
    if (buttonText) {
      return this.sendMessageWithMiniApp(telegramId, text, buttonText);
    } else {
      return this.sendMessage(telegramId, text);
    }
  }
}
