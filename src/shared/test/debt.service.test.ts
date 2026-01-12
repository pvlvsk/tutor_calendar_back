/**
 * @relatedTo ../debt.service.ts
 *
 * Unit тесты для логики DebtService:
 * - calculateDebtFromRecords (приватный метод через рефлексию)
 */

import { DebtService } from '../debt.service';
import { LessonStudent } from '../../database/entities';

describe('DebtService', () => {
  let service: DebtService;

  beforeEach(() => {
    // Создаём сервис с моком репозитория
    service = new DebtService(null as any);
  });

  describe('calculateDebtFromRecords (private method)', () => {
    // Доступ к приватному методу через any
    const calculateDebt = (records: Partial<LessonStudent>[]) => {
      return (service as any).calculateDebtFromRecords(records);
    };

    it('должен вернуть hasDebt: false для пустого массива', () => {
      const result = calculateDebt([]);

      expect(result).toEqual({
        hasDebt: false,
        unpaidLessonsCount: 0,
        unpaidAmountRub: 0,
      });
    });

    it('должен корректно считать один неоплаченный урок', () => {
      const records = [{ priceRub: 1500 }];

      const result = calculateDebt(records);

      expect(result).toEqual({
        hasDebt: true,
        unpaidLessonsCount: 1,
        unpaidAmountRub: 1500,
      });
    });

    it('должен корректно суммировать несколько уроков', () => {
      const records = [
        { priceRub: 1000 },
        { priceRub: 1500 },
        { priceRub: 2000 },
      ];

      const result = calculateDebt(records);

      expect(result).toEqual({
        hasDebt: true,
        unpaidLessonsCount: 3,
        unpaidAmountRub: 4500,
      });
    });

    it('должен обрабатывать уроки с нулевой ценой', () => {
      const records = [
        { priceRub: 0 },
        { priceRub: 1000 },
      ];

      const result = calculateDebt(records);

      expect(result).toEqual({
        hasDebt: true,
        unpaidLessonsCount: 2,
        unpaidAmountRub: 1000,
      });
    });

    it('должен корректно считать большие суммы', () => {
      const records = Array(100).fill({ priceRub: 2000 });

      const result = calculateDebt(records);

      expect(result).toEqual({
        hasDebt: true,
        unpaidLessonsCount: 100,
        unpaidAmountRub: 200000,
      });
    });
  });
});

