/**
 * Сервис для работы с MAX messenger
 * Валидация initData и работа с MAX Bot API
 */

import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";

export interface MaxUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

@Injectable()
export class MaxService {
  private readonly logger = new Logger(MaxService.name);
  private readonly botToken = process.env.MAX_BOT_TOKEN;
  private readonly isDev =
    !this.botToken || process.env.NODE_ENV === "development";

  isConfigured(): boolean {
    return !!this.botToken;
  }

  /**
   * Валидация initData от MAX Mini App
   * Схема идентична Telegram: HMAC-SHA256 с "WebAppData" + bot_token
   */
  validateInitData(initData: string): MaxUser | null {
    if (this.isDev) {
      return this.parseDevInitData(initData);
    }
    return this.parseAndValidate(initData);
  }

  private parseDevInitData(initData: string): MaxUser {
    try {
      const params = new URLSearchParams(initData);
      const userStr = params.get("user");
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch {}

    return {
      id: 987654321,
      first_name: "MaxDev",
      last_name: "User",
      username: "maxdevuser",
    };
  }

  private parseAndValidate(initData: string): MaxUser | null {
    try {
      const params = new URLSearchParams(initData);
      const hash = params.get("hash");
      if (!hash) return null;

      params.delete("hash");
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      const secretKey = crypto
        .createHmac("sha256", "WebAppData")
        .update(this.botToken!)
        .digest();

      const calculatedHash = crypto
        .createHmac("sha256", secretKey)
        .update(sortedParams)
        .digest("hex");

      if (calculatedHash !== hash) {
        this.logger.warn("MAX initData hash mismatch");
        return null;
      }

      const userStr = params.get("user");
      if (!userStr) return null;

      return JSON.parse(userStr);
    } catch (error) {
      this.logger.error(
        `MAX initData validation error: ${(error as Error).message}`
      );
      return null;
    }
  }

  /**
   * Отправить текстовое сообщение через MAX Bot API
   */
  async sendMessage(chatId: number, text: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn("MAX_BOT_TOKEN not configured, message not sent");
      return false;
    }

    try {
      const response = await fetch(
        "https://platform-api.max.ru/botapi/messages",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
          }),
        }
      );

      if (!response.ok) {
        this.logger.error(`MAX API error: ${response.status} ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `MAX sendMessage error: ${(error as Error).message}`
      );
      return false;
    }
  }
}
