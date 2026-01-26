import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, Min, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class DateRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}

export class RequestLogsQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(["all", "success", "error"])
  status?: "all" | "success" | "error" = "all";
}

export class AnalyticsEventsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  eventName?: string;
}

export class TrackEventDto {
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  pagePath?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
