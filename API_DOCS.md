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
- POST /register - регистрация нового пользователя
- POST /select-role - выбор роли (для мульти-ролевых)
- POST /add-role - добавление новой роли (требует auth)
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

### Bot (/api/bot)

Управление уведомлениями и настройками бота.

#### Настройки уведомлений

- GET /notifications — получить настройки уведомлений пользователя
- POST /notifications/initial — установить первоначальное разрешение (после Telegram requestWriteAccess)
- POST /notifications/toggle — переключить главный выключатель уведомлений
- POST /notifications/preference — обновить настройку для конкретного типа уведомлений
- POST /notifications/preferences — обновить несколько настроек сразу

**Типы уведомлений (NotificationEventType):**

| Тип                  | Описание               |
| -------------------- | ---------------------- |
| `lesson_reminder`    | Напоминания о занятиях |
| `lesson_created`     | Новые занятия          |
| `lesson_cancelled`   | Отмена занятий         |
| `lesson_rescheduled` | Перенос занятий        |
| `payment_reminder`   | Напоминания об оплате  |
| `homework_assigned`  | Домашние задания       |
| `homework_due`       | Сроки домашних заданий |
| `system_message`     | Системные сообщения    |

**Примеры запросов:**

```bash
# Получить настройки
GET /api/bot/notifications
Authorization: Bearer <token>

# Ответ:
{
  "notificationsAsked": true,
  "notificationsEnabled": true,
  "preferences": {
    "lesson_reminder": true,
    "lesson_created": true,
    "payment_reminder": false
  }
}

# Установить первоначальное разрешение
POST /api/bot/notifications/initial
Authorization: Bearer <token>
{ "granted": true }

# Переключить главный выключатель
POST /api/bot/notifications/toggle
Authorization: Bearer <token>
{ "enabled": false }

# Обновить настройку типа
POST /api/bot/notifications/preference
Authorization: Bearer <token>
{ "eventType": "lesson_reminder", "enabled": false }

# Обновить несколько настроек
POST /api/bot/notifications/preferences
Authorization: Bearer <token>
{
  "preferences": {
    "lesson_reminder": true,
    "payment_reminder": false
  }
}
```

#### Тестирование (только для разработки)

- POST /test-send — отправить тестовое сообщение

```bash
POST /api/bot/test-send
X-Admin-Secret: <BOT_TOKEN или BETA_CODE>
{
  "telegramId": 123456789,
  "text": "Тестовое сообщение",
  "buttonText": "Открыть приложение"  // опционально
}
```

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

### User: Поля уведомлений

```typescript
// Было ли показано первоначальное уведомление
notificationsAsked: boolean; // default: false

// Главный выключатель уведомлений (Telegram + наш выбор)
notificationsEnabled: boolean; // default: false

// Настройки по типам уведомлений (JSONB)
notificationPreferences: Record<string, boolean>; // default: {}
```

**Логика:**

1. При первом заходе: `notificationsAsked = false` → показываем запрос
2. После ответа пользователя: `notificationsAsked = true`, `notificationsEnabled = granted`
3. В профиле можно переключать `notificationsEnabled` и настраивать `notificationPreferences`
4. При отправке уведомления проверяется:
   - `notificationsEnabled === true`
   - `notificationPreferences[eventType] !== false` (по умолчанию все включены)

### Групповые уроки

Уроки поддерживают несколько учеников через таблицу `lesson_students`:

- Каждый ученик имеет индивидуальную цену, посещаемость, оценку и статус оплаты
- `isGroupLesson` — вычисляемое поле (true если учеников > 1)
- `isFree` — флаг бесплатного урока (все цены = 0)

**Обновление учеников через PATCH /lessons/:id:**

- Передача `studentIds` в теле запроса полностью заменяет список учеников
- При `applyToSeries=all|future` — обновляет учеников на всех уроках серии
- Также обновляет `lesson_series_students` для синхронизации серии
