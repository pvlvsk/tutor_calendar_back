-- Migration: Meeting URL
-- Добавляет поле meetingUrl для ссылки на онлайн-встречу (Zoom, Google Meet и т.д.)

-- 1. Добавляем поле meetingUrl в таблицу lessons
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS "meetingUrl" VARCHAR(500);

-- 2. Добавляем поле meetingUrl в таблицу lesson_series
ALTER TABLE lesson_series 
ADD COLUMN IF NOT EXISTS "meetingUrl" VARCHAR(500);

