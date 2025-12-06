import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { StudentService } from './student.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard, Roles } from '../auth/roles.guard'

@ApiTags('students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
@ApiBearerAuth()
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить профиль ученика' })
  getProfile(@Request() req: any) {
    return this.studentService.getProfile(req.user.profileId)
  }

  @Get('me/parent-invite-link')
  @ApiOperation({ summary: 'Получить ссылку для приглашения родителей' })
  getParentInviteLink(@Request() req: any) {
    return this.studentService.getParentInviteLink(req.user.profileId)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль ученика' })
  updateProfile(@Request() req: any, @Body() body: { customFields: Record<string, string> }) {
    return this.studentService.updateProfile(req.user.profileId, body.customFields)
  }

  @Get('me/teachers')
  @ApiOperation({ summary: 'Получить список учителей' })
  getTeachers(@Request() req: any) {
    return this.studentService.getTeachers(req.user.profileId)
  }

  @Get('me/teachers/:teacherId')
  @ApiOperation({ summary: 'Получить информацию об учителе' })
  getTeacherDetails(@Request() req: any, @Param('teacherId') teacherId: string) {
    return this.studentService.getTeacherDetails(req.user.profileId, teacherId)
  }

  @Get('me/lessons')
  @ApiOperation({ summary: 'Получить уроки за период' })
  @ApiQuery({ name: 'from', required: true, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: true, example: '2025-12-31' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['planned', 'done', 'cancelled'] })
  getLessons(
    @Request() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('subjectId') subjectId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string
  ) {
    return this.studentService.getLessons(req.user.profileId, from, to, { subjectId, teacherId, status })
  }

  @Get('me/lessons/:lessonId')
  @ApiOperation({ summary: 'Получить детали урока' })
  getLessonDetails(@Request() req: any, @Param('lessonId') lessonId: string) {
    return this.studentService.getLessonDetails(req.user.profileId, lessonId)
  }

  @Patch('me/lessons/:lessonId')
  @ApiOperation({ summary: 'Обновить заметки к уроку' })
  updateLessonNotes(@Request() req: any, @Param('lessonId') lessonId: string, @Body() body: any) {
    return this.studentService.updateLessonNotes(req.user.profileId, lessonId, body)
  }

  @Post('me/lessons/:lessonId/cancel')
  @ApiOperation({ summary: 'Отменить урок (учеником)' })
  cancelLesson(@Request() req: any, @Param('lessonId') lessonId: string) {
    return this.studentService.cancelLesson(req.user.profileId, lessonId)
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Получить статистику ученика' })
  getStats(@Request() req: any) {
    return this.studentService.getStats(req.user.profileId)
  }

  @Get('me/stats/teacher/:teacherId')
  @ApiOperation({ summary: 'Получить статистику с конкретным учителем' })
  getStatsWithTeacher(@Request() req: any, @Param('teacherId') teacherId: string) {
    return this.studentService.getStatsWithTeacher(req.user.profileId, teacherId)
  }

  @Get('me/notification-settings')
  @ApiOperation({ summary: 'Получить настройки уведомлений' })
  getNotificationSettings(@Request() req: any) {
    return this.studentService.getNotificationSettings(req.user.profileId)
  }

  @Patch('me/notification-settings')
  @ApiOperation({ summary: 'Обновить настройки уведомлений' })
  updateNotificationSettings(@Request() req: any, @Body() body: any) {
    return this.studentService.updateNotificationSettings(req.user.profileId, body)
  }
}
