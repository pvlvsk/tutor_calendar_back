import { IsString, IsEmail, IsIn, IsOptional, MinLength, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterEmailDto {
  @ApiProperty({ description: 'Email пользователя', example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Пароль (минимум 6 символов)', example: 'securePassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string

  @ApiProperty({ description: 'Имя', example: 'Иван' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string

  @ApiPropertyOptional({ description: 'Фамилия', example: 'Иванов' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string

  @ApiProperty({
    description: 'Роль пользователя',
    enum: ['teacher', 'student', 'parent'],
    example: 'teacher',
  })
  @IsIn(['teacher', 'student', 'parent'])
  role: 'teacher' | 'student' | 'parent'

  @ApiPropertyOptional({ description: 'Реферальная метка', example: 'm' })
  @IsOptional()
  @IsString()
  referralSource?: string
}

export class LoginEmailDto {
  @ApiProperty({ description: 'Email', example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Пароль', example: 'securePassword123' })
  @IsString()
  password: string
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Токен подтверждения email' })
  @IsString()
  token: string
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email для сброса пароля', example: 'user@example.com' })
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Токен сброса пароля' })
  @IsString()
  token: string

  @ApiProperty({ description: 'Новый пароль (минимум 6 символов)' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string
}

export class LinkEmailDto {
  @ApiProperty({ description: 'Email для привязки', example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Пароль для нового email-входа' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string
}

export class LinkTelegramDto {
  @ApiProperty({ description: 'Telegram initData' })
  @IsString()
  initData: string

  @ApiProperty({ description: 'Email существующего аккаунта' })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Пароль от email-аккаунта' })
  @IsString()
  password: string
}

export class VerifyCodeDto {
  @ApiProperty({ description: 'ID пользователя (из ответа register-email)' })
  @IsString()
  userId: string

  @ApiProperty({ description: '4-значный код из email', example: '1234' })
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  code: string

  @ApiProperty({
    description: 'Роль пользователя',
    enum: ['teacher', 'student', 'parent'],
    example: 'teacher',
  })
  @IsIn(['teacher', 'student', 'parent'])
  role: 'teacher' | 'student' | 'parent'
}

export class ResendCodeDto {
  @ApiProperty({ description: 'ID пользователя (из ответа register-email)' })
  @IsString()
  userId: string
}
