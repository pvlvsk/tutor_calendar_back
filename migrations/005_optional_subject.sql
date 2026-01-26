-- Сделать subjectId опциональным в уроках и сериях уроков
-- Урок может существовать без привязки к предмету

-- ============================================
-- Таблица lessons
-- ============================================

-- Убираем NOT NULL constraint с subjectId
ALTER TABLE "lessons" ALTER COLUMN "subjectId" DROP NOT NULL;

-- Меняем поведение при удалении предмета: SET NULL вместо CASCADE
ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_lessons_subjectId";
ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_1a23b7c456d890e1f234567890";
ALTER TABLE "lessons" 
  ADD CONSTRAINT "FK_lessons_subjectId" 
  FOREIGN KEY ("subjectId") 
  REFERENCES "subjects"("id") 
  ON DELETE SET NULL;

COMMENT ON COLUMN "lessons"."subjectId" IS 'ID предмета (опционально, урок может быть без предмета)';

-- ============================================
-- Таблица lesson_series
-- ============================================

-- Убираем NOT NULL constraint с subjectId
ALTER TABLE "lesson_series" ALTER COLUMN "subjectId" DROP NOT NULL;

-- Меняем поведение при удалении предмета: SET NULL вместо CASCADE
ALTER TABLE "lesson_series" DROP CONSTRAINT IF EXISTS "FK_lesson_series_subjectId";
ALTER TABLE "lesson_series" DROP CONSTRAINT IF EXISTS "FK_2b34c8d567e901f2345678901";
ALTER TABLE "lesson_series" 
  ADD CONSTRAINT "FK_lesson_series_subjectId" 
  FOREIGN KEY ("subjectId") 
  REFERENCES "subjects"("id") 
  ON DELETE SET NULL;

COMMENT ON COLUMN "lesson_series"."subjectId" IS 'ID предмета (опционально, серия уроков может быть без предмета)';
