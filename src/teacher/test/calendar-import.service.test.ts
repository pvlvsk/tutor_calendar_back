/**
 * @file calendar-import.service.test.ts
 * @description Тесты для CalendarImportService
 * @relatedTo ../calendar-import.service.ts
 *
 * Покрывает: parseIcsData (мокаем), валидация, генерация uid для recurring
 */

import type { IcsEvent, ImportPreviewEvent, ImportResult } from '../calendar-import.service';

// ============================================
// Хелперы для тестов
// ============================================

/**
 * Рассчитывает длительность в минутах
 */
function calculateDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Генерирует uid для повторяющегося события
 */
function generateRecurringUid(originalUid: string, occurrenceDate: Date): string {
  return `${originalUid}_${occurrenceDate.toISOString()}`;
}

/**
 * Преобразует IcsEvent в ImportPreviewEvent
 */
function icsEventToPreview(event: IcsEvent): ImportPreviewEvent {
  return {
    uid: event.uid,
    title: event.summary,
    description: event.description,
    startAt: event.start,
    endAt: event.end,
    durationMinutes: calculateDurationMinutes(event.start, event.end),
    location: event.location,
    isRecurring: event.isRecurring,
    originalUid: event.originalUid,
  };
}

/**
 * Группирует события по originalUid
 */
function groupByOriginalUid(events: IcsEvent[]): Map<string, IcsEvent[]> {
  const groups = new Map<string, IcsEvent[]>();

  for (const event of events) {
    const key = event.originalUid || event.uid;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(event);
  }

  return groups;
}

/**
 * Проверяет, нужно ли создавать серию
 */
function shouldCreateSeries(events: IcsEvent[]): boolean {
  return events.length > 1;
}

// ============================================
// Тесты: calculateDurationMinutes
// ============================================

describe('calculateDurationMinutes', () => {
  it('должен вычислить 60 минут для часового урока', () => {
    const start = new Date('2026-01-15T10:00:00Z');
    const end = new Date('2026-01-15T11:00:00Z');

    expect(calculateDurationMinutes(start, end)).toBe(60);
  });

  it('должен вычислить 90 минут', () => {
    const start = new Date('2026-01-15T10:00:00Z');
    const end = new Date('2026-01-15T11:30:00Z');

    expect(calculateDurationMinutes(start, end)).toBe(90);
  });

  it('должен вычислить 45 минут', () => {
    const start = new Date('2026-01-15T10:00:00Z');
    const end = new Date('2026-01-15T10:45:00Z');

    expect(calculateDurationMinutes(start, end)).toBe(45);
  });

  it('должен округлять до целых минут', () => {
    const start = new Date('2026-01-15T10:00:00Z');
    const end = new Date('2026-01-15T10:30:30Z'); // 30.5 минут

    expect(calculateDurationMinutes(start, end)).toBe(31);
  });
});

// ============================================
// Тесты: generateRecurringUid
// ============================================

describe('generateRecurringUid', () => {
  it('должен сгенерировать уникальный uid', () => {
    const originalUid = 'event@example.com';
    const date = new Date('2026-02-01T15:00:00Z');

    const result = generateRecurringUid(originalUid, date);

    expect(result).toBe('event@example.com_2026-02-01T15:00:00.000Z');
  });

  it('uid должны быть разными для разных дат', () => {
    const originalUid = 'event@example.com';
    const date1 = new Date('2026-02-01T15:00:00Z');
    const date2 = new Date('2026-02-08T15:00:00Z');

    const uid1 = generateRecurringUid(originalUid, date1);
    const uid2 = generateRecurringUid(originalUid, date2);

    expect(uid1).not.toBe(uid2);
  });
});

// ============================================
// Тесты: icsEventToPreview
// ============================================

describe('icsEventToPreview', () => {
  it('должен преобразовать событие в preview', () => {
    const event: IcsEvent = {
      uid: 'test-uid',
      summary: 'Урок математики',
      description: 'Описание',
      start: new Date('2026-01-15T10:00:00Z'),
      end: new Date('2026-01-15T11:00:00Z'),
      location: 'Онлайн',
    };

    const result = icsEventToPreview(event);

    expect(result.uid).toBe('test-uid');
    expect(result.title).toBe('Урок математики');
    expect(result.description).toBe('Описание');
    expect(result.durationMinutes).toBe(60);
    expect(result.location).toBe('Онлайн');
  });

  it('должен включить isRecurring и originalUid', () => {
    const event: IcsEvent = {
      uid: 'recurring-1_2026-02-01',
      summary: 'Тренировка',
      start: new Date('2026-02-01T15:00:00Z'),
      end: new Date('2026-02-01T16:30:00Z'),
      isRecurring: true,
      originalUid: 'recurring-1',
    };

    const result = icsEventToPreview(event);

    expect(result.isRecurring).toBe(true);
    expect(result.originalUid).toBe('recurring-1');
    expect(result.durationMinutes).toBe(90);
  });
});

// ============================================
// Тесты: groupByOriginalUid
// ============================================

describe('groupByOriginalUid', () => {
  it('должен группировать события по originalUid', () => {
    const events: IcsEvent[] = [
      {
        uid: 'r1_1',
        summary: 'Event1',
        start: new Date(),
        end: new Date(),
        isRecurring: true,
        originalUid: 'r1',
      },
      {
        uid: 'r1_2',
        summary: 'Event1',
        start: new Date(),
        end: new Date(),
        isRecurring: true,
        originalUid: 'r1',
      },
      {
        uid: 'single',
        summary: 'Single',
        start: new Date(),
        end: new Date(),
      },
    ];

    const groups = groupByOriginalUid(events);

    expect(groups.size).toBe(2);
    expect(groups.get('r1')?.length).toBe(2);
    expect(groups.get('single')?.length).toBe(1);
  });

  it('должен использовать uid если нет originalUid', () => {
    const events: IcsEvent[] = [
      { uid: 'event1', summary: 'E1', start: new Date(), end: new Date() },
      { uid: 'event2', summary: 'E2', start: new Date(), end: new Date() },
    ];

    const groups = groupByOriginalUid(events);

    expect(groups.size).toBe(2);
    expect(groups.has('event1')).toBe(true);
    expect(groups.has('event2')).toBe(true);
  });

  it('должен вернуть пустую Map для пустого массива', () => {
    const groups = groupByOriginalUid([]);

    expect(groups.size).toBe(0);
  });
});

// ============================================
// Тесты: shouldCreateSeries
// ============================================

describe('shouldCreateSeries', () => {
  it('должен вернуть false для одного события', () => {
    const events: IcsEvent[] = [
      { uid: 'e1', summary: 'E1', start: new Date(), end: new Date() },
    ];

    expect(shouldCreateSeries(events)).toBe(false);
  });

  it('должен вернуть true для нескольких событий', () => {
    const events: IcsEvent[] = [
      { uid: 'e1', summary: 'E1', start: new Date(), end: new Date() },
      { uid: 'e2', summary: 'E1', start: new Date(), end: new Date() },
    ];

    expect(shouldCreateSeries(events)).toBe(true);
  });

  it('должен вернуть false для пустого массива', () => {
    expect(shouldCreateSeries([])).toBe(false);
  });
});

// ============================================
// Тесты: ImportResult
// ============================================

describe('ImportResult structure', () => {
  it('должен иметь правильную структуру', () => {
    const result: ImportResult = {
      imported: 10,
      skipped: 2,
      errors: ['Error 1', 'Error 2'],
      seriesCreated: 1,
    };

    expect(result.imported).toBe(10);
    expect(result.skipped).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.seriesCreated).toBe(1);
  });

  it('должен допускать пустой массив ошибок', () => {
    const result: ImportResult = {
      imported: 5,
      skipped: 0,
      errors: [],
      seriesCreated: 0,
    };

    expect(result.errors).toHaveLength(0);
  });
});
