-- Migration: 003_subscriptions
-- Description: Добавление таблицы абонементов и полей для типа оплаты

-- 1. Создаём таблицу абонементов
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "teacherId" UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    "studentId" UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('lessons', 'date')),
    "totalLessons" INTEGER,
    "usedLessons" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP,
    name VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP,
    CONSTRAINT unique_active_subscription UNIQUE ("teacherId", "studentId", "deletedAt")
);

-- 2. Индексы для subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_teacher ON subscriptions("teacherId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_student ON subscriptions("studentId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions("teacherId", "studentId") WHERE "deletedAt" IS NULL;

-- 3. Добавляем поле paymentType в lesson_students
ALTER TABLE lesson_students 
ADD COLUMN IF NOT EXISTS "paymentType" VARCHAR(20) NOT NULL DEFAULT 'fixed';

-- 4. Добавляем поле paidFromSubscription в lesson_students
ALTER TABLE lesson_students 
ADD COLUMN IF NOT EXISTS "paidFromSubscription" BOOLEAN NOT NULL DEFAULT false;

-- 5. Проверяем constraint на paymentType
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lesson_students_payment_type_check'
    ) THEN
        ALTER TABLE lesson_students 
        ADD CONSTRAINT lesson_students_payment_type_check 
        CHECK ("paymentType" IN ('fixed', 'free', 'subscription'));
    END IF;
END $$;
