"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
describe('utils.ts — Статистика', () => {
    describe('calculateAttendanceRate', () => {
        it('должен вычислить процент посещаемости', () => {
            expect((0, utils_1.calculateAttendanceRate)(8, 10)).toBe(80);
        });
        it('должен округлять до одного знака после запятой', () => {
            expect((0, utils_1.calculateAttendanceRate)(7, 9)).toBe(77.8);
        });
        it('должен вернуть 0 при total = 0', () => {
            expect((0, utils_1.calculateAttendanceRate)(0, 0)).toBe(0);
        });
        it('должен вернуть 100 при полной посещаемости', () => {
            expect((0, utils_1.calculateAttendanceRate)(10, 10)).toBe(100);
        });
        it('должен вернуть 0 при нулевой посещаемости', () => {
            expect((0, utils_1.calculateAttendanceRate)(0, 10)).toBe(0);
        });
        it('должен корректно работать с большими числами', () => {
            expect((0, utils_1.calculateAttendanceRate)(150, 200)).toBe(75);
        });
    });
});
//# sourceMappingURL=utils-stats.test.js.map