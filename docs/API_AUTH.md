# API Авторизации

## POST /api/auth/init

Инициализация пользователя через Telegram initData.

### Headers
```
X-Telegram-Init-Data: <initData>
```

### Request Body (опционально)
```json
{
  "invitationToken": "T_xxx"
}
```

### Response
```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "uuid",
    "telegramId": 123456789,
    "firstName": "Имя",
    "lastName": "Фамилия",
    "username": "username"
  },
  "roles": ["teacher", "student"],
  "profiles": {
    "teacher": {
      "id": "uuid",
      "displayName": "Имя Фамилия",
      "referralCode": "T_xxx"
    },
    "student": {
      "id": "uuid"
    }
  },
  "isNewUser": false
}
```

## POST /api/auth/select-role

Выбор активной роли для текущей сессии (для пользователей с несколькими ролями).

### Request Body
```json
{
  "initData": "<telegram-init-data>",
  "role": "teacher"
}
```

### Response
```json
{
  "user": {
    "id": "uuid",
    "telegramId": 123456789,
    "firstName": "Имя",
    "lastName": "Фамилия"
  },
  "roles": ["teacher", "student"],
  "currentRole": "teacher",
  "token": "jwt-token"
}
```

## POST /api/auth/add-role

Добавление новой роли существующему пользователю.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "role": "teacher"
}
```

### Response
```json
{
  "user": {
    "id": "uuid",
    "telegramId": 123456789,
    "firstName": "Имя",
    "lastName": "Фамилия"
  },
  "roles": ["student", "teacher"],
  "currentRole": "teacher",
  "token": "jwt-token"
}
```

### Ошибки
- `401 Unauthorized` — пользователь не авторизован
- `409 Conflict (ROLE_EXISTS)` — роль уже существует у пользователя

## POST /api/auth/beta-activate

Активация бета-тестера.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "betaCode": "BETA_CODE"
}
```

### Response
```json
{
  "success": true,
  "message": "Бета-тестер активирован",
  "roles": ["teacher", "student"]
}
```

## GET /api/auth/beta-status

Проверка статуса бета-тестера.

### Headers
```
Authorization: Bearer <token>
```

### Response
```json
{
  "isBetaTester": true
}
```

## Формат JWT токена

```json
{
  "sub": "user-uuid",
  "telegramId": 123456789,
  "role": "teacher",
  "profileId": "profile-uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## POST /api/auth/join

Присоединение по реферальной ссылке (для существующих и новых пользователей).

### Request Body
```json
{
  "initData": "<telegram-init-data>",
  "referralCode": "T_xxx"
}
```

### Response (для ученика)
```json
{
  "user": {
    "id": "uuid",
    "telegramId": 123456789,
    "firstName": "Имя",
    "lastName": "Фамилия"
  },
  "roles": ["student"],
  "currentRole": "student",
  "token": "jwt-token",
  "teacher": {
    "id": "teacher-uuid",
    "displayName": "Иван Петров"
  },
  "parentInviteCode": "P_xxx",
  "parentInviteUrl": "https://t.me/bot?startapp=P_xxx"
}
```

### Response (для родителя)
```json
{
  "user": { ... },
  "roles": ["parent"],
  "currentRole": "parent",
  "token": "jwt-token",
  "student": {
    "id": "student-uuid",
    "name": "Петя Иванов"
  }
}
```

### Поведение
- Если пользователь **новый** — создаётся профиль и привязывается к учителю/ученику
- Если пользователь **существует** — добавляется роль (если её нет) и привязывается к учителю/ученику
- На фронтенде показывается модалка с результатом:
  - Если роль изменилась: "Вы стали учеником у [Учитель]. Чтобы сменить роль, перейдите в Профиль"
  - Если роль не изменилась: "У вас появился новый учитель: [Учитель]"

---

## Коды приглашений

| Префикс | Тип      | Описание               |
| ------- | -------- | ---------------------- |
| `T_xxx` | Ученик   | Приглашение от учителя |
| `P_xxx` | Родитель | Приглашение от ученика |
