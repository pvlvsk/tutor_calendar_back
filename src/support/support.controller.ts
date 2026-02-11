import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SupportService } from "./support.service";
import { CreateSupportMessageDto, CreateLandingSupportMessageDto } from "./support.dto";

@ApiTags("support")
@Controller("support")
export class SupportController {
  constructor(private supportService: SupportService) {}

  /**
   * Отправить сообщение с лендинга (без авторизации)
   */
  @Post("landing-message")
  @ApiOperation({ summary: "Отправить сообщение с лендинга (публичный)" })
  async createLandingMessage(@Body() dto: CreateLandingSupportMessageDto) {
    await this.supportService.createLandingMessage(
      dto.name,
      dto.message,
      dto.contact
    );
    return { success: true, message: "Сообщение отправлено" };
  }

  /**
   * Отправить сообщение в поддержку
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Отправить сообщение в поддержку" })
  async createMessage(@Request() req: any, @Body() dto: CreateSupportMessageDto) {
    const message = await this.supportService.createMessage(
      req.user.sub,
      dto.subject,
      dto.message
    );
    return {
      success: true,
      message: "Сообщение отправлено",
      id: message.id,
    };
  }

  /**
   * Получить свои сообщения в поддержку
   */
  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить свои сообщения в поддержку" })
  async getMyMessages(@Request() req: any) {
    return this.supportService.getUserMessages(req.user.sub);
  }
}
