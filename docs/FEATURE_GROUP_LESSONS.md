# Групповые уроки — Техническая документация

## Обзор

Функционал позволяет добавлять несколько учеников на один урок с индивидуальным отслеживанием посещаемости, оценок и оплаты.

---

## База данных

### Новая таблица `lesson_students`

```sql
CREATE TABLE lesson_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,

  -- Индивидуальные данные ученика на уроке
  price_rub INTEGER NOT NULL,              -- Цена для этого ученика
  attendance VARCHAR(20) DEFAULT 'unknown', -- attended | missed | unknown
  rating INTEGER CHECK (rating >= 0 AND rating <= 5), -- 0-5 звёзд (NULL = не выставлена)
  payment_status VARCHAR(20) DEFAULT 'unpaid', -- paid | unpaid

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(lesson_id, student_id)
);

CREATE INDEX idx_lesson_students_lesson ON lesson_students(lesson_id);
CREATE INDEX idx_lesson_students_student ON lesson_students(student_id);
```

### Изменения в `lessons`

```sql
-- Добавляем
ALTER TABLE lessons ADD COLUMN is_free BOOLEAN DEFAULT false;

-- Удаляем (данные мигрируются в lesson_students)
ALTER TABLE lessons DROP COLUMN student_id;
ALTER TABLE lessons DROP COLUMN attendance;
ALTER TABLE lessons DROP COLUMN payment_status;

-- Оставляем
-- price_rub — дефолтная цена при добавлении ученика
-- status — planned | done | cancelled
```

### Изменения в `lesson_series`

```sql
-- Удаляем
ALTER TABLE lesson_series DROP COLUMN student_id;

-- Добавляем
ALTER TABLE lesson_series ADD COLUMN is_free BOOLEAN DEFAULT false;
```

### Новая таблица `lesson_series_students`

```sql
CREATE TABLE lesson_series_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID NOT NULL REFERENCES lesson_series(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  price_rub INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(series_id, student_id)
);
```

---

## Миграция существующих данных

```sql
-- 1. Создать записи в lesson_students из существующих уроков
INSERT INTO lesson_students (lesson_id, student_id, price_rub, attendance, payment_status)
SELECT
  id,
  student_id,
  price_rub,
  attendance,
  payment_status
FROM lessons
WHERE student_id IS NOT NULL;

-- 2. Создать записи в lesson_series_students
INSERT INTO lesson_series_students (series_id, student_id, price_rub)
SELECT
  id,
  student_id,
  price_rub
FROM lesson_series
WHERE student_id IS NOT NULL;
```

---

## Backend API

### Создание урока

**POST** `/teacher/me/lessons`

```typescript
interface CreateLessonRequest {
  subjectId: string;
  startAt: string; // ISO date
  durationMinutes: number;
  priceRub: number; // Дефолтная цена
  isFree?: boolean; // Бесплатный урок
  studentIds?: string[]; // Список учеников (может быть пустым)
  recurrence?: RecurrenceData;
}
```

**Логика:**

- Если `isFree = true` → все `lesson_students.price_rub = 0`
- Если `isFree = false` → `lesson_students.price_rub = lesson.priceRub`
- При создании серии → копировать `studentIds` во все уроки

### Получение урока

**GET** `/teacher/me/lessons/:id`

```typescript
interface LessonWithStudents {
  id: string;
  subjectId: string;
  startAt: string;
  durationMinutes: number;
  priceRub: number; // Дефолтная цена
  isFree: boolean;
  status: "planned" | "done" | "cancelled";

  students: Array<{
    id: string; // lesson_students.id
    studentId: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    priceRub: number;
    attendance: "attended" | "missed" | "unknown";
    rating: number | null;
    paymentStatus: "paid" | "unpaid";
  }>;

  subject: { name: string; colorHex: string };
}
```

### Управление учениками на уроке

**POST** `/teacher/me/lessons/:id/students`

```typescript
// Добавить ученика
{ studentId: string; priceRub?: number; }
```

**DELETE** `/teacher/me/lessons/:id/students/:studentId`

```typescript
// Удалить ученика с урока
```

### Отметка урока как проведённого

**PATCH** `/teacher/me/lessons/:id/complete`

```typescript
interface CompleteLessonRequest {
  students: Array<{
    studentId: string;
    attendance: "attended" | "missed";
    rating?: number; // 0-5, только если attended
    paymentStatus?: "paid" | "unpaid"; // только если attended
  }>;
}
```

**Бизнес-логика:**

- Если `attendance = 'missed'`:
  - `rating = null`
  - `paymentStatus = null` (не требуется оплата)
- Устанавливает `lesson.status = 'done'`

### Обновление урока с изменением учеников

**PATCH** `/teacher/me/lessons/:id?applyToSeries=all|future|this`

```typescript
interface UpdateLessonRequest {
  subjectId?: string;
  startAt?: string;
  durationMinutes?: number;
  priceRub?: number;
  isFree?: boolean;
  studentIds?: string[]; // Полностью заменяет список учеников
  status?: LessonStatus;
}
```

**Логика при передаче `studentIds`:**

1. **Один урок (`applyToSeries=this` или не указан):**

   - Удаляются все записи из `lesson_students` для этого урока
   - Создаются новые записи для каждого `studentId`
   - `priceRub` берётся из `data.priceRub` или из урока (0 если `isFree=true`)

2. **Серия (`applyToSeries=all` или `future`):**
   - Находятся все уроки серии (все или будущие)
   - Для каждого урока: удаляются старые `lesson_students`, создаются новые
   - Обновляется таблица `lesson_series_students`:
     - Удаляются все записи для серии
     - Создаются новые записи для каждого `studentId`

```typescript
// Пример: сделать урок групповым и применить ко всей серии
PATCH /teacher/me/lessons/abc123?applyToSeries=all
{
  "studentIds": ["student1", "student2"],
  "isFree": true
}
```

### Массовые операции

**PATCH** `/teacher/me/lessons/:id/students/bulk`

```typescript
interface BulkUpdateRequest {
  action: "set_attendance" | "set_rating" | "set_payment";
  value: "attended" | "missed" | number | "paid" | "unpaid";
}
```

---

## Frontend

### CreateLessonModal

**Изменения:**

1. Чекбокс "Бесплатный урок" рядом с ценой
2. Переключатель "Один ученик / Группа"
3. При "Группа" → `MultiSelect` для выбора нескольких учеников

```typescript
interface CreateLessonData {
  subjectId: string;
  date: string;
  time: string;
  durationMinutes: number;
  priceRub: number;
  isFree?: boolean; // NEW
  studentIds?: string[]; // NEW (массив вместо studentId)
  recurrence?: RecurrenceData;
}
```

### LessonModal (просмотр/редактирование)

**Новая секция "Ученики":**

- Список учеников с аватарами
- Кнопка "Добавить ученика"
- Кнопка удаления у каждого

### CompleteLessonModal (отметка урока)

**UI:**

```
┌─────────────────────────────────────────┐
│ Отметить урок                           │
├─────────────────────────────────────────┤
│ [✓] Были все    [Оценка всем: ★★★★★]   │
│ [✓] Заплатили все                       │
├─────────────────────────────────────────┤
│ Иван Петров                             │
│ [✓] Был  ★★★★☆  [✓] Оплатил  500₽      │
├─────────────────────────────────────────┤
│ Мария Сидорова                          │
│ [ ] Был  -----  [ ] Оплатил  500₽      │
│ (пропустил — оценка и оплата не нужны) │
├─────────────────────────────────────────┤
│           [Сохранить]                   │
└─────────────────────────────────────────┘
```

**Логика:**

- "Были все" → ставит `attendance = 'attended'` всем
- "Оценка всем" → ставит выбранную оценку всем с `attendance = 'attended'`
- "Заплатили все" → ставит `paymentStatus = 'paid'` всем с `attendance = 'attended'`
- Если `attendance = 'missed'` → оценка и оплата дизейблятся

### LessonCard (календарь)

**Отображение:**

- 1 ученик: "Иван Петров"
- 2-3 ученика: "Иван, Мария, Петр"
- 4+ учеников: "4 ученика"

---

## Shared Types

```typescript
// lesson.ts

export interface LessonStudent {
  id: string;
  studentId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  priceRub: number;
  attendance: AttendanceStatus;
  rating: number | null;
  paymentStatus: PaymentStatus;
}

export interface Lesson {
  id: string;
  seriesId?: string;
  teacherId: string;
  subjectId: string;
  startAt: string;
  durationMinutes: number;
  priceRub: number; // Дефолтная цена
  isFree: boolean; // NEW
  status: LessonStatus;
  // attendance — УДАЛЕНО (теперь per-student)
  // paymentStatus — УДАЛЕНО (теперь per-student)
  // studentId — УДАЛЕНО
  cancelledBy?: CancelledBy;
  // ... остальное без изменений
}

export interface LessonWithDetails extends Lesson {
  students: LessonStudent[]; // NEW (массив вместо student?)
  subject: { name: string; colorHex: string };
}
```

---

## Статистика и долги

### Долг ученика

```sql
SELECT SUM(ls.price_rub) as debt
FROM lesson_students ls
JOIN lessons l ON l.id = ls.lesson_id
WHERE ls.student_id = :studentId
  AND ls.attendance = 'attended'
  AND ls.payment_status = 'unpaid'
  AND l.status = 'done';
```

### Статистика посещаемости

```sql
SELECT
  COUNT(*) FILTER (WHERE attendance = 'attended') as attended,
  COUNT(*) FILTER (WHERE attendance = 'missed') as missed
FROM lesson_students ls
JOIN lessons l ON l.id = ls.lesson_id
WHERE ls.student_id = :studentId
  AND l.status = 'done';
```

---

## План реализации

### Этап 1: Backend ✅ ГОТОВО

1. [x] Создать миграцию БД
2. [x] Создать entity `LessonStudent`
3. [x] Обновить `Lesson` entity
4. [x] Обновить `TeacherService.createLesson`
5. [x] Добавить эндпоинты управления учениками
6. [x] Добавить эндпоинт `complete`
7. [x] Обновить расчёт долгов и статистики

### Этап 2: Frontend ✅ ГОТОВО

1. [x] Обновить `CreateLessonModal` (чекбокс бесплатно + переключатель тип урока + MultiSelect/CustomSelect)
2. [x] Создать `CompleteLessonModal`
3. [x] Обновить `LessonModal`
4. [x] Обновить `LessonCard` (иконка группового урока 👥)
5. [x] Обновить типы в shared

### Этап 3: Тестирование

1. [ ] Миграция существующих данных
2. [ ] Тест создания урока с группой
3. [ ] Тест отметки урока
4. [ ] Тест серий с группой
