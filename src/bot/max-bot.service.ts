/**
 * Сервис для работы с MAX Bot API
 * Отправка уведомлений, обработка webhook
 */

import { Injectable, Logger } from "@nestjs/common";

interface MaxBotUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      user_id: number;
      name?: string;
      username?: string;
    };
    chat: {
      chat_id: number;
      type: string;
    };
    timestamp: number;
    body?: {
      text?: string;
    };
  };
}

@Injectable()
export class MaxBotService {
  private readonly logger = new Logger(MaxBotService.name);
  private readonly botToken = process.env.MAX_BOT_TOKEN;
  private readonly apiUrl = "https://platform-api.max.ru/botapi";

  isConfigured(): boolean {
    return !!this.botToken;
  }

  /**
   * Отправить текстовое сообщение
   */
  async sendMessage(chatId: number, text: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn("MAX_BOT_TOKEN not set, skipping message");
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `MAX send error: ${response.status} ${errorBody}`
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `MAX sendMessage failed: ${(error as Error).message}`
      );
      return false;
    }
  }

  /**
   * Обработка входящего webhook обновления
   */
  async handleWebhook(update: MaxBotUpdate): Promise<void> {
    if (!update.message?.body?.text) return;

    const text = update.message.body.text;
    const chatId = update.message.chat.chat_id;
    const userName = update.message.from.name || "Пользователь";

    this.logger.log(
      `MAX message from ${userName} (${update.message.from.user_id}): ${text}`
    );

    // Обработка команды /start
    if (text === "/start" || text.startsWith("/start ")) {
      await this.sendMessage(
        chatId,
        `Привет, ${userName}! Добро пожаловать в Tutors Calendar.\n\nОткройте мини-приложение для управления расписанием.`
      );
      return;
    }

    // Обработка /help
    if (text === "/help") {
      await this.sendMessage(
        chatId,
        "Tutors Calendar — управление расписанием занятий.\n\nОткройте мини-приложение через кнопку меню бота."
      );
      return;
    }
  }

  /**
   * Установить webhook URL на MAX платформе
   */
  async setWebhook(url: string): Promise<boolean> {
    if (!this.botToken) return false;

    try {
      const response = await fetch(`${this.apiUrl}/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          update_types: ["message_created"],
        }),
      });

      if (!response.ok) {
        this.logger.error(`MAX setWebhook error: ${response.status}`);
        return false;
      }

      this.logger.log(`MAX webhook set to: ${url}`);
      return true;
    } catch (error) {
      this.logger.error(
        `MAX setWebhook failed: ${(error as Error).message}`
      );
      return false;
    }
  }

  /**
   * Уведомить пользователя MAX об уроке
   */
  async notifyLesson(
    maxId: string,
    message: string,
  ): Promise<boolean> {
    if (!this.isConfigured()) return false;
    return this.sendMessage(Number(maxId), message);
  }
}
