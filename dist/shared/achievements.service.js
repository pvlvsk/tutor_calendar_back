"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsService = void 0;
const common_1 = require("@nestjs/common");
let AchievementsService = class AchievementsService {
    calculateAchievementsFromRecords(records, streak) {
        const attended = records.filter((r) => r.lesson?.status === "done" && r.attendance === "attended");
        const achievements = [];
        achievements.push({
            id: "first_lesson",
            name: "Первый шаг",
            description: "Посетить первое занятие",
            icon: "1",
            earnedAt: attended.length >= 1
                ? attended
                    .sort((a, b) => new Date(a.lesson.startAt).getTime() -
                    new Date(b.lesson.startAt).getTime())[0]
                    ?.lesson?.startAt?.toISOString() || null
                : null,
            progress: Math.min(attended.length, 1),
            target: 1,
        });
        const sortedAttended = [...attended].sort((a, b) => new Date(a.lesson.startAt).getTime() -
            new Date(b.lesson.startAt).getTime());
        achievements.push({
            id: "ten_lessons",
            name: "Десятка",
            description: "Посетить 10 занятий",
            icon: "10",
            earnedAt: sortedAttended.length >= 10
                ? sortedAttended[9]?.lesson?.startAt?.toISOString() || null
                : null,
            progress: Math.min(attended.length, 10),
            target: 10,
        });
        const weekMap = new Map();
        for (const r of records) {
            if (!r.lesson || r.lesson.status !== "done")
                continue;
            const date = new Date(r.lesson.startAt);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split("T")[0];
            if (!weekMap.has(weekKey)) {
                weekMap.set(weekKey, { attended: 0, total: 0 });
            }
            const week = weekMap.get(weekKey);
            week.total++;
            if (r.attendance === "attended") {
                week.attended++;
            }
        }
        let perfectWeeks = 0;
        for (const [, week] of weekMap) {
            if (week.total >= 3 && week.attended === week.total) {
                perfectWeeks++;
            }
        }
        achievements.push({
            id: "perfect_week",
            name: "Идеальная неделя",
            description: "Посетить все занятия за неделю (минимум 3)",
            icon: "W",
            earnedAt: perfectWeeks >= 1
                ? sortedAttended[sortedAttended.length - 1]?.lesson?.startAt?.toISOString() || null
                : null,
            progress: perfectWeeks,
            target: 1,
        });
        achievements.push({
            id: "streak_5",
            name: "Пять подряд",
            description: "Посетить 5 занятий подряд без пропусков",
            icon: "5+",
            earnedAt: streak >= 5
                ? sortedAttended[sortedAttended.length - 1]?.lesson?.startAt?.toISOString() || null
                : null,
            progress: Math.min(streak, 5),
            target: 5,
        });
        return achievements;
    }
};
exports.AchievementsService = AchievementsService;
exports.AchievementsService = AchievementsService = __decorate([
    (0, common_1.Injectable)()
], AchievementsService);
//# sourceMappingURL=achievements.service.js.map