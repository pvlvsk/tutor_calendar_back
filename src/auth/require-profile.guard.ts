import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";

/**
 * Гард, который требует наличия profileId в JWT.
 * Применяется к контроллерам, работающим с данными профиля (teacher, student, parent).
 * Защищает от ситуации, когда profileId=undefined → TypeORM возвращает чужие данные.
 */
@Injectable()
export class RequireProfileGuard implements CanActivate {
  private readonly logger = new Logger(RequireProfileGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.profileId) {
      this.logger.warn(
        `Blocked request without profileId: user=${user?.sub} role=${user?.role} path=${request.url}`
      );
      throw new ForbiddenException(
        "PROFILE_REQUIRED: токен не содержит profileId, требуется повторная авторизация"
      );
    }

    return true;
  }
}
