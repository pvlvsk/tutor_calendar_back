/**
 * Сервис логирования
 * Обёртка над NestJS Logger с дополнительным форматированием
 */

import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends Logger {
  private requestId?: string;

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  private formatMessage(message: string): string {
    const prefix = this.requestId ? `[${this.requestId}] ` : '';
    return `${prefix}${message}`;
  }

  log(message: string, context?: string) {
    super.log(this.formatMessage(message), context);
  }

  error(message: string, trace?: string, context?: string) {
    super.error(this.formatMessage(message), trace, context);
  }

  warn(message: string, context?: string) {
    super.warn(this.formatMessage(message), context);
  }

  debug(message: string, context?: string) {
    super.debug(this.formatMessage(message), context);
  }

  verbose(message: string, context?: string) {
    super.verbose(this.formatMessage(message), context);
  }

  logRequest(method: string, url: string, userId?: string) {
    const userInfo = userId ? ` user=${userId}` : '';
    this.log(`→ ${method} ${url}${userInfo}`, 'HTTP');
  }

  logResponse(method: string, url: string, statusCode: number, duration: number) {
    const level = statusCode >= 400 ? 'warn' : 'log';
    const message = `← ${method} ${url} ${statusCode} ${duration}ms`;
    
    if (level === 'warn') {
      this.warn(message, 'HTTP');
    } else {
      this.log(message, 'HTTP');
    }
  }

  logAuth(action: string, telegramId?: number, role?: string) {
    const info = [
      telegramId ? `tg=${telegramId}` : '',
      role ? `role=${role}` : '',
    ].filter(Boolean).join(' ');
    
    this.log(`${action} ${info}`, 'Auth');
  }

  logError(error: Error, context?: string) {
    this.error(
      `${error.name}: ${error.message}`,
      error.stack,
      context,
    );
  }
}

