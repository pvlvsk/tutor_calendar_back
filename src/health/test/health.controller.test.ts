/**
 * @relatedTo ../health.controller.ts
 *
 * Интеграционные тесты для HealthController:
 * - GET /health
 * - GET /health/live
 * - GET /health/ready
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { DataSource } from 'typeorm';

describe('HealthController (integration)', () => {
  let controller: HealthController;
  let mockDataSource: Partial<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('GET /health', () => {
    it('должен вернуть status: ok при успешном подключении к БД', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('connected');
      expect(result.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.memory.heapUsedMB).toBeGreaterThan(0);
    });

    it('должен вернуть status: degraded при ошибке БД', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('error');
      expect(result.database.latencyMs).toBeNull();
    });
  });

  describe('GET /health/live', () => {
    it('должен вернуть status: ok', () => {
      const result = controller.live();

      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('GET /health/ready', () => {
    it('должен вернуть status: ready при работающей БД', async () => {
      const result = await controller.ready();

      expect(result).toEqual({ status: 'ready' });
    });

    it('должен вернуть status: not_ready при ошибке БД', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await controller.ready();

      expect(result).toEqual({ status: 'not_ready' });
    });
  });
});

