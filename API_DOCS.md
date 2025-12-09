# Backend API Documentation

## Запуск

```bash
cd backend
npm install
npm run start:dev
```

Swagger UI: http://localhost:3000/docs

## Авторизация

Все защищённые эндпоинты требуют JWT токен:
```
Authorization: Bearer <token>
```

## Модули

### Auth (/api/auth)
- POST /init - инициализация через Telegram
- POST /select-role - выбор роли
- POST /beta-activate - активация бета
- GET /beta-status - статус бета

### Teachers (/api/teachers)
Требует роль: teacher

- GET/PATCH /me - профиль
- GET /me/invite-link - ссылка приглашения
- GET/POST /me/subjects - предметы
- GET/PATCH/DELETE /me/subjects/:id
- GET /me/students - ученики
- GET/DELETE /me/students/:id
- GET /me/students/:id/stats
- GET/POST /me/lessons - уроки
- POST /me/lessons/recurring - повторяющиеся
- GET/PATCH/DELETE /me/lessons/:id
- DELETE /me/lessons/:id/series
- PUT /me/lessons/:id/note
- GET /me/debts

### Students (/api/students)
Требует роль: student

- GET/PATCH /me - профиль
- GET /me/parent-invite-link
- GET /me/teachers
- GET /me/teachers/:id
- GET /me/lessons
- GET /me/lessons/:id
- PUT /me/lessons/:id/private-note
- GET /me/stats
- GET /me/achievements

### Parents (/api/parents)
Требует роль: parent

- GET/PATCH /me - профиль
- GET /me/children
- GET /me/children/:id
- GET /me/children/:id/teachers
- GET /me/children/:id/teachers/:teacherId
- GET /me/children/:id/lessons
- GET /me/children/:id/lessons/:lessonId
- GET /me/children/:id/stats
- GET /me/children/:id/debt
- GET/PATCH /me/notification-settings
- PATCH /me/children/:id/notifications

### Health (/api/health)
- GET / - проверка состояния

## База данных

PostgreSQL через TypeORM.

Entities:
- User
- TeacherProfile
- StudentProfile
- ParentProfile
- Subject
- Lesson
- LessonSeries
- LessonStudent — связь урок-ученик с индивидуальными данными (цена, посещаемость, оценка, оплата)
- LessonSeriesStudent — связь серия-ученик
- Invitation
- TeacherStudentLink
- ParentStudentRelation

### Групповые уроки

Уроки поддерживают несколько учеников через таблицу `lesson_students`:
- Каждый ученик имеет индивидуальную цену, посещаемость, оценку и статус оплаты
- `isGroupLesson` — вычисляемое поле (true если учеников > 1)
- `isFree` — флаг бесплатного урока (все цены = 0)
