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

#### Telegram / MAX (Mini App)

- POST /init — инициализация через Telegram initData
- POST /init-max — инициализация через MAX initData
- POST /select-role — выбор роли (для мульти-ролевых)
- POST /add-role — добавление новой роли (требует JWT)
- POST /accept-invitation — принять разовое приглашение
- POST /join — присоединиться по постоянной ссылке учителя/ученика (Telegram/MAX)
- POST /join-web — присоединиться по постоянной ссылке (веб-пользователь, JWT)

#### Email-аутентификация (основной поток)

- POST /register-email — регистрация (email + пароль → 4-значный код на почту)
- POST /verify-code — подтверждение кода (завершает регистрацию, выдаёт JWT)
- POST /resend-code — переотправить код верификации
- POST /login-email — вход по email + пароль
- GET /me-web — получить профиль (JWT)
- POST /forgot-password — запрос сброса пароля
- POST /reset-password — установка нового пароля по токену

#### Связывание аккаунтов

- POST /link-email — привязать email к TG-аккаунту (JWT)
- POST /link-telegram — привязать Telegram к email-аккаунту (initData + email + пароль)
- POST /auto-link-telegram — автопривязка Telegram после email-логина в Mini App (JWT)
- POST /auto-link-max — автопривязка MAX после email-логина в Mini App (JWT)
- POST /link-max — привязать MAX аккаунт (JWT)

#### Прочее

- GET /me — профиль через Telegram initData
- POST /refresh — обновить JWT
- POST /activate-beta — активация бета-тестера
- GET /beta-status — статус бета
- POST /delete-account — мягкое удаление (7 дней на восстановление)
- POST /restore-account — восстановление удалённого аккаунта

**Поток регистрации по email (с кодом):**

```
1. POST /api/auth/register-email
   Body: { email, password, firstName, role, lastName?, referralSource? }
   Response: { pendingVerification: true, userId, email, role }

2. Пользователь получает 4-значный код на email (действителен 10 минут)

3. POST /api/auth/verify-code
   Body: { userId, code, role }
   Response: { token, user, roles, currentRole }

   При неверном коде: 400 INVALID_CODE
   При истёкшем коде: 400 CODE_EXPIRED (нужно POST /resend-code)

4. POST /api/auth/resend-code (при необходимости)
   Body: { userId }
   Response: { success: true }
```

**JWT:** токен действителен 30 дней. После истечения — повторный вход email + пароль (без кода).

**Поток автопривязки MAX (после email-логина в MAX Mini App):**

```
1. Пользователь открывает Mini App в MAX
2. initAuth на фронте определяет platform='max'
3. POST /api/auth/init-max { initData }
   — Если maxId привязан → возвращает token, user с maxId
   — Если нет → isNewUser: true → показываем email-логин

4. Пользователь логинится по email + пароль → POST /api/auth/login-email
5. После успешного логина фронт автоматически вызывает:
   POST /api/auth/auto-link-max { initData }
   Authorization: Bearer <token>

6. Бэкенд привязывает MAX ID к аккаунту
7. Фронт обновляет user через GET /api/auth/me-web

При следующем входе в MAX → init-max найдёт пользователя по maxId → авто-логин.
```

**Ручная привязка MAX (из профиля):**

```
POST /api/auth/link-max
Authorization: Bearer <token>
{ "initData": "<MAX initData>" }

Ошибки:
- 401 INVALID_MAX_INIT_DATA — невалидные данные MAX
- 409 MAX_ACCOUNT_ALREADY_LINKED — этот MAX ID уже привязан к другому аккаунту
```

**Универсальные ссылки-приглашения (Invite Gateway):**

```
Все ссылки-приглашения (T_xxx, P_xxx, INV_xxx) ведут на:
  https://tutorscalendar.ru/invite/{CODE}

Формат URL генерируется через generateInviteUrl(code) на бэкенде.
Fallback: https://tutorscalendar.ru (если WEBAPP_URL не задан в env).

На странице InviteGateway пользователь выбирает платформу:
  1. Telegram — открывает t.me/bot?startapp=CODE
  2. MAX — открывает max.ru/bot?startapp=CODE
  3. Браузер (Web) — два варианта:
     a) Авторизован → POST /api/auth/join-web (JWT) → принять приглашение
     b) Не авторизован → сохраняет CODE в sessionStorage → логин/регистрация →
        после успешного входа authSlice подхватывает код и вызывает acceptInvitation
```

**POST /api/auth/join-web (новый эндпоинт):**

```
Authorization: Bearer <token>
Body: { "referralCode": "T_abc123" }

Маршрутизация по префиксу:
  T_xxx → linkStudentToTeacher (создаёт/находит studentProfile, привязывает к учителю)
  P_xxx → linkParentToStudent (создаёт/находит parentProfile, привязывает к ученику)

Ответ аналогичен POST /join, но без TG-уведомлений (веб-пользователь).

Ошибки:
  - 404 USER_NOT_FOUND — пользователь JWT не найден
  - 404 TEACHER_NOT_FOUND — учитель по T_ коду не найден
  - 404 STUDENT_NOT_FOUND — ученик по P_ коду не найден
  - 400 INVALID_REFERRAL_CODE — неизвестный формат кода
  - 400 STUDENT_HAS_NO_TEACHERS — у ученика нет привязанных учителей
```

#### Безопасность: RequireProfileGuard

Контроллеры teacher, student, parent защищены `RequireProfileGuard`.
Если JWT токен не содержит `profileId`, запрос блокируется с ошибкой `403 PROFILE_REQUIRED`.

Это защищает от ситуации, когда TypeORM при `findOne({ where: { id: undefined } })`
тихо игнорирует undefined-условие и может вернуть данные другого пользователя.

**JWT payload (все auth-сервисы):**

```json
{
  "sub": "user-uuid",
  "telegramId": 705554674,
  "maxId": 15071600,
  "role": "teacher",
  "profileId": "teacher-profile-uuid",
  "isBetaTester": false
}
```

Все три auth-сервиса (auth.service, email-auth.service, max-auth.service) генерируют
токены с одинаковым набором полей, включая `profileId`.

#### formatUser: обязательные поля

Все `formatUser` методы возвращают одинаковый набор полей:

```json
{
  "id": "user-uuid",
  "telegramId": 705554674,
  "maxId": "15071600",
  "firstName": "Dmitriy",
  "lastName": "Pavlovskii",
  "username": "dpavlovskii",
  "email": "pvlvsk.d@gmail.com",
  "emailVerified": true,
  "isBetaTester": false
}
```

### Teachers (/api/teachers)

Требует роль: teacher. Защищён `RequireProfileGuard` (403 если нет profileId).

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

Требует роль: student. Защищён `RequireProfileGuard`.

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

Требует роль: parent. Защищён `RequireProfileGuard`.

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

### Support (/api/support)

Обратная связь и сообщения в поддержку.

- POST / — отправить сообщение в поддержку (требует auth)
- GET /my — получить свои сообщения (требует auth)

**Создание сообщения:**
```bash
POST /api/support
Authorization: Bearer <token>
{
  "subject": "Предложение по улучшению",
  "message": "Было бы здорово добавить..."
}

# Ответ:
{ "success": true, "message": "Сообщение отправлено", "id": "uuid" }
```

### Health (/api/health)

- GET / - проверка состояния

## База данных

PostgreSQL через TypeORM.

Entities:

- User — пользователь (email, telegramId, maxId, referralSource, emailVerified, deletedAt)
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
- UserNotificationSettings — настройки уведомлений пользователя
- SupportMessage — сообщения в поддержку
- AdminUser — администраторы
- RequestLog — логи запросов
- AnalyticsEvent — аналитические события

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
