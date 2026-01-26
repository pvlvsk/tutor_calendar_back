/**
 * @file lesson-formatters.test.ts
 * @description Тесты для функций форматирования уроков
 * @relatedTo ../lesson-formatters.ts
 *
 * Покрывает: isGroupLesson, getStudentsCount, formatSubject, formatTeacher,
 *            formatDateOrNull, calculateOtherStudentsCount, extractBaseLessonFields
 */

import {
  isGroupLesson,
  getStudentsCount,
  formatSubject,
  formatTeacher,
  formatDateOrNull,
  calculateOtherStudentsCount,
} from '../lesson-formatters';

// ============================================
// isGroupLesson
// ============================================

describe('isGroupLesson', () => {
  it('должен вернуть false для урока без учеников', () => {
    expect(isGroupLesson({ lessonStudents: [] })).toBe(false);
    expect(isGroupLesson({ lessonStudents: null })).toBe(false);
    expect(isGroupLesson({})).toBe(false);
  });

  it('должен вернуть false для урока с одним учеником', () => {
    expect(isGroupLesson({ lessonStudents: [{}] })).toBe(false);
  });

  it('должен вернуть true для урока с несколькими учениками', () => {
    expect(isGroupLesson({ lessonStudents: [{}, {}] })).toBe(true);
    expect(isGroupLesson({ lessonStudents: [{}, {}, {}] })).toBe(true);
  });

  it('должен использовать studentsCount если передан', () => {
    expect(isGroupLesson({}, 0)).toBe(false);
    expect(isGroupLesson({}, 1)).toBe(false);
    expect(isGroupLesson({}, 2)).toBe(true);
    expect(isGroupLesson({}, 5)).toBe(true);
  });
});

// ============================================
// getStudentsCount
// ============================================

describe('getStudentsCount', () => {
  it('должен вернуть 0 для пустого массива', () => {
    expect(getStudentsCount({ lessonStudents: [] })).toBe(0);
  });

  it('должен вернуть 0 для null/undefined', () => {
    expect(getStudentsCount({ lessonStudents: null })).toBe(0);
    expect(getStudentsCount({})).toBe(0);
  });

  it('должен вернуть количество учеников', () => {
    expect(getStudentsCount({ lessonStudents: [{}, {}] })).toBe(2);
    expect(getStudentsCount({ lessonStudents: [{}, {}, {}, {}] })).toBe(4);
  });
});

// ============================================
// formatSubject
// ============================================

describe('formatSubject', () => {
  it('должен вернуть null для null/undefined', () => {
    expect(formatSubject(null)).toBeNull();
    expect(formatSubject(undefined)).toBeNull();
  });

  it('должен форматировать предмет', () => {
    const result = formatSubject({ name: 'Математика', colorHex: '#FF0000' });

    expect(result).toEqual({
      name: 'Математика',
      colorHex: '#FF0000',
    });
  });

  it('должен обрабатывать частичные данные', () => {
    const result = formatSubject({ name: 'Физика' });

    expect(result).toEqual({
      name: 'Физика',
      colorHex: undefined,
    });
  });
});

// ============================================
// formatTeacher
// ============================================

describe('formatTeacher', () => {
  it('должен вернуть null для null/undefined', () => {
    expect(formatTeacher(null)).toBeNull();
    expect(formatTeacher(undefined)).toBeNull();
  });

  it('должен вернуть null если нет user', () => {
    expect(formatTeacher({})).toBeNull();
    expect(formatTeacher({ user: null })).toBeNull();
  });

  it('должен форматировать учителя', () => {
    const result = formatTeacher({
      user: { firstName: 'Иван', lastName: 'Иванов', username: 'ivanov' },
    });

    expect(result).toEqual({
      firstName: 'Иван',
      lastName: 'Иванов',
      username: 'ivanov',
    });
  });

  it('должен обрабатывать частичные данные', () => {
    const result = formatTeacher({ user: { firstName: 'Иван' } });

    expect(result).toEqual({
      firstName: 'Иван',
      lastName: undefined,
      username: undefined,
    });
  });
});

// ============================================
// formatDateOrNull
// ============================================

describe('formatDateOrNull', () => {
  it('должен вернуть null для null/undefined', () => {
    expect(formatDateOrNull(null)).toBeNull();
    expect(formatDateOrNull(undefined)).toBeNull();
  });

  it('должен форматировать дату в ISO string', () => {
    const date = new Date('2026-01-15T10:30:00.000Z');

    const result = formatDateOrNull(date);

    expect(result).toBe('2026-01-15T10:30:00.000Z');
  });
});

// ============================================
// calculateOtherStudentsCount
// ============================================

describe('calculateOtherStudentsCount', () => {
  it('должен вернуть 0 для 0 или 1', () => {
    expect(calculateOtherStudentsCount(0)).toBe(0);
    expect(calculateOtherStudentsCount(1)).toBe(0);
  });

  it('должен вычитать 1', () => {
    expect(calculateOtherStudentsCount(2)).toBe(1);
    expect(calculateOtherStudentsCount(5)).toBe(4);
    expect(calculateOtherStudentsCount(10)).toBe(9);
  });

  it('не должен возвращать отрицательное число', () => {
    expect(calculateOtherStudentsCount(-1)).toBe(0);
    expect(calculateOtherStudentsCount(-10)).toBe(0);
  });
});
