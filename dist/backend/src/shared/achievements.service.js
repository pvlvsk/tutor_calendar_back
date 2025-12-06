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
const ACHIEVEMENT_DEFINITIONS = [
    {
        id: 'first_lesson',
        name: 'Первый шаг',
        description: 'Посетить первое занятие',
        icon: '1',
        check: (lessons) => {
            const attended = lessons.filter(l => l.status === 'done' && l.attendance === 'attended');
            return {
                earned: attended.length >= 1,
                progress: Math.min(attended.length, 1),
                target: 1,
            };
        },
    },
    {
        id: 'ten_lessons',
        name: 'Десятка',
        description: 'Посетить 10 занятий',
        icon: '10',
        check: (lessons) => {
            const attended = lessons.filter(l => l.status === 'done' && l.attendance === 'attended');
            return {
                earned: attended.length >= 10,
                progress: Math.min(attended.length, 10),
                target: 10,
            };
        },
    },
    {
        id: 'perfect_week',
        name: 'Идеальная неделя',
        description: 'Посетить все занятия за неделю (минимум 3)',
        icon: 'W',
        check: (lessons) => {
            const weekMap = new Map();
            for (const lesson of lessons) {
                if (lesson.status !== 'done')
                    continue;
                const date = new Date(lesson.startAt);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                if (!weekMap.has(weekKey)) {
                    weekMap.set(weekKey, { attended: 0, total: 0 });
                }
                const week = weekMap.get(weekKey);
                week.total++;
                if (lesson.attendance === 'attended') {
                    week.attended++;
                }
            }
            let perfectWeeks = 0;
            for (const [, week] of weekMap) {
                if (week.total >= 3 && week.attended === week.total) {
                    perfectWeeks++;
                }
            }
            return {
                earned: perfectWeeks >= 1,
                progress: perfectWeeks,
                target: 1,
            };
        },
    },
    {
        id: 'streak_5',
        name: 'Пять подряд',
        description: 'Посетить 5 занятий подряд без пропусков',
        icon: '5+',
        check: (lessons, streak) => {
            return {
                earned: streak.max >= 5,
                progress: Math.min(streak.current, 5),
                target: 5,
            };
        },
    },
];
let AchievementsService = class AchievementsService {
    calculateAchievements(lessons, streak) {
        return ACHIEVEMENT_DEFINITIONS.map(def => {
            const result = def.check(lessons, streak);
            let earnedAt = null;
            if (result.earned) {
                const doneLessons = lessons
                    .filter(l => l.status === 'done' && l.attendance === 'attended')
                    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
                if (def.id === 'first_lesson' && doneLessons.length >= 1) {
                    earnedAt = doneLessons[0].startAt.toISOString();
                }
                else if (def.id === 'ten_lessons' && doneLessons.length >= 10) {
                    earnedAt = doneLessons[9].startAt.toISOString();
                }
                else if (doneLessons.length > 0) {
                    earnedAt = doneLessons[doneLessons.length - 1].startAt.toISOString();
                }
            }
            return {
                id: def.id,
                name: def.name,
                description: def.description,
                icon: def.icon,
                earnedAt,
                progress: result.progress,
                target: result.target,
            };
        });
    }
};
exports.AchievementsService = AchievementsService;
exports.AchievementsService = AchievementsService = __decorate([
    (0, common_1.Injectable)()
], AchievementsService);
//# sourceMappingURL=achievements.service.js.map