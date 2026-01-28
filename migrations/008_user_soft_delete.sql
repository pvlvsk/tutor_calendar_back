-- Миграция: Soft delete для пользователей
-- Дата: 2026-01-27
-- Описание: Добавляет поле deletedAt для мягкого удаления аккаунтов с возможностью восстановления

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Индекс для быстрого поиска удалённых пользователей
CREATE INDEX IF NOT EXISTS "IDX_users_deletedAt" ON "users" ("deletedAt");
