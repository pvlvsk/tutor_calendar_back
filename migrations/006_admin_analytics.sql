-- Миграция: Админ-панель и аналитика
-- Дата: 2026-01-26

-- ============================================
-- Таблица администраторов
-- ============================================
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "login" VARCHAR(100) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- Таблица логов запросов
-- ============================================
CREATE TABLE IF NOT EXISTS "request_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "userId" UUID,
    "userRole" VARCHAR(20),
    "clientIp" VARCHAR(50),
    "userAgent" TEXT,
    "requestBody" TEXT,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Индексы для request_logs
CREATE INDEX IF NOT EXISTS "idx_request_logs_created_at" ON "request_logs" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_request_logs_status_code" ON "request_logs" ("statusCode");
CREATE INDEX IF NOT EXISTS "idx_request_logs_method_path" ON "request_logs" ("method", "path");

-- ============================================
-- Таблица аналитических событий
-- ============================================
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "eventName" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),
    "userId" UUID,
    "userRole" VARCHAR(20),
    "pagePath" VARCHAR(500),
    "metadata" JSONB,
    "appVersion" VARCHAR(20),
    "platform" VARCHAR(20) NOT NULL DEFAULT 'web',
    "sessionId" VARCHAR(100),
    "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Индексы для analytics_events
CREATE INDEX IF NOT EXISTS "idx_analytics_events_created_at" ON "analytics_events" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_analytics_events_event_name" ON "analytics_events" ("eventName");
CREATE INDEX IF NOT EXISTS "idx_analytics_events_user_id" ON "analytics_events" ("userId");

-- ============================================
-- Создание дефолтного админа (admin/admin)
-- Пароль хешируется через bcrypt: admin -> $2b$10$...
-- ============================================
-- Примечание: этот хеш для пароля "admin" сгенерирован с bcrypt
INSERT INTO "admin_users" ("login", "passwordHash")
VALUES ('admin', '$2b$10$vnZZlR8Cb01mCn7ytyZl8.8EPbOTMFPHj3335dboT1EeQF3luJq5i')
ON CONFLICT ("login") DO NOTHING;
