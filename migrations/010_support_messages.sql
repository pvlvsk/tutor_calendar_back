-- Migration: 010_support_messages
-- Description: Создает таблицу для сообщений в поддержку
-- Date: 2026-02-02

-- Таблица сообщений в поддержку
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages("userId");
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages("createdAt" DESC);

-- Комментарии
COMMENT ON TABLE support_messages IS 'Сообщения пользователей в поддержку';
COMMENT ON COLUMN support_messages.status IS 'Статус: new, in_progress, resolved, closed';
