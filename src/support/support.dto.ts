import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SupportMessageStatus } from "../database/entities/support-message.entity";

export class CreateSupportMessageDto {
  @ApiProperty({
    description: "Тема сообщения",
    example: "Предложение по улучшению",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    description: "Текст сообщения",
    example: "Было бы здорово добавить возможность...",
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateSupportMessageDto {
  @ApiPropertyOptional({
    description: "Статус сообщения",
    enum: ["new", "in_progress", "resolved", "closed"],
  })
  @IsOptional()
  @IsIn(["new", "in_progress", "resolved", "closed"])
  status?: SupportMessageStatus;

  @ApiPropertyOptional({
    description: "Заметки администратора",
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
