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
  const originalBotUsername = process.env.BOT_USERNAME;
  const originalWebappUrl = process.env.WEBAPP_URL;

  beforeEach(() => {
    process.env.BOT_USERNAME = 'test_bot';
    process.env.WEBAPP_URL = 'https://tutorscalendar.ru';
  });

  afterEach(() => {
    if (originalBotUsername !== undefined) {
      process.env.BOT_USERNAME = originalBotUsername;
    } else {
      delete process.env.BOT_USERNAME;
    }
    if (originalWebappUrl !== undefined) {
      process.env.WEBAPP_URL = originalWebappUrl;
    } else {
      delete process.env.WEBAPP_URL;
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
    it('должен сгенерировать веб-ссылку с кодом в пути', () => {
      const url = generateInviteUrl('ABC123');
      
      expect(url).toBe('https://tutorscalendar.ru/invite/ABC123');
    });

    it('должен использовать переданный код', () => {
      const url = generateInviteUrl('XYZ789');
      
      expect(url).toContain('/invite/XYZ789');
    });

    it('URL должен быть валидным', () => {
      const url = generateInviteUrl('CODE');
      
      expect(url).toMatch(/^https?:\/\/.+\/invite\/.+$/);
    });

    it('должен использовать WEBAPP_URL из env', () => {
      process.env.WEBAPP_URL = 'https://custom.example.com';
      const url = generateInviteUrl('T_abc');

      expect(url).toBe('https://custom.example.com/invite/T_abc');
    });

    it('должен использовать fallback если WEBAPP_URL не задан', () => {
      delete process.env.WEBAPP_URL;
      const url = generateInviteUrl('T_abc');

      expect(url).toBe('https://tutorscalendar.ru/invite/T_abc');
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
      expect(invite).toContain('/invite/');
      expect(fallback).toContain('start=');
    });
  });
});

