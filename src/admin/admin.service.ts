import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, LessThan } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as bcrypt from "bcrypt";
import {
  AdminUser,
  RequestLog,
  AnalyticsEvent,
  User,
  TeacherProfile,
  StudentProfile,
} from "../database/entities";

export interface AdminTokenPayload {
  sub: string;
  login: string;
  type: "admin";
}

export interface DashboardStats {
  totalTeachers: number;
  totalStudents: number;
  newTeachersToday: number;
  newStudentsToday: number;
}

export interface ChartDataPoint {
  date: string;
  teachers: number;
  students: number;
}

export interface RequestStats {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  avgDurationMs: number;
}

export interface EndpointStats {
  method: string;
  path: string;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  avgDurationMs: number;
  lastRequestAt: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  // Количество дней хранения логов (по умолчанию 7 дней)
  private readonly LOG_RETENTION_DAYS = parseInt(
    process.env.LOG_RETENTION_DAYS || "7",
    10
  );

  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepo: Repository<AdminUser>,
    @InjectRepository(RequestLog)
    private requestLogRepo: Repository<RequestLog>,
    @InjectRepository(AnalyticsEvent)
    private analyticsEventRepo: Repository<AnalyticsEvent>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(TeacherProfile)
    private teacherRepo: Repository<TeacherProfile>,
    @InjectRepository(StudentProfile)
    private studentRepo: Repository<StudentProfile>,
    private jwtService: JwtService
  ) {}

  /**
   * Очистка старых логов запросов (запускается каждый день в 3:00)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.LOG_RETENTION_DAYS);

    try {
      const result = await this.requestLogRepo.delete({
        createdAt: LessThan(cutoffDate),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Очистка логов: удалено ${result.affected} записей старше ${this.LOG_RETENTION_DAYS} дней`
        );
      }
    } catch (error) {
      this.logger.error("Ошибка при очистке старых логов:", error);
    }
  }

  /**
   * Очистка старых аналитических событий (запускается каждый день в 3:30)
   */
  @Cron("30 3 * * *")
  async cleanupOldAnalyticsEvents(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.LOG_RETENTION_DAYS);

    try {
      const result = await this.analyticsEventRepo.delete({
        createdAt: LessThan(cutoffDate),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Очистка аналитики: удалено ${result.affected} событий старше ${this.LOG_RETENTION_DAYS} дней`
        );
      }
    } catch (error) {
      this.logger.error("Ошибка при очистке старых аналитических событий:", error);
    }
  }

  /**
   * Авторизация администратора.
   */
  async login(
    login: string,
    password: string
  ): Promise<{ accessToken: string }> {
    const admin = await this.adminUserRepo.findOne({
      where: { login, isActive: true },
    });

    if (!admin) {
      throw new UnauthorizedException("Неверный логин или пароль");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Неверный логин или пароль");
    }

    // Обновляем время последнего входа
    await this.adminUserRepo.update(admin.id, { lastLoginAt: new Date() });

    const payload: AdminTokenPayload = {
      sub: admin.id,
      login: admin.login,
      type: "admin",
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
   * Проверка JWT токена.
   */
  async verifyToken(token: string): Promise<AdminTokenPayload> {
    try {
      const payload = this.jwtService.verify<AdminTokenPayload>(token);
      if (payload.type !== "admin") {
        throw new UnauthorizedException("Недействительный токен");
      }
      return payload;
    } catch {
      throw new UnauthorizedException("Недействительный токен");
    }
  }

  /**
   * Получение общей статистики для дашборда.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTeachers, totalStudents, newTeachersToday, newStudentsToday] =
      await Promise.all([
        this.teacherRepo.count(),
        this.studentRepo.count(),
        this.teacherRepo.count({
          where: {
            createdAt: Between(today, new Date()),
          },
        }),
        this.studentRepo.count({
          where: {
            createdAt: Between(today, new Date()),
          },
        }),
      ]);

    return {
      totalTeachers,
      totalStudents,
      newTeachersToday,
      newStudentsToday,
    };
  }

  /**
   * Получение данных для графика регистраций.
   */
  async getRegistrationChart(
    from: Date,
    to: Date
  ): Promise<ChartDataPoint[]> {
    // Получаем учителей за период
    const teachers = await this.teacherRepo
      .createQueryBuilder("t")
      .select("DATE(t.createdAt)", "date")
      .addSelect("COUNT(*)", "count")
      .where("t.createdAt BETWEEN :from AND :to", { from, to })
      .groupBy("DATE(t.createdAt)")
      .orderBy("date", "ASC")
      .getRawMany();

    // Получаем учеников за период
    const students = await this.studentRepo
      .createQueryBuilder("s")
      .select("DATE(s.createdAt)", "date")
      .addSelect("COUNT(*)", "count")
      .where("s.createdAt BETWEEN :from AND :to", { from, to })
      .groupBy("DATE(s.createdAt)")
      .orderBy("date", "ASC")
      .getRawMany();

    // Объединяем данные (нормализуем формат даты)
    const teacherMap = new Map<string, number>();
    const studentMap = new Map<string, number>();

    // PostgreSQL DATE() может вернуть Date объект или строку в разных форматах
    const normalizeDate = (d: unknown): string => {
      if (d instanceof Date) {
        return d.toISOString().split("T")[0];
      }
      const dateStr = String(d);
      // Если уже в формате YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // Пробуем распарсить
      return new Date(dateStr).toISOString().split("T")[0];
    };

    teachers.forEach((t) => {
      const key = normalizeDate(t.date);
      teacherMap.set(key, parseInt(t.count));
    });
    students.forEach((s) => {
      const key = normalizeDate(s.date);
      studentMap.set(key, parseInt(s.count));
    });

    // Генерируем все даты в диапазоне
    const result: ChartDataPoint[] = [];
    const currentDate = new Date(from);
    const endDate = new Date(to);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      result.push({
        date: dateStr,
        teachers: teacherMap.get(dateStr) || 0,
        students: studentMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Получение статистики запросов.
   */
  async getRequestStats(from: Date, to: Date): Promise<RequestStats> {
    const stats = await this.requestLogRepo
      .createQueryBuilder("r")
      .select("COUNT(*)", "total")
      .addSelect("COUNT(*) FILTER (WHERE r.statusCode >= 400)", "errors")
      .addSelect("AVG(r.durationMs)", "avgDuration")
      .where("r.createdAt BETWEEN :from AND :to", { from, to })
      .getRawOne();

    const totalRequests = parseInt(stats.total) || 0;
    const totalErrors = parseInt(stats.errors) || 0;

    return {
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      avgDurationMs: parseFloat(stats.avgDuration) || 0,
    };
  }

  /**
   * Нормализует путь — заменяет UUID на :id для группировки.
   */
  private normalizePath(path: string): string {
    // Заменяем UUID на :id
    return path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ":id"
    );
  }

  /**
   * Получение статистики по эндпоинтам (группировка по method + нормализованный path).
   */
  async getEndpointStats(): Promise<EndpointStats[]> {
    // Получаем все логи и группируем на уровне приложения
    const logs = await this.requestLogRepo.find({
      select: ["method", "path", "statusCode", "durationMs", "createdAt"],
    });

    // Группируем по method + нормализованный path
    const grouped = new Map<
      string,
      {
        method: string;
        path: string;
        requests: number;
        errors: number;
        totalDuration: number;
        lastRequestAt: Date;
      }
    >();

    for (const log of logs) {
      const normalizedPath = this.normalizePath(log.path);
      const key = `${log.method}:${normalizedPath}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.requests++;
        if (log.statusCode >= 400) existing.errors++;
        existing.totalDuration += log.durationMs;
        if (new Date(log.createdAt) > existing.lastRequestAt) {
          existing.lastRequestAt = new Date(log.createdAt);
        }
      } else {
        grouped.set(key, {
          method: log.method,
          path: normalizedPath,
          requests: 1,
          errors: log.statusCode >= 400 ? 1 : 0,
          totalDuration: log.durationMs,
          lastRequestAt: new Date(log.createdAt),
        });
      }
    }

    // Преобразуем в массив и сортируем по времени последнего запроса
    const result: EndpointStats[] = Array.from(grouped.values())
      .map((g) => ({
        method: g.method,
        path: g.path,
        totalRequests: g.requests,
        totalErrors: g.errors,
        errorRate: g.requests > 0 ? (g.errors / g.requests) * 100 : 0,
        avgDurationMs: g.requests > 0 ? g.totalDuration / g.requests : 0,
        lastRequestAt: g.lastRequestAt.toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(b.lastRequestAt).getTime() -
          new Date(a.lastRequestAt).getTime()
      );

    return result;
  }

  /**
   * Получение логов для конкретного эндпоинта (по нормализованному пути).
   */
  async getEndpointLogs(
    method: string,
    normalizedPath: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: RequestLog[]; total: number }> {
    // Получаем все логи с данным методом и фильтруем по нормализованному пути
    const allLogs = await this.requestLogRepo.find({
      where: { method },
      order: { createdAt: "DESC" },
    });

    // Фильтруем по нормализованному пути
    const filteredLogs = allLogs.filter(
      (log) => this.normalizePath(log.path) === normalizedPath
    );

    const total = filteredLogs.length;
    const logs = filteredLogs.slice((page - 1) * limit, page * limit);

    return { logs, total };
  }

  /**
   * Получение логов запросов с ошибками.
   */
  async getErrorLogs(
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: RequestLog[]; total: number }> {
    const [logs, total] = await this.requestLogRepo.findAndCount({
      where: {
        statusCode: Between(400, 599),
      },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { logs, total };
  }

  /**
   * Получение всех логов запросов.
   */
  async getRequestLogs(
    page: number = 1,
    limit: number = 50,
    statusFilter?: "all" | "success" | "error"
  ): Promise<{ logs: RequestLog[]; total: number }> {
    const query = this.requestLogRepo.createQueryBuilder("r");

    if (statusFilter === "success") {
      query.where("r.statusCode < 400");
    } else if (statusFilter === "error") {
      query.where("r.statusCode >= 400");
    }

    const [logs, total] = await query
      .orderBy("r.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  /**
   * Получение логов с информацией о пользователе.
   */
  async getRequestLogsWithUserInfo(
    page: number = 1,
    limit: number = 50,
    statusFilter?: "all" | "success" | "error",
    method?: string,
    path?: string,
    userSearch?: string
  ): Promise<{
    logs: Array<RequestLog & { userName?: string; userUsername?: string }>;
    total: number;
  }> {
    const query = this.requestLogRepo
      .createQueryBuilder("r")
      .leftJoin("users", "u", "u.id = r.userId")
      .addSelect("u.firstName", "userFirstName")
      .addSelect("u.lastName", "userLastName")
      .addSelect("u.username", "userUsername");

    if (statusFilter === "success") {
      query.andWhere("r.statusCode < 400");
    } else if (statusFilter === "error") {
      query.andWhere("r.statusCode >= 400");
    }

    if (method && path) {
      query.andWhere("r.method = :method", { method });
      // Фильтруем по нормализованному пути
      const normalizedPath = path;
      query.andWhere(
        `REGEXP_REPLACE(r.path, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', ':id', 'gi') = :normalizedPath`,
        { normalizedPath }
      );
    }

    // Фильтрация по пользователю (userId или username)
    if (userSearch) {
      // Убираем @ если пользователь его ввёл
      const cleanUsername = userSearch.startsWith("@")
        ? userSearch.slice(1)
        : userSearch;

      // Проверяем, похоже ли на UUID
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          cleanUsername
        );

      if (isUuid) {
        // Точный поиск по userId
        query.andWhere("r.userId = :userId", { userId: cleanUsername });
      } else {
        // Поиск по username (частичное совпадение)
        query.andWhere("LOWER(u.username) LIKE LOWER(:userSearchLike)", {
          userSearchLike: `%${cleanUsername}%`,
        });
      }
    }

    const total = await query.getCount();

    const rawResults = await query
      .orderBy("r.createdAt", "DESC")
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawAndEntities();

    // Объединяем данные лога с данными пользователя
    const logs = rawResults.entities.map((log, index) => {
      const raw = rawResults.raw[index];
      const firstName = raw.userFirstName || "";
      const lastName = raw.userLastName || "";
      const userName = [firstName, lastName].filter(Boolean).join(" ") || undefined;
      return {
        ...log,
        userName,
        userUsername: raw.userUsername || undefined,
      };
    });

    return { logs, total };
  }

  /**
   * Получение статистики запросов по времени для графика.
   */
  async getRequestsChartData(
    from: Date,
    to: Date,
    interval: "minute" | "hour" | "day" = "hour"
  ): Promise<Array<{ time: string; success: number; errors: number }>> {
    let dateFormat: string;
    let dateTrunc: string;

    switch (interval) {
      case "minute":
        dateFormat = "YYYY-MM-DD HH24:MI";
        dateTrunc = "minute";
        break;
      case "hour":
        dateFormat = "YYYY-MM-DD HH24:00";
        dateTrunc = "hour";
        break;
      case "day":
      default:
        dateFormat = "YYYY-MM-DD";
        dateTrunc = "day";
        break;
    }

    const result = await this.requestLogRepo
      .createQueryBuilder("r")
      .select(`TO_CHAR(DATE_TRUNC('${dateTrunc}', r."createdAt"), '${dateFormat}')`, "time")
      .addSelect("COUNT(*) FILTER (WHERE r.statusCode < 400)", "success")
      .addSelect("COUNT(*) FILTER (WHERE r.statusCode >= 400)", "errors")
      .where("r.createdAt BETWEEN :from AND :to", { from, to })
      .groupBy(`DATE_TRUNC('${dateTrunc}', r."createdAt")`)
      .orderBy(`DATE_TRUNC('${dateTrunc}', r."createdAt")`, "ASC")
      .getRawMany();

    return result.map((r) => ({
      time: r.time,
      success: parseInt(r.success) || 0,
      errors: parseInt(r.errors) || 0,
    }));
  }

  /**
   * Получение аналитических событий.
   */
  async getAnalyticsEvents(
    page: number = 1,
    limit: number = 50,
    eventName?: string
  ): Promise<{ events: AnalyticsEvent[]; total: number }> {
    const query = this.analyticsEventRepo.createQueryBuilder("e");

    if (eventName) {
      query.where("e.eventName = :eventName", { eventName });
    }

    const [events, total] = await query
      .orderBy("e.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { events, total };
  }

  /**
   * Получение топ событий аналитики.
   */
  async getTopEvents(
    from: Date,
    to: Date,
    limit: number = 10
  ): Promise<{ eventName: string; category: string | null; count: number }[]> {
    const result = await this.analyticsEventRepo
      .createQueryBuilder("e")
      .select("e.eventName", "eventName")
      .addSelect("e.category", "category")
      .addSelect("COUNT(*)", "count")
      .where("e.createdAt BETWEEN :from AND :to", { from, to })
      .groupBy("e.eventName")
      .addGroupBy("e.category")
      .orderBy("count", "DESC")
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({
      eventName: r.eventName,
      category: r.category,
      count: parseInt(r.count),
    }));
  }

  /**
   * Создание нового администратора.
   */
  async createAdmin(login: string, password: string): Promise<AdminUser> {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = this.adminUserRepo.create({ login, passwordHash });
    return this.adminUserRepo.save(admin);
  }

  /**
   * Сохранение лога запроса.
   */
  async logRequest(data: Partial<RequestLog>): Promise<void> {
    const log = this.requestLogRepo.create(data);
    await this.requestLogRepo.save(log);
  }

  /**
   * Сохранение аналитического события.
   */
  async trackEvent(data: Partial<AnalyticsEvent>): Promise<void> {
    const event = this.analyticsEventRepo.create(data);
    await this.analyticsEventRepo.save(event);
  }
}
