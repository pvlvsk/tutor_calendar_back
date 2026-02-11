-- Migration: 010_support_nullable_user
-- Description: Разрешаем NULL для userId в support_messages (для сообщений с лендинга)
-- Date: 2026-02-11

ALTER TABLE support_messages ALTER COLUMN "userId" DROP NOT NULL;
