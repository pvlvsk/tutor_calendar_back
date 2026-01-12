/**
 * @file utils-debt.test.ts
 * @description Тесты для функций расчёта долга
 * @relatedTo ../utils.ts
 *
 * Покрывает: calculateDebtInfo
 */

import { calculateDebtInfo } from '../utils';
import { Lesson } from '../../database/entities';

// Фабрика для создания тестового урока
const createLesson = (priceRub: number): Partial<Lesson> => ({
  id: Math.random().toString(),
  priceRub,
  status: 'done',
});

describe('utils.ts — Расчёт долга', () => {
  describe('calculateDebtInfo', () => {
    it('должен вернуть hasDebt=false для пустого массива', () => {
      const result = calculateDebtInfo([]);
      
      expect(result.hasDebt).toBe(false);
      expect(result.unpaidLessonsCount).toBe(0);
      expect(result.unpaidAmountRub).toBe(0);
    });

    it('должен вернуть hasDebt=true при наличии уроков', () => {
      const lessons = [createLesson(1000)] as Lesson[];
      const result = calculateDebtInfo(lessons);
      
      expect(result.hasDebt).toBe(true);
    });

    it('должен подсчитать количество уроков', () => {
      const lessons = [
        createLesson(1000),
        createLesson(1500),
        createLesson(800),
      ] as Lesson[];
      
      const result = calculateDebtInfo(lessons);
      
      expect(result.unpaidLessonsCount).toBe(3);
    });

    it('должен суммировать стоимость уроков', () => {
      const lessons = [
        createLesson(1000),
        createLesson(1500),
        createLesson(500),
      ] as Lesson[];
      
      const result = calculateDebtInfo(lessons);
      
      expect(result.unpaidAmountRub).toBe(3000);
    });

    it('должен работать с одним уроком', () => {
      const lessons = [createLesson(2000)] as Lesson[];
      const result = calculateDebtInfo(lessons);
      
      expect(result.hasDebt).toBe(true);
      expect(result.unpaidLessonsCount).toBe(1);
      expect(result.unpaidAmountRub).toBe(2000);
    });

    it('должен корректно обрабатывать нулевую цену', () => {
      const lessons = [createLesson(0), createLesson(0)] as Lesson[];
      const result = calculateDebtInfo(lessons);
      
      expect(result.hasDebt).toBe(true);
      expect(result.unpaidLessonsCount).toBe(2);
      expect(result.unpaidAmountRub).toBe(0);
    });
  });
});

