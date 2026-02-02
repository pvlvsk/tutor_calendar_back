-- Добавляем поле importSource для уроков
-- 'google' - импортирован из Google Calendar
-- 'ics' - импортирован из ICS файла
-- null - создан вручную

ALTER TABLE "lessons" ADD COLUMN "importSource" character varying(50) DEFAULT NULL;
