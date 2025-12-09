import { DataSource } from 'typeorm';
export declare class HealthController {
    private dataSource;
    constructor(dataSource: DataSource);
    check(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        database: {
            status: string;
            latencyMs: number | null;
        };
        memory: {
            heapUsedMB: number;
            heapTotalMB: number;
        };
    }>;
    live(): {
        status: string;
    };
    ready(): Promise<{
        status: string;
    }>;
}
