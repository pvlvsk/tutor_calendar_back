"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram_service_1 = require("../telegram.service");
describe('TelegramService', () => {
    let service;
    beforeEach(() => {
        delete process.env.BOT_TOKEN;
        service = new telegram_service_1.TelegramService();
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
            service = new telegram_service_1.TelegramService();
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
//# sourceMappingURL=telegram.service.test.js.map