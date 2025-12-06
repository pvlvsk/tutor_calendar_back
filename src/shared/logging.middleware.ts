/**
 * Middleware для логирования HTTP запросов
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = nanoid(8);
    const startTime = Date.now();
    const { method, originalUrl } = req;

    (req as any).requestId = requestId;

    const userId = (req as any).user?.sub;
    const userInfo = userId ? ` user=${userId}` : '';

    this.logger.log(`→ ${method} ${originalUrl}${userInfo} [${requestId}]`);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      const message = `← ${method} ${originalUrl} ${statusCode} ${duration}ms [${requestId}]`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}

