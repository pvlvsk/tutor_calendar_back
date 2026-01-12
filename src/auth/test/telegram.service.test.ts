/**
 * @relatedTo ../telegram.service.ts
 *
 * Unit тесты для TelegramService:
 * - Валидация и парсинг initData
 * - Dev режим (без BOT_TOKEN)
 */

import { TelegramService } from '../telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;

  beforeEach(() => {
    // Убираем BOT_TOKEN для dev режима
    delete process.env.BOT_TOKEN;
    service = new TelegramService();
  });

  describe('validateInitData (dev mode)', () => {
    it('должен парсить user из initData', () => {
      const user = { id: 12345, first_name: 'Test', last_name: 'User' };
      const initData = `user=${encodeURIComponent(JSON.stringify(user))}`;

      const result = service.validateInitData(initData);

      expect(result).toEqual(user);
    });

    it('должен вернуть дефолтного пользователя при невалидном initData', () => {
      const result = service.validateInitData('invalid_data');

      expect(result).toEqual({
        id: 123456789,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
      });
    });

    it('должен вернуть дефолтного пользователя при пустом initData', () => {
      const result = service.validateInitData('');

      expect(result).toEqual({
        id: 123456789,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
      });
    });

    it('должен вернуть дефолтного пользователя при невалидном JSON в user', () => {
      const initData = 'user=not_json';

      const result = service.validateInitData(initData);

      expect(result).toEqual({
        id: 123456789,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
      });
    });

    it('должен корректно парсить пользователя с username', () => {
      const user = { id: 999, first_name: 'John', username: 'johndoe' };
      const initData = `user=${encodeURIComponent(JSON.stringify(user))}`;

      const result = service.validateInitData(initData);

      expect(result).toEqual(user);
    });
  });

  describe('validateInitData (production mode with BOT_TOKEN)', () => {
    beforeEach(() => {
      process.env.BOT_TOKEN = 'test_bot_token_123';
      // Пересоздаём сервис с токеном
      service = new TelegramService();
    });

    afterEach(() => {
      delete process.env.BOT_TOKEN;
    });

    it('должен вернуть null при отсутствии hash', () => {
      const initData = 'user=%7B%22id%22%3A123%7D';

      const result = service.validateInitData(initData);

      expect(result).toBeNull();
    });

    it('должен вернуть null при невалидном hash', () => {
      const initData = 'user=%7B%22id%22%3A123%7D&hash=invalid_hash';

      const result = service.validateInitData(initData);

      expect(result).toBeNull();
    });

    it('должен вернуть null при отсутствии user в params', () => {
      const initData = 'auth_date=123456789&hash=somehash';

      const result = service.validateInitData(initData);

      expect(result).toBeNull();
    });
  });
});

