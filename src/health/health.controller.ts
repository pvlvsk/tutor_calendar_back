import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Проверка состояния сервиса' })
  async check() {
    let dbStatus = 'disconnected'
    let dbLatencyMs: number | null = null

    try {
      const start = Date.now()
      await this.dataSource.query('SELECT 1')
      dbLatencyMs = Date.now() - start
      dbStatus = 'connected'
    } catch {
      dbStatus = 'error'
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe (для Kubernetes)' })
  live() {
    return { status: 'ok' }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (для Kubernetes)' })
  async ready() {
    try {
      await this.dataSource.query('SELECT 1')
      return { status: 'ready' }
    } catch {
      return { status: 'not_ready' }
    }
  }
}

