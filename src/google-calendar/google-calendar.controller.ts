import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response, Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GoogleCalendarService } from "./google-calendar.service";
import { JwtService } from "@nestjs/jwt";

@ApiTags("google-calendar")
@Controller("auth/google/calendar")
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);

  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Получить URL для начала OAuth flow
   */
  @Get("auth-url")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить URL для подключения Google Calendar" })
  async getAuthUrl(@Req() req: any) {
    const userId = req.user.sub;

    // Создаём state с userId для безопасности
    const state = Buffer.from(
      JSON.stringify({ userId, timestamp: Date.now() })
    ).toString("base64");

    const authUrl = this.googleCalendarService.getAuthUrl(state);

    this.logger.log(`User ${userId} requesting Google Calendar auth URL`);

    return { url: authUrl };
  }

  /**
   * Callback от Google после авторизации
   */
  @Get("callback")
  @ApiOperation({ summary: "Callback от Google OAuth" })
  async handleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
    @Res() res: Response
  ) {
    // Базовый URL фронтенда
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (error) {
      this.logger.warn(`Google OAuth error: ${error}`);
      return res.redirect(`${frontendUrl}/profile?google_error=${error}`);
    }

    try {
      // Декодируем state
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      const userId = stateData.userId;

      // Проверяем, что state не устарел (10 минут)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error("State expired");
      }

      // Обрабатываем callback
      const { email } = await this.googleCalendarService.handleCallback(
        code,
        userId
      );

      this.logger.log(`User ${userId} successfully connected Google Calendar`);

      // Редиректим на фронтенд с успехом
      return res.redirect(
        `${frontendUrl}/profile?google_connected=true&google_email=${encodeURIComponent(email)}`
      );
    } catch (err) {
      this.logger.error(`Google OAuth callback error: ${err.message}`);
      return res.redirect(`${frontendUrl}/profile?google_error=callback_failed`);
    }
  }

  /**
   * Получить статус подключения
   */
  @Get("status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить статус подключения Google Calendar" })
  async getStatus(@Req() req: any) {
    return this.googleCalendarService.getStatus(req.user.sub);
  }

  /**
   * Отключить Google Calendar
   */
  @Post("disconnect")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Отключить Google Calendar" })
  async disconnect(@Req() req: any) {
    await this.googleCalendarService.disconnect(req.user.sub);
    return { success: true, message: "Google Calendar disconnected" };
  }

  /**
   * Получить события из Google Calendar
   */
  @Get("events")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить события из Google Calendar" })
  async getEvents(
    @Req() req: any,
    @Query("from") from: string,
    @Query("to") to: string
  ) {
    const timeMin = new Date(from);
    const timeMax = new Date(to);

    return this.googleCalendarService.getEvents(req.user.sub, timeMin, timeMax);
  }
}
