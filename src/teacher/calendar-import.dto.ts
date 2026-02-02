import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsUrl,
  IsOptional,
  IsArray,
  IsUUID,
  IsNumber,
  IsDateString,
  ValidateNested,
  ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";

export class CalendarPreviewDto {
  @ApiPropertyOptional({ description: "URL календаря (ICS)" })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: "Содержимое ICS файла" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: "Начало периода импорта" })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: "Конец периода импорта" })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class ImportEventDto {
  @ApiProperty({ description: "UID события из ICS" })
  @IsString()
  uid: string;

  @ApiPropertyOptional({ description: "ID предмета (опционально)" })
  @ValidateIf((o) => o.subjectId !== null && o.subjectId !== "" && o.subjectId !== undefined)
  @IsUUID()
  subjectId?: string | null;

  @ApiPropertyOptional({ description: "Создать предмет из названия события (если subjectId не указан)" })
  @IsOptional()
  autoCreateSubject?: boolean;

  @ApiPropertyOptional({ description: "ID учеников" })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  studentIds?: string[];

  @ApiPropertyOptional({ description: "Цена урока" })
  @IsOptional()
  @IsNumber()
  priceRub?: number;
}

export class CalendarImportDto {
  @ApiPropertyOptional({ description: "URL календаря (ICS)" })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: "Содержимое ICS файла" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: "События для импорта", type: [ImportEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportEventDto)
  events: ImportEventDto[];
}

export class GoogleCalendarImportDto {
  @ApiProperty({ description: "События для импорта из Google Calendar", type: [ImportEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportEventDto)
  events: ImportEventDto[];
}

// Response DTOs

export class PreviewEventResponseDto {
  @ApiProperty()
  uid: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  startAt: Date;

  @ApiProperty()
  endAt: Date;

  @ApiProperty()
  durationMinutes: number;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  suggestedSubjectId?: string;

  @ApiPropertyOptional()
  suggestedSubjectName?: string;

  @ApiPropertyOptional({ description: "Является ли событие частью повторяющейся серии" })
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: "Оригинальный UID повторяющегося события" })
  originalUid?: string;
}

export class SubjectOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class CalendarPreviewResponseDto {
  @ApiProperty({ type: [PreviewEventResponseDto] })
  events: PreviewEventResponseDto[];

  @ApiProperty({ type: [SubjectOptionDto] })
  subjects: SubjectOptionDto[];

  @ApiProperty()
  totalEvents: number;

  @ApiProperty({ description: "Есть ли повторяющиеся события в календаре" })
  hasRecurringEvents: boolean;
}

export class ImportResultResponseDto {
  @ApiProperty()
  imported: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty({ type: [String] })
  errors: string[];

  @ApiProperty({ description: "Количество созданных серий" })
  seriesCreated: number;
}
