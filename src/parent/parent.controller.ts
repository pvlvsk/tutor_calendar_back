import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { ParentService } from './parent.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RequireProfileGuard } from '../auth/require-profile.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@ApiTags('parents')
@Controller('parents')
@UseGuards(JwtAuthGuard, RequireProfileGuard, RolesGuard)
@Roles('parent')
@ApiBearerAuth()
export class ParentController {
  constructor(private parentService: ParentService) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить профиль родителя' })
  getProfile(@Request() req: any) {
    return this.parentService.getProfile(req.user.profileId)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль родителя' })
  updateProfile(@Request() req: any, @Body() body: { customFields: Record<string, string> }) {
    return this.parentService.updateProfile(req.user.profileId, body.customFields)
  }

  @Get('me/children')
  @ApiOperation({ summary: 'Получить список детей' })
  getChildren(@Request() req: any) {
    return this.parentService.getChildren(req.user.profileId)
  }

  @Get('me/children/:childId')
  @ApiOperation({ summary: 'Получить детали ребенка' })
  getChildDetails(@Request() req: any, @Param('childId') childId: string) {
    return this.parentService.getChildDetails(req.user.profileId, childId)
  }

  @Get('me/children/:childId/teachers')
  @ApiOperation({ summary: 'Получить учителей ребенка' })
  getChildTeachers(@Request() req: any, @Param('childId') childId: string) {
    return this.parentService.getChildTeachers(req.user.profileId, childId)
  }

  @Get('me/children/:childId/teachers/:teacherId')
  @ApiOperation({ summary: 'Получить информацию об учителе ребенка' })
  getChildTeacherDetails(@Request() req: any, @Param('childId') childId: string, @Param('teacherId') teacherId: string) {
    return this.parentService.getChildTeacherDetails(req.user.profileId, childId, teacherId)
  }

  @Get('me/children/:childId/lessons')
  @ApiOperation({ summary: 'Получить уроки ребенка за период' })
  @ApiQuery({ name: 'from', required: true, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: true, example: '2025-12-31' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['planned', 'done', 'cancelled'] })
  getChildLessons(
    @Request() req: any,
    @Param('childId') childId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('subjectId') subjectId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string
  ) {
    return this.parentService.getChildLessons(req.user.profileId, childId, from, to, { subjectId, teacherId, status })
  }

  @Get('me/children/:childId/lessons/:lessonId')
  @ApiOperation({ summary: 'Получить детали урока ребенка' })
  getChildLessonDetails(@Request() req: any, @Param('childId') childId: string, @Param('lessonId') lessonId: string) {
    return this.parentService.getChildLessonDetails(req.user.profileId, childId, lessonId)
  }

  @Get('me/children/:childId/stats')
  @ApiOperation({ summary: 'Получить статистику ребенка' })
  getChildStats(@Request() req: any, @Param('childId') childId: string) {
    return this.parentService.getChildStatsDetailed(req.user.profileId, childId)
  }

  @Get('me/children/:childId/debt')
  @ApiOperation({ summary: 'Получить информацию о долге за ребенка' })
  getChildDebt(@Request() req: any, @Param('childId') childId: string) {
    return this.parentService.getChildDebt(req.user.profileId, childId)
  }

  @Get('me/notification-settings')
  @ApiOperation({ summary: 'Получить настройки уведомлений' })
  getNotificationSettings(@Request() req: any) {
    return this.parentService.getNotificationSettings(req.user.profileId)
  }

  @Patch('me/notification-settings')
  @ApiOperation({ summary: 'Обновить настройки уведомлений для всех детей' })
  updateNotificationSettings(@Request() req: any, @Body() body: { children: Array<{ childId: string; notificationsEnabled: boolean }> }) {
    return this.parentService.updateNotificationSettings(req.user.profileId, body.children)
  }

  @Patch('me/children/:childId/notifications')
  @ApiOperation({ summary: 'Обновить уведомления для конкретного ребенка' })
  updateChildNotifications(@Request() req: any, @Param('childId') childId: string, @Body() body: { notificationsEnabled: boolean }) {
    return this.parentService.updateChildNotifications(req.user.profileId, childId, body.notificationsEnabled)
  }
}
