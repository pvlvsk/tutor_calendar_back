import { IsString, IsIn, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class InitDto {
  @ApiProperty({ 
    description: 'Telegram initData или "test" для dev режима',
    example: 'test'
  })
  @IsString()
  initData: string
}

export class RegisterDto {
  @ApiProperty({ 
    description: 'Telegram initData или "test" для dev режима',
    example: 'test'
  })
  @IsString()
  initData: string

  @ApiProperty({ 
    description: 'Роль пользователя',
    enum: ['teacher', 'student', 'parent'],
    example: 'teacher'
  })
  @IsIn(['teacher', 'student', 'parent'])
  role: 'teacher' | 'student' | 'parent'
}

export class SelectRoleDto {
  @ApiProperty({ 
    description: 'Telegram initData',
    example: 'test'
  })
  @IsString()
  initData: string

  @ApiProperty({ 
    description: 'Выбранная роль',
    enum: ['teacher', 'student', 'parent'],
    example: 'teacher'
  })
  @IsIn(['teacher', 'student', 'parent'])
  role: 'teacher' | 'student' | 'parent'
}

export class AddRoleDto {
  @ApiProperty({ 
    description: 'Новая роль для добавления',
    enum: ['teacher', 'student', 'parent'],
    example: 'student'
  })
  @IsIn(['teacher', 'student', 'parent'])
  role: 'teacher' | 'student' | 'parent'
}

export class AcceptInvitationDto {
  @ApiPropertyOptional({ 
    description: 'Telegram initData (опционально если есть токен)',
    example: 'test'
  })
  @IsOptional()
  @IsString()
  initData?: string

  @ApiProperty({ 
    description: 'Токен приглашения',
    example: 'INV_abc123'
  })
  @IsString()
  invitationToken: string
}

export class JoinByReferralDto {
  @ApiProperty({ 
    description: 'Telegram initData',
    example: 'test'
  })
  @IsString()
  initData: string

  @ApiProperty({ 
    description: 'Код приглашения: T_xxx для учителя, P_xxx для родителя',
    example: 'T_abc123def456'
  })
  @IsString()
  referralCode: string
}

export class ActivateBetaDto {
  @ApiProperty({ 
    description: 'Код для активации бета-тестера',
    example: 'beta_2025'
  })
  @IsString()
  betaCode: string
}
