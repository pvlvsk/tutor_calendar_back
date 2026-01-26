-- migrations/004_student_archive.sql
-- Архивация учеников (soft delete на 7 дней)

-- Добавить колонку archivedAt в teacher_student_links
ALTER TABLE teacher_student_links 
ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Индекс для быстрого поиска архивных записей
CREATE INDEX IF NOT EXISTS idx_teacher_student_links_archived 
ON teacher_student_links("archivedAt") 
WHERE "archivedAt" IS NOT NULL;

-- Комментарий
COMMENT ON COLUMN teacher_student_links."archivedAt" IS 'Дата архивации. Если NULL - активный ученик. Через 7 дней после архивации запись удаляется.';
