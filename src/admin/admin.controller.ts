import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminAuthGuard } from "./admin-auth.guard";
import {
  LoginDto,
  DateRangeDto,
  RequestLogsQueryDto,
  AnalyticsEventsQueryDto,
  TrackEventDto,
} from "./dto";

@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * Авторизация администратора.
   */
  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.adminService.login(dto.login, dto.password);
  }

  /**
   * Проверка токена (для проверки авторизации).
   */
  @Get("me")
  @UseGuards(AdminAuthGuard)
  async getMe(@Req() req: any) {
    return { admin: req.admin };
  }

  /**
   * Общая статистика для дашборда.
   */
  @Get("dashboard/stats")
  @UseGuards(AdminAuthGuard)
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * График регистраций учителей и учеников.
   */
  @Get("dashboard/registrations")
  @UseGuards(AdminAuthGuard)
  async getRegistrationChart(@Query() query: DateRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    return this.adminService.getRegistrationChart(from, to);
  }

  /**
   * Статистика запросов.
   */
  @Get("requests/stats")
  @UseGuards(AdminAuthGuard)
  async getRequestStats(@Query() query: DateRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    return this.adminService.getRequestStats(from, to);
  }

  /**
   * Статистика по эндпоинтам (группировка).
   */
  @Get("requests/endpoints")
  @UseGuards(AdminAuthGuard)
  async getEndpointStats() {
    return this.adminService.getEndpointStats();
  }

  /**
   * Логи для конкретного эндпоинта.
   */
  @Get("requests/endpoint-logs")
  @UseGuards(AdminAuthGuard)
  async getEndpointLogs(
    @Query("method") method: string,
    @Query("path") path: string,
    @Query() query: RequestLogsQueryDto
  ) {
    return this.adminService.getEndpointLogs(
      method,
      path,
      query.page,
      query.limit
    );
  }

  /**
   * Логи запросов.
   */
  @Get("requests/logs")
  @UseGuards(AdminAuthGuard)
  async getRequestLogs(@Query() query: RequestLogsQueryDto) {
    return this.adminService.getRequestLogs(
      query.page,
      query.limit,
      query.status
    );
  }

  /**
   * Логи ошибок.
   */
  @Get("requests/errors")
  @UseGuards(AdminAuthGuard)
  async getErrorLogs(@Query() query: RequestLogsQueryDto) {
    return this.adminService.getErrorLogs(query.page, query.limit);
  }

  /**
   * Логи запросов с информацией о пользователе (для страницы деталей).
   */
  @Get("requests/logs-detailed")
  @UseGuards(AdminAuthGuard)
  async getRequestLogsDetailed(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: "all" | "success" | "error",
    @Query("method") method?: string,
    @Query("path") path?: string,
    @Query("user") userSearch?: string
  ) {
    return this.adminService.getRequestLogsWithUserInfo(
      parseInt(page || "1"),
      parseInt(limit || "50"),
      status,
      method,
      path,
      userSearch
    );
  }

  /**
   * Данные для графика запросов (успешные/ошибки по времени).
   */
  @Get("requests/chart")
  @UseGuards(AdminAuthGuard)
  async getRequestsChart(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("interval") interval?: "minute" | "hour" | "day"
  ) {
    return this.adminService.getRequestsChartData(
      new Date(from),
      new Date(to),
      interval || "hour"
    );
  }

  /**
   * Аналитические события.
   */
  @Get("analytics/events")
  @UseGuards(AdminAuthGuard)
  async getAnalyticsEvents(@Query() query: AnalyticsEventsQueryDto) {
    return this.adminService.getAnalyticsEvents(
      query.page,
      query.limit,
      query.eventName
    );
  }

  /**
   * Топ событий аналитики.
   */
  @Get("analytics/top")
  @UseGuards(AdminAuthGuard)
  async getTopEvents(@Query() query: DateRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    return this.adminService.getTopEvents(from, to);
  }

  /**
   * Отправка аналитического события (публичный эндпоинт для фронта).
   */
  @Post("analytics/track")
  async trackEvent(@Body() dto: TrackEventDto, @Req() req: any) {
    // Пытаемся получить userId из JWT токена (если есть)
    let userId: string | null = null;
    let userRole: string | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        // Декодируем JWT без проверки (для аналитики достаточно)
        const token = authHeader.substring(7);
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString()
        );
        userId = payload.sub || null;
        userRole = payload.role || null;
      } catch {
        // Игнорируем ошибки парсинга
      }
    }

    await this.adminService.trackEvent({
      eventName: dto.eventName,
      category: dto.category,
      pagePath: dto.pagePath,
      metadata: dto.metadata,
      sessionId: dto.sessionId,
      userId,
      userRole,
      platform: "web",
    });

    return { success: true };
  }
}
