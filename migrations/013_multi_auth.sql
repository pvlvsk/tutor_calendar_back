-- Миграция: мультиканальная аутентификация (email + MAX + nullable telegramId)
-- Позволяет пользователям входить через email/пароль, Telegram или MAX

-- 1. Сделать telegramId nullable (для веб-пользователей без Telegram)
ALTER TABLE users ALTER COLUMN "telegramId" DROP NOT NULL;

-- 2. Добавить поля для email-аутентификации
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerificationToken" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailTokenExpiresAt" TIMESTAMP;

-- 3. Добавить MAX messenger ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS "maxId" BIGINT UNIQUE;

-- 4. Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_max_id ON users ("maxId") WHERE "maxId" IS NOT NULL;
