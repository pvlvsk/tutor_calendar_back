import { BotService } from "./bot.service";
import { NotificationEventType, NotificationSettingsResponse } from "../shared/types/notifications";
interface AuthRequest {
    user: {
        sub: string;
        telegramId: number;
        role: string;
        profileId: string;
        isBetaTester: boolean;
    };
}
interface SetInitialPermissionDto {
    granted: boolean;
}
interface ToggleNotificationsDto {
    enabled: boolean;
}
interface UpdatePreferenceDto {
    eventType: NotificationEventType;
    enabled: boolean;
}
interface TestMessageDto {
    telegramId: string | number;
    text: string;
    buttonText?: string;
}
export declare class BotController {
    private readonly botService;
    constructor(botService: BotService);
    getNotificationSettings(req: AuthRequest): Promise<NotificationSettingsResponse>;
    setInitialPermission(req: AuthRequest, dto: SetInitialPermissionDto): Promise<{
        success: boolean;
    }>;
    toggleNotifications(req: AuthRequest, dto: ToggleNotificationsDto): Promise<{
        success: boolean;
    }>;
    updatePreference(req: AuthRequest, dto: UpdatePreferenceDto): Promise<{
        success: boolean;
    }>;
    testSendMessage(adminSecret: string, dto: TestMessageDto): Promise<{
        success: boolean;
        telegramId: string | number;
        message: string;
    }>;
}
export {};
