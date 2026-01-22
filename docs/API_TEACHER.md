# API Учителя

Все эндпоинты требуют JWT токен с ролью teacher.

## Профиль

### GET /api/teachers/me

Получить профиль учителя.

### PATCH /api/teachers/me

Обновить профиль.

```json
{ "displayName": "Имя", "bio": "Описание" }
```

### GET /api/teachers/me/invite-link

Получить ссылку-приглашение для учеников.

## Предметы

### GET /api/teachers/me/subjects

Получить список предметов.

### POST /api/teachers/me/subjects

Создать предмет.

```json
{ "name": "Математика", "colorHex": "#4CAF50" }
```

### GET /api/teachers/me/subjects/:id

Получить предмет по ID.

### PATCH /api/teachers/me/subjects/:id

Обновить предмет.

```json
{ "name": "Новое название" }
```

### DELETE /api/teachers/me/subjects/:id

Удалить предмет.

## Ученики

### GET /api/teachers/me/students

Получить список учеников.

### GET /api/teachers/me/students/:studentId

Получить детали ученика.

### DELETE /api/teachers/me/students/:studentId

Удалить связь с учеником.

### GET /api/teachers/me/students/:studentId/stats

Получить статистику ученика.

## Уроки

### GET /api/teachers/me/lessons

Получить уроки за период.
Query: from, to, studentId?, subjectId?, status?

Response включает `students[]` и `isGroupLesson` для каждого урока.

### POST /api/teachers/me/lessons

Создать урок (поддерживает групповые уроки).

```json
{
  "studentIds": ["uuid1", "uuid2"], // Массив учеников (может быть пустым)
  "subjectId": "uuid",
  "startAt": "2025-01-15T10:00:00Z",
  "durationMinutes": 60,
  "priceRub": 2000,
  "isFree": false // Опционально, бесплатный урок
}
```

### POST /api/teachers/me/lessons/recurring

Создать повторяющиеся уроки.

```json
{
  "studentIds": ["uuid1", "uuid2"], // Массив учеников
  "subjectId": "uuid",
  "startDate": "2025-01-15",
  "time": "10:00",
  "durationMinutes": 60,
  "priceRub": 2000,
  "isFree": false,
  "frequency": "weekly",
  "daysOfWeek": [1, 3],
  "endDate": "2025-06-30"
}
```

### GET /api/teachers/me/lessons/:id

Получить урок с детализацией по ученикам.

Response:

```json
{
  "id": "uuid",
  "startAt": "2025-01-15T10:00:00Z",
  "durationMinutes": 60,
  "priceRub": 2000,
  "isFree": false,
  "status": "planned",
  "isGroupLesson": true,
  "students": [
    {
      "id": "lesson-student-uuid",
      "studentId": "student-uuid",
      "firstName": "Иван",
      "lastName": "Петров",
      "priceRub": 2000,
      "attendance": "unknown",
      "rating": null,
      "paymentStatus": "unpaid"
    }
  ],
  "subject": { "name": "Математика", "colorHex": "#4CAF50" }
}
```

### PATCH /api/teachers/me/lessons/:id

Обновить урок (базовые поля).

Query параметры:

- `applyToSeries` — применить изменения к серии: `this` | `future` | `all`

```json
{
  "startAt": "2025-01-15T11:00:00Z",
  "durationMinutes": 90,
  "priceRub": 2500,
  "isFree": false,
  "subjectId": "uuid",
  "studentIds": ["uuid1", "uuid2"], // Обновить список учеников
  "status": "cancelled",
  "cancelledBy": "teacher"
}
```

**Обновление учеников (`studentIds`):**

- При передаче `studentIds` — полностью заменяет список учеников на уроке
- Удаляет старые записи из `lesson_students` и создаёт новые
- При `applyToSeries=all` или `future` — обновляет учеников на всех уроках серии
- Также обновляет таблицу `lesson_series_students` для серии
- Если `isFree=true` — цена для всех учеников устанавливается в 0

### PATCH /api/teachers/me/lessons/:id/complete

Отметить урок как проведённый с индивидуальными данными по ученикам.

```json
{
  "students": [
    {
      "studentId": "uuid",
      "attendance": "attended",
      "rating": 5,
      "paymentStatus": "paid"
    },
    {
      "studentId": "uuid2",
      "attendance": "missed"
    }
  ]
}
```

### POST /api/teachers/me/lessons/:id/students

Добавить ученика на урок.

```json
{ "studentId": "uuid", "priceRub": 2000 }
```

### DELETE /api/teachers/me/lessons/:id/students/:studentId

Удалить ученика с урока.

### DELETE /api/teachers/me/lessons/:id

Удалить урок.
Query: applyTo? (this | future | all) — для серий

### DELETE /api/teachers/me/lessons/:id/series

Удалить все уроки серии.

### PUT /api/teachers/me/lessons/:id/note

Обновить заметку к уроку.

```json
{ "note": "Текст заметки" }
```

## Долги

### GET /api/teachers/me/debts

Получить сводку по долгам.

### GET /api/teachers/me/students/:studentId/debt

Получить детальный долг ученика.
