import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name)

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    })
  }

  async validate(payload: any) {
    if (!payload.sub) {
      this.logger.warn('JWT missing sub (userId)')
      throw new UnauthorizedException('INVALID_TOKEN')
    }

    if (!payload.profileId) {
      this.logger.warn(`JWT without profileId: user=${payload.sub} role=${payload.role}`)
    }

    return {
      sub: payload.sub,
      telegramId: payload.telegramId,
      role: payload.role,
      profileId: payload.profileId || null,
      isBetaTester: payload.isBetaTester || false,
    }
  }
}

