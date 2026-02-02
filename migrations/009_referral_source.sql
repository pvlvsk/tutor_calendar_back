-- Migration: 009_referral_source
-- Description: Добавляет поле referralSource для отслеживания источника регистрации
-- Date: 2026-01-30

-- Добавляем поле referralSource в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "referralSource" VARCHAR(100) NULL;

-- Добавляем индекс для быстрого поиска по источнику
CREATE INDEX IF NOT EXISTS idx_users_referral_source ON users("referralSource");

-- Комментарий к полю
COMMENT ON COLUMN users."referralSource" IS 'Источник регистрации (реферальная метка, например: manager_username, VKTARGET, instagram и т.д.)';
