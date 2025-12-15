/**
 * Контроллер для API бота
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  Headers,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BotService } from "./bot.service";
import {
  NotificationEventType,
  NotificationSettingsResponse,
} from "../shared/types/notifications";

// ============================================
// DTO
// ============================================

interface AuthRequest {
  user: {
    sub: string; // userId из JWT
    telegramId: number;
    role: string;
    profileId: string;
    isBetaTester: boolean;
  };
}

/** Установка первоначального разрешения (после Telegram requestWriteAccess) */
interface SetInitialPermissionDto {
  granted: boolean;
}

/** Переключение главного выключателя */
interface ToggleNotificationsDto {
  enabled: boolean;
}

/** Обновление настройки для конкретного типа уведомлений */
interface UpdatePreferenceDto {
  eventType: NotificationEventType;
  enabled: boolean;
}

/** Тестовое сообщение (для разработки) */
interface TestMessageDto {
  telegramId: string | number;
  text: string;
  buttonText?: string;
}

// ============================================
// КОНТРОЛЛЕР
// ============================================

@Controller("bot")
export class BotController {
  constructor(private readonly botService: BotService) {}

  // ============================================
  // НАСТРОЙКИ УВЕДОМЛЕНИЙ
  // ============================================

  /**
   * Получить настройки уведомлений текущего пользователя
   * GET /api/bot/notifications
   */
  @Get("notifications")
  @UseGuards(JwtAuthGuard)
  async getNotificationSettings(
    @Request() req: AuthRequest
  ): Promise<NotificationSettingsResponse> {
    return this.botService.getNotificationSettings(req.user.sub);
  }

  /**
   * Установить первоначальное разрешение (после Telegram requestWriteAccess)
   * POST /api/bot/notifications/initial
   *
   * Body: { "granted": true }
   */
  @Post("notifications/initial")
  @UseGuards(JwtAuthGuard)
  async setInitialPermission(
    @Request() req: AuthRequest,
    @Body() dto: SetInitialPermissionDto
  ) {
    await this.botService.setInitialNotificationPermission(
      req.user.sub,
      dto.granted
    );
    return { success: true };
  }

  /**
   * Переключить главный выключатель уведомлений
   * POST /api/bot/notifications/toggle
   *
   * Body: { "enabled": true }
   */
  @Post("notifications/toggle")
  @UseGuards(JwtAuthGuard)
  async toggleNotifications(
    @Request() req: AuthRequest,
    @Body() dto: ToggleNotificationsDto
  ) {
    await this.botService.toggleNotifications(req.user.sub, dto.enabled);
    return { success: true };
  }

  /**
   * Обновить настройку для конкретного типа уведомлений
   * POST /api/bot/notifications/preference
   *
   * Body: { "eventType": "lesson_created", "enabled": false }
   */
  @Post("notifications/preference")
  @UseGuards(JwtAuthGuard)
  async updatePreference(
    @Request() req: AuthRequest,
    @Body() dto: UpdatePreferenceDto
  ) {
    await this.botService.updateNotificationPreference(
      req.user.sub,
      dto.eventType,
      dto.enabled
    );
    return { success: true };
  }

  // ============================================
  // ТЕСТИРОВАНИЕ (только для разработки)
  // ============================================

  /**
   * Тестовый эндпоинт для отправки сообщений
   * POST /api/bot/test-send
   *
   * Headers:
   *   X-Admin-Secret: <BOT_TOKEN или BETA_CODE>
   *
   * Body:
   *   {
   *     "telegramId": 123456789,
   *     "text": "Привет! Это тестовое сообщение",
   *     "buttonText": "Открыть приложение" // опционально
   *   }
   */
  @Post("test-send")
  async testSendMessage(
    @Headers("x-admin-secret") adminSecret: string,
    @Body() dto: TestMessageDto
  ) {
    const validSecrets = [
      process.env.BOT_TOKEN,
      process.env.BETA_CODE,
      process.env.JWT_SECRET,
    ].filter(Boolean);

    if (!adminSecret || !validSecrets.includes(adminSecret)) {
      throw new UnauthorizedException("Invalid admin secret");
    }

    const success = await this.botService.testSendMessage(
      dto.telegramId,
      dto.text,
      dto.buttonText
    );

    return {
      success,
      telegramId: dto.telegramId,
      message: success ? "Message sent" : "Failed to send message",
    };
  }
}
