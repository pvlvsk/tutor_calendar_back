-- Migration: Group Lessons
-- Добавляет поддержку нескольких учеников на один урок

-- 1. Создаём таблицу lesson_students
CREATE TABLE IF NOT EXISTS lesson_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId" UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  "priceRub" INTEGER NOT NULL,
  attendance VARCHAR(20) DEFAULT 'unknown',
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  "paymentStatus" VARCHAR(20) DEFAULT 'unpaid',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("lessonId", "studentId")
);

CREATE INDEX IF NOT EXISTS idx_lesson_students_lesson ON lesson_students("lessonId");
CREATE INDEX IF NOT EXISTS idx_lesson_students_student ON lesson_students("studentId");

-- 2. Создаём таблицу lesson_series_students
CREATE TABLE IF NOT EXISTS lesson_series_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "seriesId" UUID NOT NULL REFERENCES lesson_series(id) ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  "priceRub" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("seriesId", "studentId")
);

CREATE INDEX IF NOT EXISTS idx_series_students_series ON lesson_series_students("seriesId");
CREATE INDEX IF NOT EXISTS idx_series_students_student ON lesson_series_students("studentId");

-- 3. Мигрируем данные из lessons в lesson_students
INSERT INTO lesson_students ("lessonId", "studentId", "priceRub", attendance, "paymentStatus")
SELECT id, "studentId", "priceRub", attendance, "paymentStatus"
FROM lessons
WHERE "studentId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Мигрируем данные из lesson_series в lesson_series_students
INSERT INTO lesson_series_students ("seriesId", "studentId", "priceRub")
SELECT id, "studentId", "priceRub"
FROM lesson_series
WHERE "studentId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Добавляем колонку isFree в lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN DEFAULT false;

-- 6. Добавляем колонку isFree в lesson_series
ALTER TABLE lesson_series ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN DEFAULT false;

-- 7. Удаляем старые колонки (только после миграции данных!)
-- ВНИМАНИЕ: эти команды нужно выполнить ПОСЛЕ проверки что данные мигрированы!
-- ALTER TABLE lessons DROP COLUMN IF EXISTS "studentId";
-- ALTER TABLE lessons DROP COLUMN IF EXISTS "attendance";
-- ALTER TABLE lessons DROP COLUMN IF EXISTS "paymentStatus";
-- ALTER TABLE lesson_series DROP COLUMN IF EXISTS "studentId";

SELECT 'Migration 001_group_lessons completed!' as result;
















