# API Ученика

Все эндпоинты требуют JWT токен с ролью student.

## Профиль

### GET /api/students/me
Получить профиль ученика.

### PATCH /api/students/me
Обновить профиль.
```json
{ "customFields": { "school": "Школа №1" } }
```

### GET /api/students/me/parent-invite-link
Получить ссылку-приглашение для родителя.

## Учителя

### GET /api/students/me/teachers
Получить список учителей.

### GET /api/students/me/teachers/:teacherId
Получить информацию об учителе.

## Уроки

### GET /api/students/me/lessons
Получить уроки за период.
Query: from, to, subjectId?, teacherId?, status?

Response (каждый урок):
```json
{
  "id": "uuid",
  "startAt": "2025-01-15T10:00:00Z",
  "durationMinutes": 60,
  "status": "planned",
  "attendance": "unknown",
  "paymentStatus": "unpaid",
  "isGroupLesson": true,
  "totalStudentsCount": 3,
  "otherStudentsCount": 2,
  "teacher": { "firstName": "Иван", "lastName": "Петров" },
  "subject": { "name": "Математика", "colorHex": "#4CAF50" }
}
```

### GET /api/students/me/lessons/:id
Получить детали урока.

Response:
```json
{
  "id": "uuid",
  "startAt": "2025-01-15T10:00:00Z",
  "durationMinutes": 60,
  "status": "planned",
  "attendance": "unknown",
  "paymentStatus": "unpaid",
  "priceRub": 2000,
  "rating": null,
  "teacherNote": "Заметка учителя",
  "lessonReport": null,
  "studentNotePrivate": "Моя заметка",
  "isGroupLesson": true,
  "totalStudentsCount": 3,
  "otherStudentsCount": 2,
  "teacher": { "firstName": "Иван", "lastName": "Петров" },
  "subject": { "name": "Математика", "colorHex": "#4CAF50" }
}
```

**Примечание:** Для групповых уроков ученик видит только количество участников, но не их имена (приватность).

### PUT /api/students/me/lessons/:id/private-note
Обновить личную заметку.
```json
{ "note": "Моя заметка" }
```

## Статистика

### GET /api/students/me/stats
Получить полную статистику.

Response:
```json
{
  "total": {
    "totalLessonsPlanned": 20,
    "totalLessonsAttended": 18,
    "totalLessonsMissed": 2,
    "cancelledByStudent": 0,
    "cancelledByTeacher": 0,
    "cancelledByIllness": 0,
    "attendanceRate": 90
  },
  "bySubject": [
    {
      "subjectId": "uuid",
      "subjectName": "Математика",
      "colorHex": "#4CAF50",
      "lessonsPlanned": 10,
      "lessonsAttended": 9,
      "lessonsMissed": 1,
      "cancelledByStudent": 0,
      "attendanceRate": 90,
      "missedLessons": [],
      "cancelledLessons": [],
      "teacher": {
        "teacherId": "uuid",
        "firstName": "Иван",
        "lastName": "Петров",
        "username": "ivan_teacher"
      }
    }
  ],
  "currentStreak": 5,
  "maxStreak": 10
}
```

### GET /api/students/me/achievements
Получить достижения.
