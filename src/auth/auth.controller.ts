import { Controller, Post, Get, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { EmailAuthService } from './email-auth.service'
import { MaxAuthService } from './max-auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { InitDto, RegisterDto, SelectRoleDto, AddRoleDto, AcceptInvitationDto, JoinByReferralDto, ActivateBetaDto } from './auth.dto'
import { RegisterEmailDto, LoginEmailDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, LinkEmailDto, LinkTelegramDto, VerifyCodeDto, ResendCodeDto } from './email-auth.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailAuthService: EmailAuthService,
    private maxAuthService: MaxAuthService,
  ) {}

  @Post('init')
  @ApiOperation({ summary: 'Инициализация - проверка пользователя' })
  init(@Body() dto: InitDto) {
    return this.authService.init(dto.initData)
  }

  /**
   * Регистрация через Telegram initData.
   * Доступна только в dev-режиме (для E2E тестов и отладки).
   */
  @Post('register')
  @ApiOperation({ summary: 'Регистрация через TG initData (dev only)' })
  register(@Body() dto: RegisterDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('TG_REGISTER_DISABLED')
    }
    return this.authService.register(dto.initData, dto.role, dto.referralSource)
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

  @Post('join-web')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Присоединиться по ссылке приглашения (веб-пользователь)' })
  joinByReferralWeb(@Request() req: any, @Body() body: { referralCode: string }) {
    return this.authService.joinByReferralWeb(req.user.sub, body.referralCode)
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

  @Post('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Мягкое удаление аккаунта (можно восстановить в течение 7 дней)' })
  deleteAccount(@Request() req: any) {
    return this.authService.deleteAccount(req.user.sub)
  }

  @Post('restore-account')
  @ApiOperation({ summary: 'Восстановить удалённый аккаунт' })
  restoreAccount(@Body() dto: InitDto) {
    return this.authService.restoreAccount(dto.initData)
  }

  // ============================================
  // EMAIL AUTH ENDPOINTS
  // ============================================

  @Post('register-email')
  @ApiOperation({ summary: 'Регистрация по email + пароль' })
  registerEmail(@Body() dto: RegisterEmailDto) {
    return this.emailAuthService.registerEmail(
      dto.email, dto.password, dto.firstName, dto.role, dto.lastName, dto.referralSource,
    )
  }

  @Post('login-email')
  @ApiOperation({ summary: 'Вход по email + пароль' })
  loginEmail(@Body() dto: LoginEmailDto) {
    return this.emailAuthService.loginEmail(dto.email, dto.password)
  }

  @Get('me-web')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя (для веб-версии)' })
  getMeWeb(@Request() req: any) {
    return this.emailAuthService.getMe(req.user.sub)
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Подтверждение email по 4-значному коду (завершение регистрации)' })
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.emailAuthService.verifyCode(dto.userId, dto.code, dto.role)
  }

  @Post('resend-code')
  @ApiOperation({ summary: 'Переотправить код верификации' })
  resendCode(@Body() dto: ResendCodeDto) {
    return this.emailAuthService.resendCode(dto.userId)
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Подтверждение email по токену (устаревший метод)' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailAuthService.verifyEmail(dto.token)
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Запрос сброса пароля (отправка email)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.emailAuthService.forgotPassword(dto.email)
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Установка нового пароля по токену' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.emailAuthService.resetPassword(dto.token, dto.password)
  }

  @Post('link-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Привязать email к текущему аккаунту (для TG-пользователей)' })
  linkEmail(@Request() req: any, @Body() dto: LinkEmailDto) {
    return this.emailAuthService.linkEmail(req.user.sub, dto.email, dto.password)
  }

  @Post('link-telegram')
  @ApiOperation({ summary: 'Привязать Telegram к email-аккаунту (из Mini App)' })
  linkTelegram(@Body() dto: LinkTelegramDto) {
    return this.emailAuthService.linkTelegram(dto.initData, dto.email, dto.password)
  }

  @Post('auto-link-telegram')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Автоматически привязать Telegram к аккаунту (из Mini App после email-логина)' })
  autoLinkTelegram(@Request() req: any, @Body() body: { initData: string }) {
    return this.emailAuthService.autoLinkTelegram(req.user.sub, body.initData)
  }

  @Post('auto-link-max')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Автоматически привязать MAX к аккаунту (из Mini App после email-логина)' })
  autoLinkMax(@Request() req: any, @Body() body: { initData: string }) {
    return this.emailAuthService.autoLinkMax(req.user.sub, body.initData)
  }

  // ============================================
  // MAX MESSENGER AUTH
  // ============================================

  @Post('init-max')
  @ApiOperation({ summary: 'Инициализация через MAX Mini App' })
  initMax(@Body() body: { initData: string }) {
    return this.maxAuthService.initMax(body.initData)
  }

  /**
   * @deprecated Регистрация через MAX initData отключена.
   * Используйте POST /auth/register-email для регистрации.
   */
  // @Post('register-max')
  // registerMax(@Body() body: { initData: string; role: string }) {
  //   return this.maxAuthService.registerMax(body.initData, body.role as 'teacher' | 'student' | 'parent')
  // }

  @Post('link-max')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Привязать MAX аккаунт к существующему пользователю' })
  linkMax(@Request() req: any, @Body() body: { initData: string }) {
    return this.maxAuthService.linkMax(req.user.sub, body.initData)
  }
}
