"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
describe('utils.ts — Форматирование', () => {
    describe('getDayOfWeekRu', () => {
        it('должен вернуть "Пн" для понедельника', () => {
            const monday = new Date('2025-01-13');
            expect((0, utils_1.getDayOfWeekRu)(monday)).toBe('Пн');
        });
        it('должен вернуть "Вс" для воскресенья', () => {
            const sunday = new Date('2025-01-19');
            expect((0, utils_1.getDayOfWeekRu)(sunday)).toBe('Вс');
        });
        it('должен вернуть "Ср" для среды', () => {
            const wednesday = new Date('2025-01-15');
            expect((0, utils_1.getDayOfWeekRu)(wednesday)).toBe('Ср');
        });
        it('должен вернуть "Сб" для субботы', () => {
            const saturday = new Date('2025-01-18');
            expect((0, utils_1.getDayOfWeekRu)(saturday)).toBe('Сб');
        });
    });
    describe('formatFullName', () => {
        it('должен соединить имя и фамилию', () => {
            expect((0, utils_1.formatFullName)('Иван', 'Петров')).toBe('Иван Петров');
        });
        it('должен вернуть только имя если нет фамилии', () => {
            expect((0, utils_1.formatFullName)('Иван', null)).toBe('Иван');
            expect((0, utils_1.formatFullName)('Иван', undefined)).toBe('Иван');
        });
        it('должен вернуть только фамилию если нет имени', () => {
            expect((0, utils_1.formatFullName)(null, 'Петров')).toBe('Петров');
            expect((0, utils_1.formatFullName)(undefined, 'Петров')).toBe('Петров');
        });
        it('должен вернуть пустую строку если нет данных', () => {
            expect((0, utils_1.formatFullName)(null, null)).toBe('');
            expect((0, utils_1.formatFullName)(undefined, undefined)).toBe('');
        });
        it('должен игнорировать пустые строки', () => {
            expect((0, utils_1.formatFullName)('', 'Петров')).toBe('Петров');
            expect((0, utils_1.formatFullName)('Иван', '')).toBe('Иван');
        });
    });
});
//# sourceMappingURL=utils-format.test.js.map