import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { InitDto, RegisterDto, SelectRoleDto, AddRoleDto, AcceptInvitationDto, JoinByReferralDto, ActivateBetaDto } from './auth.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('init')
  @ApiOperation({ summary: 'Инициализация - проверка пользователя' })
  init(@Body() dto: InitDto) {
    return this.authService.init(dto.initData)
  }

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.initData, dto.role)
  }

  @Post('select-role')
  @ApiOperation({ summary: 'Выбор роли (для пользователей с несколькими ролями)' })
  selectRole(@Body() dto: SelectRoleDto) {
    return this.authService.selectRole(dto.initData, dto.role)
  }

  @Post('add-role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить новую роль к существующему аккаунту' })
  addRole(@Request() req: any, @Body() dto: AddRoleDto) {
    return this.authService.addRole(req.user.sub, dto.role)
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Принять разовое приглашение (устаревший метод)' })
  acceptInvitation(@Request() req: any, @Body() dto: AcceptInvitationDto) {
    const userId = req.user?.sub
    return this.authService.acceptInvitation(dto.initData || null, dto.invitationToken, userId)
  }

  @Post('join')
  @ApiOperation({ summary: 'Присоединиться по постоянной ссылке учителя или ученика' })
  joinByReferral(@Body() dto: JoinByReferralDto) {
    return this.authService.joinByReferral(dto.initData, dto.referralCode)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить информацию о текущем пользователе' })
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.sub, req.user.role)
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить JWT токен' })
  refresh(@Request() req: any) {
    return this.authService.refresh(req.user.sub, req.user.role)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Выход из системы' })
  logout() {
    return { message: 'Вы успешно вышли из системы' }
  }

  @Post('activate-beta')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Активировать статус бета-тестера по коду' })
  activateBeta(@Request() req: any, @Body() dto: ActivateBetaDto) {
    return this.authService.activateBetaTester(req.user.sub, dto.betaCode)
  }

  @Get('beta-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Проверить статус бета-тестера' })
  getBetaStatus(@Request() req: any) {
    return {
      isBetaTester: req.user.isBetaTester || false,
    }
  }
}
