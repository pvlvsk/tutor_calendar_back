/**
 * Абстрактный сервис уведомлений
 * Маршрутизирует уведомления по доступным каналам: Telegram, Email, MAX
 * Приоритет: Telegram > MAX > Email (настраиваемо)
 */

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../database/entities";
import { BotService } from "../bot/bot.service";
import { MaxBotService } from "../bot/max-bot.service";
import { EmailService } from "../email/email.service";

export type NotificationChannel = "telegram" | "max" | "email";

export interface NotificationPayload {
  subject: string;
  text: string;
  html?: string;
}

export interface NotificationResult {
  sent: boolean;
  channel: NotificationChannel | null;
  error?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly botService: BotService,
    private readonly maxBotService: MaxBotService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Отправить уведомление пользователю по лучшему доступному каналу
   * Приоритет: Telegram > MAX > Email
   */
  async notify(
    userId: string,
    payload: NotificationPayload,
  ): Promise<NotificationResult> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { sent: false, channel: null, error: "USER_NOT_FOUND" };
    }

    return this.notifyUser(user, payload);
  }

  /**
   * Отправить уведомление по объекту User (без лишнего запроса в БД)
   */
  async notifyUser(
    user: User,
    payload: NotificationPayload,
  ): Promise<NotificationResult> {
    const channels = this.getAvailableChannels(user);

    for (const channel of channels) {
      const result = await this.sendViaChannel(user, channel, payload);
      if (result) {
        return { sent: true, channel };
      }
    }

    this.logger.warn(
      `No channel delivered for user ${user.id} (tried: ${channels.join(", ")})`
    );
    return { sent: false, channel: null, error: "NO_CHANNEL_AVAILABLE" };
  }

  /**
   * Отправить уведомление по всем доступным каналам
   */
  async notifyAll(
    userId: string,
    payload: NotificationPayload,
  ): Promise<NotificationResult[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return [{ sent: false, channel: null, error: "USER_NOT_FOUND" }];
    }

    const channels = this.getAvailableChannels(user);
    const results: NotificationResult[] = [];

    for (const channel of channels) {
      const sent = await this.sendViaChannel(user, channel, payload);
      results.push({ sent, channel });
    }

    return results;
  }

  /**
   * Отправить по конкретному каналу
   */
  async sendVia(
    userId: string,
    channel: NotificationChannel,
    payload: NotificationPayload,
  ): Promise<NotificationResult> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { sent: false, channel: null, error: "USER_NOT_FOUND" };
    }

    const sent = await this.sendViaChannel(user, channel, payload);
    return { sent, channel };
  }

  // ============================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ============================================

  /**
   * Определяет доступные каналы для пользователя (в порядке приоритета)
   */
  private getAvailableChannels(user: User): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    if (user.telegramId) channels.push("telegram");
    if (user.maxId) channels.push("max");
    if (user.email && user.emailVerified) channels.push("email");

    return channels;
  }

  /**
   * Отправка через конкретный канал
   */
  private async sendViaChannel(
    user: User,
    channel: NotificationChannel,
    payload: NotificationPayload,
  ): Promise<boolean> {
    try {
      switch (channel) {
        case "telegram":
          if (!user.telegramId) return false;
          return this.botService.sendMessage(
            Number(user.telegramId),
            payload.text,
          );

        case "max":
          if (!user.maxId) return false;
          return this.maxBotService.notifyLesson(user.maxId, payload.text);

        case "email":
          if (!user.email) return false;
          return this.emailService.send({
            to: user.email,
            subject: payload.subject,
            html: payload.html || payload.text,
            text: payload.text,
          });

        default:
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Notification via ${channel} failed for user ${user.id}: ${(error as Error).message}`
      );
      return false;
    }
  }
}
