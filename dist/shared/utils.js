"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAttendanceRate = calculateAttendanceRate;
exports.calculateDebtInfo = calculateDebtInfo;
exports.getDayOfWeekRu = getDayOfWeekRu;
exports.getBotUsername = getBotUsername;
exports.generateInviteUrl = generateInviteUrl;
exports.generateFallbackUrl = generateFallbackUrl;
exports.formatFullName = formatFullName;
function calculateAttendanceRate(attended, total) {
    if (total === 0)
        return 0;
    return Math.round((attended / total) * 1000) / 10;
}
function calculateDebtInfo(unpaidLessons) {
    return {
        hasDebt: unpaidLessons.length > 0,
        unpaidLessonsCount: unpaidLessons.length,
        unpaidAmountRub: unpaidLessons.reduce((sum, l) => sum + l.priceRub, 0),
    };
}
function getDayOfWeekRu(date) {
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    return days[date.getDay()];
}
function getBotUsername() {
    return process.env.BOT_USERNAME || "your_bot";
}
function generateInviteUrl(code) {
    const bot = getBotUsername();
    return `https://t.me/${bot}/app?startapp=${code}`;
}
function generateFallbackUrl(code) {
    const bot = getBotUsername();
    return `https://t.me/${bot}?start=${code}`;
}
function formatFullName(firstName, lastName) {
    return [firstName, lastName].filter(Boolean).join(" ") || "";
}
//# sourceMappingURL=utils.js.map