/**
 * Сервис для работы с Telegram Bot API
 * Отправка уведомлений, сообщений и т.д.
 */

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  User,
  UserNotificationSettings,
  Lesson,
  LessonStudent,
} from "../database/entities";
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

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    entities?: Array<{
      type: string;
      offset: number;
      length: number;
    }>;
  };
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
    startParam: string = "open"
  ): Promise<boolean> {
    const botUsername = process.env.BOT_USERNAME || "your_bot";
    // Всегда используем startapp для открытия Mini App
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
      meetingUrl?: string;
    }
  ): Promise<boolean> {
    // Проверяем можно ли отправить
    const canSend = await this.canSendNotification(
      studentUserId,
      NotificationEventType.LESSON_CREATED
    );

    if (!canSend) {
      this.logger.debug(
        `Lesson created notification disabled for user ${studentUserId}`
      );
      return false;
    }

    // Получаем telegramId пользователя
    const user = await this.userRepo.findOne({ where: { id: studentUserId } });
    if (!user) {
      this.logger.warn(`User not found: ${studentUserId}`);
      return false;
    }

    const { subject, date, time, teacherName, meetingUrl } = lessonInfo;

    let text =
      `📚 <b>Новое занятие</b>\n\n` +
      `📖 Предмет: ${subject}\n` +
      `📅 Дата: ${date}\n` +
      `🕐 Время: ${time}\n` +
      `👨‍🏫 Учитель: ${teacherName}`;

    if (meetingUrl) {
      text += `\n🔗 <a href="${meetingUrl}">Ссылка на встречу</a>`;
    }

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
      this.logger.error(
        `Error in sendLessonReminders: ${(error as Error).message}`
      );
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

      let text =
        `⏰ <b>Напоминание</b>\n\n` +
        `Занятие по <b>${
          lesson.subject?.name || "предмету"
        }</b> начнётся через 30 минут\n` +
        `🕐 Время: ${timeStr}`;

      if (lesson.meetingUrl) {
        text += `\n🔗 <a href="${lesson.meetingUrl}">Присоединиться к встрече</a>`;
      }

      await this.sendMessageWithMiniApp(
        ls.student.user.telegramId,
        text,
        "📚 Открыть"
      );

      this.logger.log(
        `Reminder sent to student ${studentUserId} for lesson ${lesson.id}`
      );
    }

    // Также уведомляем учителя (если у него включены напоминания)
    // TODO: Добавить логику для учителя если нужно
  }

  // ============================================
  // ПРИВЕТСТВЕННЫЕ УВЕДОМЛЕНИЯ
  // ============================================

  /**
   * Отправляет приветственное сообщение при регистрации
   */
  async notifyUserWelcome(
    telegramId: string | number,
    role: 'teacher' | 'student' | 'parent',
    teacherName?: string
  ): Promise<boolean> {
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
          `Вы успешно зарегистрировались как <b>преподаватель</b>.\n\n` +
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
          (teacherName ? ` у преподавателя <b>${teacherName}</b>` : '') + `.\n\n` +
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

  /**
   * Уведомление учителю о новом ученике
   */
  async notifyTeacherNewStudent(
    teacherTelegramId: string | number,
    studentName: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const text = 
      `👨‍🎓 <b>Новый ученик!</b>\n\n` +
      `<b>${studentName}</b> присоединился к вам по ссылке-приглашению.`;

    return this.sendMessageWithMiniApp(
      teacherTelegramId,
      text,
      '👥 Открыть список учеников'
    );
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

  // ============================================
  // WEBHOOK — ОБРАБОТКА КОМАНД
  // ============================================

  /**
   * Обрабатывает входящий update от Telegram
   */
  async handleWebhook(update: TelegramUpdate): Promise<void> {
    if (!update.message?.text) {
      return;
    }

    const { message } = update;
    const chatId = message.chat.id;
    const text = message.text!; // Уже проверено выше
    const firstName = message.from.first_name;

    // Проверяем команду /start
    if (text.startsWith("/start")) {
      await this.handleStartCommand(chatId, firstName);
    }
  }

  /**
   * Обрабатывает команду /start
   */
  private async handleStartCommand(
    chatId: number,
    firstName: string
  ): Promise<void> {
    const botUsername = process.env.BOT_USERNAME || "your_bot";
    const webAppUrl = process.env.WEBAPP_URL;
    
    this.logger.log(`WEBAPP_URL from env: ${webAppUrl}`);

    const welcomeText =
      `👋 <b>Привет, ${firstName}!</b>\n\n` +
      `Добро пожаловать в <b>Tutors Calendar</b> — приложение для преподавателей.\n\n` +
      `🎓 <b>Для преподавателей:</b>\n` +
      `• Удобное расписание\n` +
      `• Управление учениками\n` +
      `• Отслеживание оплат\n\n` +
      `📚 <b>Для учеников:</b>\n` +
      `• Расписание занятий\n` +
      `• Напоминания о уроках\n\n` +
      `Нажмите кнопку ниже, чтобы начать:`;

    // Если WEBAPP_URL задан — используем web_app кнопку, иначе обычную ссылку
    const keyboard = webAppUrl
      ? {
          inline_keyboard: [
            [
              {
                text: "🚀 Открыть приложение",
                web_app: { url: webAppUrl },
              },
            ],
          ],
        }
      : {
          inline_keyboard: [
            [
              {
                text: "🚀 Открыть приложение",
                url: `https://t.me/${botUsername}/app`,
              },
            ],
          ],
        };

    await this.sendMessage(chatId, welcomeText, {
      replyMarkup: keyboard,
    });

    this.logger.log(`Start command handled for chat ${chatId}`);
  }

  /**
   * Устанавливает webhook для бота
   */
  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn("Bot token not configured, cannot set webhook");
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message"],
        }),
      });

      const data: TelegramResponse = await response.json();

      if (!data.ok) {
        this.logger.error(`Failed to set webhook: ${data.description}`);
        return false;
      }

      this.logger.log(`Webhook set to: ${webhookUrl}`);
      return true;
    } catch (error) {
      this.logger.error(`Error setting webhook: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Удаляет webhook (для перехода на polling)
   */
  async deleteWebhook(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/deleteWebhook`, {
        method: "POST",
      });

      const data: TelegramResponse = await response.json();
      return data.ok;
    } catch (error) {
      this.logger.error(`Error deleting webhook: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Получает информацию о текущем webhook
   */
  async getWebhookInfo(): Promise<unknown> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/getWebhookInfo`);
      const data: TelegramResponse = await response.json();
      return data.result;
    } catch (error) {
      this.logger.error(`Error getting webhook info: ${(error as Error).message}`);
      return null;
    }
  }
}
