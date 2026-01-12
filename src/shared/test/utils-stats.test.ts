/**
 * @file utils-stats.test.ts
 * @description Тесты для функций статистики
 * @relatedTo src/shared/utils.ts
 *
 * Покрывает: calculateAttendanceRate
 */

import { calculateAttendanceRate } from '../utils';

describe('utils.ts — Статистика', () => {
  describe('calculateAttendanceRate', () => {
    it('должен вычислить процент посещаемости', () => {
      expect(calculateAttendanceRate(8, 10)).toBe(80);
    });

    it('должен округлять до одного знака после запятой', () => {
      // 7/9 = 77.777... → 77.8
      expect(calculateAttendanceRate(7, 9)).toBe(77.8);
    });

    it('должен вернуть 0 при total = 0', () => {
      expect(calculateAttendanceRate(0, 0)).toBe(0);
    });

    it('должен вернуть 100 при полной посещаемости', () => {
      expect(calculateAttendanceRate(10, 10)).toBe(100);
    });

    it('должен вернуть 0 при нулевой посещаемости', () => {
      expect(calculateAttendanceRate(0, 10)).toBe(0);
    });

    it('должен корректно работать с большими числами', () => {
      expect(calculateAttendanceRate(150, 200)).toBe(75);
    });
  });
});

