import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AdminService } from "./admin.service";

/**
 * Guard для защиты админских эндпоинтов.
 * Проверяет JWT токен в заголовке Authorization.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Требуется авторизация");
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.adminService.verifyToken(token);
      request.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Недействительный токен");
    }
  }
}
