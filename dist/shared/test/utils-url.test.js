"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
describe('utils.ts — Генерация URL', () => {
    const originalEnv = process.env.BOT_USERNAME;
    beforeEach(() => {
        process.env.BOT_USERNAME = 'test_bot';
    });
    afterEach(() => {
        if (originalEnv !== undefined) {
            process.env.BOT_USERNAME = originalEnv;
        }
        else {
            delete process.env.BOT_USERNAME;
        }
    });
    describe('getBotUsername', () => {
        it('должен вернуть имя бота из env', () => {
            process.env.BOT_USERNAME = 'my_custom_bot';
            expect((0, utils_1.getBotUsername)()).toBe('my_custom_bot');
        });
        it('должен вернуть fallback если env не задан', () => {
            delete process.env.BOT_USERNAME;
            expect((0, utils_1.getBotUsername)()).toBe('your_bot');
        });
    });
    describe('generateInviteUrl', () => {
        it('должен сгенерировать URL с startapp параметром', () => {
            const url = (0, utils_1.generateInviteUrl)('ABC123');
            expect(url).toBe('https://t.me/test_bot?startapp=ABC123');
        });
        it('должен использовать переданный код', () => {
            const url = (0, utils_1.generateInviteUrl)('XYZ789');
            expect(url).toContain('startapp=XYZ789');
        });
        it('URL должен быть валидным', () => {
            const url = (0, utils_1.generateInviteUrl)('CODE');
            expect(url).toMatch(/^https:\/\/t\.me\/.+\?startapp=.+$/);
        });
    });
    describe('generateFallbackUrl', () => {
        it('должен сгенерировать URL с start параметром', () => {
            const url = (0, utils_1.generateFallbackUrl)('ABC123');
            expect(url).toBe('https://t.me/test_bot?start=ABC123');
        });
        it('должен отличаться от invite URL', () => {
            const invite = (0, utils_1.generateInviteUrl)('CODE');
            const fallback = (0, utils_1.generateFallbackUrl)('CODE');
            expect(invite).not.toBe(fallback);
            expect(invite).toContain('startapp=');
            expect(fallback).toContain('start=');
        });
    });
});
//# sourceMappingURL=utils-url.test.js.map