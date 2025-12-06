import { Logger } from '@nestjs/common';
export declare class LoggerService extends Logger {
    private requestId?;
    setRequestId(requestId: string): void;
    private formatMessage;
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
    verbose(message: string, context?: string): void;
    logRequest(method: string, url: string, userId?: string): void;
    logResponse(method: string, url: string, statusCode: number, duration: number): void;
    logAuth(action: string, telegramId?: number, role?: string): void;
    logError(error: Error, context?: string): void;
}
