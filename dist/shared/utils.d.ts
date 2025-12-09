import { Lesson } from "../database/entities";
import { DebtInfo } from "./types";
export declare function calculateAttendanceRate(attended: number, total: number): number;
export declare function calculateDebtInfo(unpaidLessons: Lesson[]): DebtInfo;
export declare function getDayOfWeekRu(date: Date): string;
export declare function getBotUsername(): string;
export declare function generateInviteUrl(code: string): string;
export declare function generateFallbackUrl(code: string): string;
export declare function formatFullName(firstName?: string | null, lastName?: string | null): string;
