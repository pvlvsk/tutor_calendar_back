-- Seed data for teach-mini-app
-- Teacher ID: 80f3f031-c004-47fe-87fd-6c087a8ef2a3

-- 1. Create Subjects
INSERT INTO subjects (id, "teacherId", name, code, "colorHex", "createdAt", "updatedAt") VALUES
  ('11111111-1111-1111-1111-111111111111', '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'Математика', 'math', '#4CAF50', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'Английский', 'english', '#2196F3', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'Физика', 'physics', '#FF9800', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'Химия', 'chemistry', '#9C27B0', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Create test users for students
INSERT INTO users (id, "telegramId", "firstName", "lastName", username, "createdAt", "updatedAt") VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '100001', 'Иван', 'Петров', 'ivan_petrov', NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '100002', 'Мария', 'Сидорова', 'maria_s', NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '100003', 'Алексей', 'Козлов', 'alex_k', NOW(), NOW())
ON CONFLICT ("telegramId") DO NOTHING;

-- 3. Create student profiles
INSERT INTO student_profiles (id, "userId", "parentInviteCode", "createdAt", "updatedAt") VALUES
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PARENT1ABC', NOW(), NOW()),
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PARENT2DEF', NOW(), NOW()),
  ('cccc3333-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'PARENT3GHI', NOW(), NOW())
ON CONFLICT ("userId") DO NOTHING;

-- 4. Link students to teacher
INSERT INTO teacher_student_links (id, "teacherId", "studentId", "createdAt", "updatedAt") VALUES
  ('a1b2c3d4-e5f6-1111-1111-111111111111', '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
  ('a1b2c3d4-e5f6-2222-2222-222222222222', '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), NOW()),
  ('a1b2c3d4-e5f6-3333-3333-333333333333', '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'cccc3333-cccc-cccc-cccc-cccccccccccc', NOW(), NOW())
ON CONFLICT ("teacherId", "studentId") DO NOTHING;

-- 5. Create lessons
-- Today's lessons
INSERT INTO lessons (id, "teacherId", "studentId", "subjectId", "startAt", "durationMinutes", "priceRub", status, attendance, "paymentStatus", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 
   CURRENT_DATE + TIME '10:00', 60, 1500, 'planned', 'unknown', 'unpaid', NOW(), NOW()),
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 
   CURRENT_DATE + TIME '14:30', 45, 1200, 'planned', 'unknown', 'unpaid', NOW(), NOW()),
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'cccc3333-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 
   CURRENT_DATE + TIME '16:00', 90, 2000, 'planned', 'unknown', 'unpaid', NOW(), NOW()),
  -- Overlapping lesson for today (to test overlap display)
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', NULL, '44444444-4444-4444-4444-444444444444', 
   CURRENT_DATE + TIME '10:30', 60, 1500, 'planned', 'unknown', 'unpaid', NOW(), NOW());

-- Tomorrow's lessons  
INSERT INTO lessons (id, "teacherId", "studentId", "subjectId", "startAt", "durationMinutes", "priceRub", status, attendance, "paymentStatus", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 
   CURRENT_DATE + INTERVAL '1 day' + TIME '09:00', 60, 1500, 'planned', 'unknown', 'unpaid', NOW(), NOW()),
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 
   CURRENT_DATE + INTERVAL '1 day' + TIME '11:00', 45, 1200, 'planned', 'unknown', 'unpaid', NOW(), NOW()),
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'cccc3333-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 
   CURRENT_DATE + INTERVAL '1 day' + TIME '15:00', 60, 1500, 'planned', 'unknown', 'unpaid', NOW(), NOW());

-- Day after tomorrow
INSERT INTO lessons (id, "teacherId", "studentId", "subjectId", "startAt", "durationMinutes", "priceRub", status, attendance, "paymentStatus", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 
   CURRENT_DATE + INTERVAL '2 days' + TIME '10:00', 60, 1500, 'planned', 'unknown', 'unpaid', NOW(), NOW()),
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', NULL, '11111111-1111-1111-1111-111111111111', 
   CURRENT_DATE + INTERVAL '2 days' + TIME '13:00', 60, 1500, 'planned', 'unknown', 'unpaid', NOW(), NOW());

-- Yesterday (completed lessons)
INSERT INTO lessons (id, "teacherId", "studentId", "subjectId", "startAt", "durationMinutes", "priceRub", status, attendance, "paymentStatus", "teacherNote", "lessonReport", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 
   CURRENT_DATE - INTERVAL '1 day' + TIME '10:00', 60, 1500, 'done', 'attended', 'paid', 'Повторить тему дробей', 'Урок прошел хорошо, ученик активно работал', NOW(), NOW()),
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 
   CURRENT_DATE - INTERVAL '1 day' + TIME '14:00', 45, 1200, 'done', 'attended', 'paid', NULL, 'Разобрали грамматику Present Perfect', NOW(), NOW());

-- Next week
INSERT INTO lessons (id, "teacherId", "studentId", "subjectId", "startAt", "durationMinutes", "priceRub", status, attendance, "paymentStatus", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 
   CURRENT_DATE + INTERVAL '7 days' + TIME '10:00', 60, 1500, 'planned', 'unknown', 'unpaid', NOW(), NOW()),
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 
   CURRENT_DATE + INTERVAL '7 days' + TIME '14:00', 45, 1200, 'planned', 'unknown', 'unpaid', NOW(), NOW());

-- Cancelled lesson example
INSERT INTO lessons (id, "teacherId", "studentId", "subjectId", "startAt", "durationMinutes", "priceRub", status, attendance, "paymentStatus", "cancelledBy", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), '80f3f031-c004-47fe-87fd-6c087a8ef2a3', 'cccc3333-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 
   CURRENT_DATE + INTERVAL '3 days' + TIME '12:00', 60, 1500, 'cancelled', 'unknown', 'unpaid', 'student', NOW(), NOW());

SELECT 'Seed completed!' as result;
SELECT COUNT(*) as subjects_count FROM subjects WHERE "teacherId" = '80f3f031-c004-47fe-87fd-6c087a8ef2a3';
SELECT COUNT(*) as students_count FROM student_profiles;
SELECT COUNT(*) as lessons_count FROM lessons WHERE "teacherId" = '80f3f031-c004-47fe-87fd-6c087a8ef2a3';
