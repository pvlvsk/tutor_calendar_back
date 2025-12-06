import { Lesson } from '../database/entities';
import { Achievement } from './types';
export declare class AchievementsService {
    calculateAchievements(lessons: Lesson[], streak: {
        current: number;
        max: number;
    }): Achievement[];
}
