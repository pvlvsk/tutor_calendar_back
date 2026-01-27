-- Миграция: Добавление responseBody в request_logs
-- Дата: 2026-01-27

-- Добавляем поле для хранения тела ответа при ошибках
ALTER TABLE "request_logs" 
ADD COLUMN IF NOT EXISTS "responseBody" TEXT;

-- Комментарий к полю
COMMENT ON COLUMN "request_logs"."responseBody" IS 'Тело ответа для ошибочных запросов (4xx/5xx)';
