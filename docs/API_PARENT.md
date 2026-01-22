# API Родителя

Все эндпоинты требуют JWT токен с ролью parent.

## Профиль

### GET /api/parents/me
Получить профиль родителя.

### PATCH /api/parents/me
Обновить профиль.
```json
{ "customFields": { "phone": "+7999..." } }
```

## Дети

### GET /api/parents/me/children
Получить список детей.

### GET /api/parents/me/children/:childId
Получить детали ребёнка.

### GET /api/parents/me/children/:childId/teachers
Получить учителей ребёнка.

### GET /api/parents/me/children/:childId/teachers/:teacherId
Получить информацию об учителе ребёнка.

## Уроки детей

### GET /api/parents/me/children/:childId/lessons
Получить уроки ребёнка за период.
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

### GET /api/parents/me/children/:childId/lessons/:lessonId
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
  "isGroupLesson": true,
  "totalStudentsCount": 3,
  "otherStudentsCount": 2,
  "teacher": { "firstName": "Иван", "lastName": "Петров" },
  "subject": { "name": "Математика", "colorHex": "#4CAF50" }
}
```

**Примечание:** Для групповых уроков родитель видит только количество участников.

## Статистика

### GET /api/parents/me/children/:childId/stats
Получить статистику ребёнка.

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
      "missedLessons": [
        { "lessonId": "uuid", "startAt": "2025-01-15T10:00:00Z", "subjectName": "Математика" }
      ],
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

### GET /api/parents/me/children/:childId/debt
Получить информацию о долге за ребёнка.

## Уведомления

### GET /api/parents/me/notification-settings
Получить настройки уведомлений.

### PATCH /api/parents/me/notification-settings
Обновить настройки уведомлений для всех детей.
```json
{
  "children": [
    { "childId": "uuid", "notificationsEnabled": true }
  ]
}
```

### PATCH /api/parents/me/children/:childId/notifications
Обновить уведомления для конкретного ребёнка.
```json
{ "notificationsEnabled": false }
```
