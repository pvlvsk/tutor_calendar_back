import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";

/**
 * Middleware для логирования всех HTTP запросов.
 * Записывает метод, путь, статус, время выполнения и ошибки.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private adminService: AdminService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, body, headers } = req;

    // Получаем IP адрес
    const clientIp =
      (headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      null;

    // User-Agent
    const userAgent = headers["user-agent"] || null;

    // Тело запроса (обрезаем для безопасности и экономии места)
    let requestBody: string | null = null;
    if (["POST", "PUT", "PATCH"].includes(method) && body) {
      try {
        const bodyStr = JSON.stringify(body);
        // Обрезаем до 1000 символов и скрываем пароли
        requestBody = bodyStr
          .replace(/"password"\s*:\s*"[^"]*"/g, '"password":"***"')
          .substring(0, 1000);
      } catch {
        requestBody = "[не удалось сериализовать]";
      }
    }

    // Перехватываем завершение ответа
    res.on("finish", async () => {
      const durationMs = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Пропускаем health check и статику
      if (
        originalUrl.includes("/health") ||
        originalUrl.includes("/favicon") ||
        originalUrl.startsWith("/assets")
      ) {
        return;
      }

      // Извлекаем userId и роль из JWT токена (если есть)
      let userId: string | null = null;
      let userRole: string | null = null;

      const authHeader = headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          const payload = JSON.parse(
            Buffer.from(token.split(".")[1], "base64").toString()
          );
          userId = payload.sub || null;
          userRole = payload.role || null;
        } catch {
          // Игнорируем ошибки парсинга токена
        }
      }

      // Получаем сообщение об ошибке из res.locals (если установлено exception filter)
      const errorMessage = (res as any).errorMessage || null;
      const errorStack = (res as any).errorStack || null;

      try {
        await this.adminService.logRequest({
          method,
          path: originalUrl.split("?")[0], // Убираем query параметры
          statusCode,
          durationMs,
          userId,
          userRole,
          clientIp,
          userAgent,
          requestBody,
          errorMessage,
          errorStack,
        });
      } catch (err) {
        // Не блокируем запрос если логирование упало
        console.error("Ошибка логирования запроса:", err);
      }
    });

    next();
  }
}
