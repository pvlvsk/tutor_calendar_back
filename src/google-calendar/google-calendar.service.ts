import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { google, calendar_v3 } from "googleapis";
import { User } from "../database/entities";

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  /** ID родительского повторяющегося события (если это часть серии) */
  recurringEventId?: string;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly oauth2Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
  }

  /**
   * Генерирует URL для начала OAuth авторизации
   */
  getAuthUrl(state: string): string {
    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state,
      prompt: "consent", // Всегда запрашивать разрешение для получения refresh_token
    });
  }

  /**
   * Обменивает код авторизации на токены
   */
  async handleCallback(
    code: string,
    userId: string
  ): Promise<{ email: string }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Получаем email пользователя
    const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || "";

    // Сохраняем refresh token в БД
    await this.userRepo.update(userId, {
      googleRefreshToken: tokens.refresh_token,
      googleCalendarConnected: true,
      googleEmail: email,
    });

    this.logger.log(`User ${userId} connected Google Calendar: ${email}`);

    return { email };
  }

  /**
   * Отключает Google Calendar
   */
  async disconnect(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      googleRefreshToken: null,
      googleCalendarConnected: false,
      googleEmail: null,
    });

    this.logger.log(`User ${userId} disconnected Google Calendar`);
  }

  /**
   * Получает статус подключения
   */
  async getStatus(
    userId: string
  ): Promise<{ connected: boolean; email: string | null }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    return {
      connected: user?.googleCalendarConnected || false,
      email: user?.googleEmail || null,
    };
  }

  /**
   * Получает авторизованный клиент для пользователя
   */
  private async getAuthorizedClient(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user?.googleRefreshToken) {
      throw new Error("Google Calendar not connected");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    return oauth2Client;
  }

  /**
   * Получает события из Google Calendar
   */
  async getEvents(
    userId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<GoogleCalendarEvent[]> {
    const auth = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return (response.data.items || []).map((event) => ({
      id: event.id || undefined,
      summary: event.summary || "Без названия",
      description: event.description || undefined,
      start: new Date(event.start?.dateTime || event.start?.date || ""),
      end: new Date(event.end?.dateTime || event.end?.date || ""),
      location: event.location || undefined,
      recurringEventId: event.recurringEventId || undefined,
    }));
  }

  /**
   * Создаёт событие в Google Calendar
   */
  async createEvent(
    userId: string,
    event: GoogleCalendarEvent
  ): Promise<string> {
    const auth = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: "Europe/Moscow",
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: "Europe/Moscow",
        },
      },
    });

    this.logger.log(`Created event ${response.data.id} for user ${userId}`);

    return response.data.id || "";
  }

  /**
   * Удаляет событие из Google Calendar
   */
  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const auth = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });

    this.logger.log(`Deleted event ${eventId} for user ${userId}`);
  }
}
