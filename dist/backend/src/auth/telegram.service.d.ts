export interface TelegramUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
}
export declare class TelegramService {
    private readonly botToken;
    private readonly isDev;
    validateInitData(initData: string): TelegramUser | null;
    private parseDevInitData;
    private parseAndValidate;
}
