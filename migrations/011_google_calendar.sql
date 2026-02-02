-- Миграция для Google Calendar OAuth
-- Добавляем поля для хранения токенов Google

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleRefreshToken" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleCalendarConnected" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleEmail" varchar;
