/**
 * @file utils-url.test.ts
 * @description Тесты для функций генерации URL
 * @relatedTo ../utils.ts
 *
 * Покрывает: generateInviteUrl, generateFallbackUrl, getBotUsername
 */

import {
  generateInviteUrl,
  generateFallbackUrl,
  getBotUsername,
} from '../utils';

describe('utils.ts — Генерация URL', () => {
  const originalEnv = process.env.BOT_USERNAME;

  beforeEach(() => {
    process.env.BOT_USERNAME = 'test_bot';
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.BOT_USERNAME = originalEnv;
    } else {
      delete process.env.BOT_USERNAME;
    }
  });

  describe('getBotUsername', () => {
    it('должен вернуть имя бота из env', () => {
      process.env.BOT_USERNAME = 'my_custom_bot';
      expect(getBotUsername()).toBe('my_custom_bot');
    });

    it('должен вернуть fallback если env не задан', () => {
      delete process.env.BOT_USERNAME;
      expect(getBotUsername()).toBe('your_bot');
    });
  });

  describe('generateInviteUrl', () => {
    it('должен сгенерировать URL с startapp параметром', () => {
      const url = generateInviteUrl('ABC123');
      
      expect(url).toBe('https://t.me/test_bot?startapp=ABC123');
    });

    it('должен использовать переданный код', () => {
      const url = generateInviteUrl('XYZ789');
      
      expect(url).toContain('startapp=XYZ789');
    });

    it('URL должен быть валидным', () => {
      const url = generateInviteUrl('CODE');
      
      expect(url).toMatch(/^https:\/\/t\.me\/.+\?startapp=.+$/);
    });
  });

  describe('generateFallbackUrl', () => {
    it('должен сгенерировать URL с start параметром', () => {
      const url = generateFallbackUrl('ABC123');
      
      expect(url).toBe('https://t.me/test_bot?start=ABC123');
    });

    it('должен отличаться от invite URL', () => {
      const invite = generateInviteUrl('CODE');
      const fallback = generateFallbackUrl('CODE');
      
      expect(invite).not.toBe(fallback);
      expect(invite).toContain('startapp=');
      expect(fallback).toContain('start=');
    });
  });
});

