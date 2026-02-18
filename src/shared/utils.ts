/**
 * Общие утилиты для работы с данными
 */

import { Lesson } from "../database/entities";
import { DebtInfo } from "./types";

/**
 * Рассчитывает процент посещаемости
 * @param attended - количество посещённых уроков
 * @param total - общее количество уроков
 * @returns процент с одним знаком после запятой
 */
export function calculateAttendanceRate(
  attended: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 1000) / 10;
}

/**
 * Рассчитывает информацию о долге из массива неоплаченных уроков
 */
export function calculateDebtInfo(unpaidLessons: Lesson[]): DebtInfo {
  return {
    hasDebt: unpaidLessons.length > 0,
    unpaidLessonsCount: unpaidLessons.length,
    unpaidAmountRub: unpaidLessons.reduce((sum, l) => sum + l.priceRub, 0),
  };
}

/**
 * Получает день недели на русском
 */
export function getDayOfWeekRu(date: Date): string {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return days[date.getDay()];
}

/**
 * Получает имя бота из переменных окружения
 */
export function getBotUsername(): string {
  return process.env.BOT_USERNAME || "your_bot";
}

/**
 * Генерирует универсальную ссылку-приглашение.
 * Ведёт на веб-приложение, где пользователь выбирает платформу (Telegram / MAX / Web).
 */
export function generateInviteUrl(code: string): string {
  const webappUrl = process.env.WEBAPP_URL || "https://tutorscalendar.ru";
  return `${webappUrl}/invite/${code}`;
}

/**
 * Генерирует fallback-ссылку через start параметр
 */
export function generateFallbackUrl(code: string): string {
  const bot = getBotUsername();
  return `https://t.me/${bot}?start=${code}`;
}

/**
 * Формирует полное имя из firstName и lastName
 */
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "";
}
