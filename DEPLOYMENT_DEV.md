# Локальная разработка Backend

## Требования

- Docker и Docker Compose
- Node.js 18+ (для разработки без Docker)

## Быстрый старт

### 1. Создать .env

```bash
cp .env.dev.example .env
nano .env  # Заполни BOT_TOKEN и BOT_USERNAME
```

### 2. Запустить

```bash
docker compose up -d
```

### 3. Настроить postgres (после первого запуска)

```bash
# Установить пароль (должен совпадать с POSTGRES_PASSWORD в .env)
docker exec -it teach-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Перезапустить backend
docker compose restart backend
```

### 4. Проверить

```bash
curl http://localhost:3000/api/health
```

---

## Управление

```bash
docker compose up -d          # Запустить
docker compose down           # Остановить
docker compose up -d --build  # Пересобрать
docker compose logs -f backend # Логи
docker compose down -v        # Удалить данные (включая БД!)
```

---

## Подключение через DBeaver

В dev режиме порт postgres открыт на localhost:

| Поле | Значение |
|------|----------|
| Host | `localhost` |
| Port | `5432` |
| Database | `teach_mini_app` |
| Username | `postgres` |
| Password | из `.env` (POSTGRES_PASSWORD) |

---

## Запуск без Docker

```bash
# Запустить только базу данных
docker compose up -d postgres

# Установить зависимости
npm install

# Запустить backend в dev режиме
npm run start:dev
```

> **Важно:** Измени `DATABASE_URL` в `.env` — замени `@postgres:5432` на `@localhost:5432`

---

## Переменные .env

| Переменная | Описание | Пример |
|------------|----------|--------|
| `POSTGRES_PASSWORD` | Пароль БД | `postgres123` |
| `DATABASE_URL` | Строка подключения | `postgresql://postgres:postgres123@postgres:5432/teach_mini_app` |
| `JWT_SECRET` | Секрет JWT (мин 32 символа) | `dev-jwt-secret-key-minimum-32-characters` |
| `BOT_TOKEN` | Токен от BotFather | `123456:ABC-DEF...` |
| `BOT_USERNAME` | Username бота | `my_test_bot` |

---

## Troubleshooting

### Ошибка "password authentication failed"

```bash
# Установить пароль (должен совпадать с .env)
docker exec -it teach-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'твой_пароль';"
docker compose restart backend
```

### Полный сброс

```bash
docker compose down -v
docker compose up -d
# Затем установить пароль postgres (см. выше)
```

---

## См. также

- [DEPLOYMENT_PROD.md](./DEPLOYMENT_PROD.md) — деплой на продакшен сервер
- [TESTING.md](./TESTING.md) — тестирование
