import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { TeacherService } from "./teacher.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("teachers")
@Controller("teachers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("teacher")
@ApiBearerAuth()
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  @Get("me")
  @ApiOperation({ summary: "Получить профиль учителя" })
  getProfile(@Request() req: any) {
    return this.teacherService.getProfile(req.user.profileId);
  }

  @Get("me/invite-link")
  @ApiOperation({
    summary: "Получить постоянную ссылку для приглашения учеников",
  })
  getInviteLink(@Request() req: any) {
    return this.teacherService.getInviteLink(req.user.profileId);
  }

  @Patch("me")
  @ApiOperation({ summary: "Обновить профиль учителя" })
  updateProfile(
    @Request() req: any,
    @Body() body: { displayName?: string; bio?: string }
  ) {
    return this.teacherService.updateProfile(req.user.profileId, body);
  }

  @Get("me/subjects")
  @ApiOperation({ summary: "Получить список предметов" })
  getSubjects(@Request() req: any) {
    return this.teacherService.getSubjects(req.user.profileId);
  }

  @Post("me/subjects")
  @ApiOperation({ summary: "Создать новый предмет" })
  createSubject(
    @Request() req: any,
    @Body() body: { name: string; code?: string; colorHex: string }
  ) {
    return this.teacherService.createSubject(req.user.profileId, body);
  }

  @Patch("me/subjects/:subjectId")
  @ApiOperation({ summary: "Обновить предмет" })
  updateSubject(
    @Request() req: any,
    @Param("subjectId") subjectId: string,
    @Body() body: { name?: string; colorHex?: string }
  ) {
    return this.teacherService.updateSubject(
      req.user.profileId,
      subjectId,
      body
    );
  }

  @Delete("me/subjects/:subjectId")
  @ApiOperation({ summary: "Удалить/архивировать предмет" })
  deleteSubject(@Request() req: any, @Param("subjectId") subjectId: string) {
    return this.teacherService.deleteSubject(req.user.profileId, subjectId);
  }

  @Get("me/subjects/archived")
  @ApiOperation({ summary: "Получить архивированные предметы" })
  getArchivedSubjects(@Request() req: any) {
    return this.teacherService.getArchivedSubjects(req.user.profileId);
  }

  @Post("me/subjects/:subjectId/restore")
  @ApiOperation({ summary: "Восстановить архивированный предмет" })
  restoreSubject(@Request() req: any, @Param("subjectId") subjectId: string) {
    return this.teacherService.restoreSubject(req.user.profileId, subjectId);
  }

  @Get("me/students")
  @ApiOperation({ summary: "Получить список учеников" })
  getStudents(@Request() req: any) {
    return this.teacherService.getStudents(req.user.profileId);
  }

  @Post("me/students/invitations")
  @ApiOperation({
    summary: "Создать приглашение для ученика (ссылка для регистрации)",
  })
  createStudentInvitation(@Request() req: any) {
    return this.teacherService.createStudentInvitation(req.user.profileId);
  }

  @Get("me/students/:studentId")
  @ApiOperation({ summary: "Получить детали ученика" })
  getStudentDetails(
    @Request() req: any,
    @Param("studentId") studentId: string
  ) {
    return this.teacherService.getStudentDetails(req.user.profileId, studentId);
  }

  @Patch("me/students/:studentId")
  @ApiOperation({ summary: "Обновить данные ученика" })
  updateStudent(
    @Request() req: any,
    @Param("studentId") studentId: string,
    @Body() body: { customFields: Record<string, string> }
  ) {
    return this.teacherService.updateStudentCustomFields(
      req.user.profileId,
      studentId,
      body.customFields
    );
  }

  @Delete("me/students/:studentId")
  @ApiOperation({ summary: "Удалить связь с учеником" })
  deleteStudent(@Request() req: any, @Param("studentId") studentId: string) {
    return this.teacherService.deleteStudent(req.user.profileId, studentId);
  }

  @Post("me/students/:studentId/parents/invitations")
  @ApiOperation({ summary: "Создать приглашение для родителя ученика" })
  createParentInvitation(
    @Request() req: any,
    @Param("studentId") studentId: string
  ) {
    return this.teacherService.createParentInvitation(
      req.user.profileId,
      studentId
    );
  }

  @Get("me/students/:studentId/parents")
  @ApiOperation({ summary: "Получить родителей ученика" })
  getStudentParents(
    @Request() req: any,
    @Param("studentId") studentId: string
  ) {
    return this.teacherService.getStudentParents(req.user.profileId, studentId);
  }

  @Patch("me/students/:studentId/parents/:parentId")
  @ApiOperation({ summary: "Обновить настройки уведомлений родителя" })
  updateParentNotifications(
    @Request() req: any,
    @Param("studentId") studentId: string,
    @Param("parentId") parentId: string,
    @Body() body: { notificationsEnabled: boolean }
  ) {
    return this.teacherService.updateParentNotifications(
      req.user.profileId,
      studentId,
      parentId,
      body.notificationsEnabled
    );
  }

  @Get("me/lessons")
  @ApiOperation({ summary: "Получить уроки за период" })
  @ApiQuery({
    name: "from",
    required: true,
    description: "Начало периода (ISO date)",
    example: "2025-01-01",
  })
  @ApiQuery({
    name: "to",
    required: true,
    description: "Конец периода (ISO date)",
    example: "2025-12-31",
  })
  @ApiQuery({ name: "subjectId", required: false })
  @ApiQuery({ name: "studentId", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["planned", "done", "cancelled"],
  })
  getLessons(
    @Request() req: any,
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("subjectId") subjectId?: string,
    @Query("studentId") studentId?: string,
    @Query("status") status?: string
  ) {
    return this.teacherService.getLessons(req.user.profileId, from, to, {
      subjectId,
      studentId,
      status,
    });
  }

  @Post("me/lessons")
  @ApiOperation({ summary: "Создать урок" })
  createLesson(@Request() req: any, @Body() body: any) {
    return this.teacherService.createLesson(req.user.profileId, body);
  }

  @Get("me/lessons/:lessonId")
  @ApiOperation({ summary: "Получить детали урока" })
  getLessonDetails(@Request() req: any, @Param("lessonId") lessonId: string) {
    return this.teacherService.getLessonDetails(req.user.profileId, lessonId);
  }

  @Patch("me/lessons/:lessonId")
  @ApiOperation({ summary: "Обновить урок" })
  @ApiQuery({
    name: "applyToSeries",
    required: false,
    enum: ["this", "future", "all"],
  })
  updateLesson(
    @Request() req: any,
    @Param("lessonId") lessonId: string,
    @Body() body: any,
    @Query("applyToSeries") applyToSeries?: string
  ) {
    return this.teacherService.updateLesson(
      req.user.profileId,
      lessonId,
      body,
      applyToSeries
    );
  }

  @Delete("me/lessons/:lessonId")
  @ApiOperation({ summary: "Удалить урок" })
  @ApiQuery({
    name: "applyToSeries",
    required: false,
    enum: ["this", "future", "all"],
  })
  deleteLesson(
    @Request() req: any,
    @Param("lessonId") lessonId: string,
    @Query("applyToSeries") applyToSeries?: string
  ) {
    return this.teacherService.deleteLesson(
      req.user.profileId,
      lessonId,
      applyToSeries
    );
  }

  @Post("me/lessons/:lessonId/students")
  @ApiOperation({ summary: "Добавить ученика на урок" })
  addStudentToLesson(
    @Request() req: any,
    @Param("lessonId") lessonId: string,
    @Body() body: { studentId: string; priceRub?: number }
  ) {
    return this.teacherService.addStudentToLesson(
      req.user.profileId,
      lessonId,
      body.studentId,
      body.priceRub
    );
  }

  @Delete("me/lessons/:lessonId/students/:studentId")
  @ApiOperation({ summary: "Удалить ученика с урока" })
  removeStudentFromLesson(
    @Request() req: any,
    @Param("lessonId") lessonId: string,
    @Param("studentId") studentId: string
  ) {
    return this.teacherService.removeStudentFromLesson(
      req.user.profileId,
      lessonId,
      studentId
    );
  }

  @Patch("me/lessons/:lessonId/students/:studentId")
  @ApiOperation({ summary: "Обновить данные ученика на уроке" })
  updateLessonStudent(
    @Request() req: any,
    @Param("lessonId") lessonId: string,
    @Param("studentId") studentId: string,
    @Body() body: { paymentStatus?: "paid" | "unpaid" }
  ) {
    return this.teacherService.updateLessonStudent(
      req.user.profileId,
      lessonId,
      studentId,
      body
    );
  }

  @Patch("me/lessons/:lessonId/complete")
  @ApiOperation({ summary: "Отметить урок как проведённый" })
  completeLesson(
    @Request() req: any,
    @Param("lessonId") lessonId: string,
    @Body()
    body: {
      students: Array<{
        studentId: string;
        attendance: "attended" | "missed";
        rating?: number;
        paymentStatus?: "paid" | "unpaid";
        useSubscription?: boolean; // Списать с абонемента
      }>;
    }
  ) {
    return this.teacherService.completeLesson(
      req.user.profileId,
      lessonId,
      body.students
    );
  }

  @Patch("me/lessons/:lessonId/students/bulk")
  @ApiOperation({ summary: "Массовое обновление учеников на уроке" })
  bulkUpdateLessonStudents(
    @Request() req: any,
    @Param("lessonId") lessonId: string,
    @Body()
    body: {
      action: "set_attendance" | "set_rating" | "set_payment";
      value: string | number;
    }
  ) {
    return this.teacherService.bulkUpdateLessonStudents(
      req.user.profileId,
      lessonId,
      body.action,
      body.value
    );
  }

  @Get("me/lesson-series")
  @ApiOperation({ summary: "Получить серии повторяющихся уроков" })
  getLessonSeries(@Request() req: any) {
    return this.teacherService.getLessonSeries(req.user.profileId);
  }

  @Get("me/students/:studentId/lessons")
  @ApiOperation({ summary: "Получить уроки конкретного ученика" })
  getStudentLessons(
    @Request() req: any,
    @Param("studentId") studentId: string,
    @Query() filters: any
  ) {
    return this.teacherService.getStudentLessons(
      req.user.profileId,
      studentId,
      filters
    );
  }

  @Get("me/students/:studentId/debt")
  @ApiOperation({ summary: "Получить информацию о долге ученика" })
  getStudentDebt(@Request() req: any, @Param("studentId") studentId: string) {
    return this.teacherService.getStudentDebtDetails(
      req.user.profileId,
      studentId
    );
  }

  @Get("me/students/:studentId/stats")
  @ApiOperation({
    summary: "Получить краткую статистику ученика (для карточки)",
  })
  getStudentStats(@Request() req: any, @Param("studentId") studentId: string) {
    return this.teacherService.getStudentCardStats(
      req.user.profileId,
      studentId
    );
  }

  @Get("me/students/:studentId/stats/detailed")
  @ApiOperation({ summary: "Получить детальную статистику ученика" })
  getStudentDetailedStats(
    @Request() req: any,
    @Param("studentId") studentId: string
  ) {
    return this.teacherService.getStudentDetailedStats(
      req.user.profileId,
      studentId
    );
  }

  // ============================================
  // АБОНЕМЕНТЫ
  // ============================================

  @Get("me/students/:studentId/subscription")
  @ApiOperation({ summary: "Получить абонемент ученика" })
  getStudentSubscription(
    @Request() req: any,
    @Param("studentId") studentId: string
  ) {
    return this.teacherService.getStudentSubscription(
      req.user.profileId,
      studentId
    );
  }

  @Post("me/students/:studentId/subscription")
  @ApiOperation({ summary: "Создать абонемент для ученика" })
  createSubscription(
    @Request() req: any,
    @Param("studentId") studentId: string,
    @Body()
    body: {
      type: "lessons" | "date";
      totalLessons?: number;
      expiresAt?: string;
      name?: string;
    }
  ) {
    return this.teacherService.createSubscription(
      req.user.profileId,
      studentId,
      body
    );
  }

  @Delete("me/subscriptions/:subscriptionId")
  @ApiOperation({ summary: "Удалить абонемент (мягкое удаление)" })
  deleteSubscription(
    @Request() req: any,
    @Param("subscriptionId") subscriptionId: string
  ) {
    return this.teacherService.deleteSubscription(
      req.user.profileId,
      subscriptionId
    );
  }

  @Post("me/subscriptions/:subscriptionId/restore")
  @ApiOperation({ summary: "Восстановить удалённый абонемент" })
  restoreSubscription(
    @Request() req: any,
    @Param("subscriptionId") subscriptionId: string
  ) {
    return this.teacherService.restoreSubscription(
      req.user.profileId,
      subscriptionId
    );
  }

  @Get("me/students/:studentId/has-subscription")
  @ApiOperation({ summary: "Проверить есть ли активный абонемент у ученика" })
  hasActiveSubscription(
    @Request() req: any,
    @Param("studentId") studentId: string
  ) {
    return this.teacherService.hasActiveSubscription(
      req.user.profileId,
      studentId
    );
  }

  @Get("me/students/:studentId/subscriptions/archived")
  @ApiOperation({ summary: "Получить архивные (удалённые/истёкшие) абонементы ученика" })
  getArchivedSubscriptions(
    @Request() req: any,
    @Param("studentId") studentId: string
  ) {
    return this.teacherService.getArchivedSubscriptions(
      req.user.profileId,
      studentId
    );
  }
}
