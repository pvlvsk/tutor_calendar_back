/**
 * @file utils-format.test.ts
 * @description Тесты для функций форматирования
 * @relatedTo src/shared/utils.ts
 *
 * Покрывает: getDayOfWeekRu, formatFullName
 */

import { getDayOfWeekRu, formatFullName } from '../utils';

describe('utils.ts — Форматирование', () => {
  describe('getDayOfWeekRu', () => {
    it('должен вернуть "Пн" для понедельника', () => {
      const monday = new Date('2025-01-13');
      expect(getDayOfWeekRu(monday)).toBe('Пн');
    });

    it('должен вернуть "Вс" для воскресенья', () => {
      const sunday = new Date('2025-01-19');
      expect(getDayOfWeekRu(sunday)).toBe('Вс');
    });

    it('должен вернуть "Ср" для среды', () => {
      const wednesday = new Date('2025-01-15');
      expect(getDayOfWeekRu(wednesday)).toBe('Ср');
    });

    it('должен вернуть "Сб" для субботы', () => {
      const saturday = new Date('2025-01-18');
      expect(getDayOfWeekRu(saturday)).toBe('Сб');
    });
  });

  describe('formatFullName', () => {
    it('должен соединить имя и фамилию', () => {
      expect(formatFullName('Иван', 'Петров')).toBe('Иван Петров');
    });

    it('должен вернуть только имя если нет фамилии', () => {
      expect(formatFullName('Иван', null)).toBe('Иван');
      expect(formatFullName('Иван', undefined)).toBe('Иван');
    });

    it('должен вернуть только фамилию если нет имени', () => {
      expect(formatFullName(null, 'Петров')).toBe('Петров');
      expect(formatFullName(undefined, 'Петров')).toBe('Петров');
    });

    it('должен вернуть пустую строку если нет данных', () => {
      expect(formatFullName(null, null)).toBe('');
      expect(formatFullName(undefined, undefined)).toBe('');
    });

    it('должен игнорировать пустые строки', () => {
      expect(formatFullName('', 'Петров')).toBe('Петров');
      expect(formatFullName('Иван', '')).toBe('Иван');
    });
  });
});

