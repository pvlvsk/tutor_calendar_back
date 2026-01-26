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
docker compose up -d              # Запустить
docker compose down               # Остановить
docker compose up -d --build      # Пересобрать всё
docker compose restart backend    # Быстрый перезапуск бэкенда
docker compose logs -f backend    # Логи
```

### Обновление бэкенда

```bash
# Способ 1: только бэкенд (рекомендуется)
docker compose up -d --build backend

# Способ 2: перезапуск без пересборки
docker compose restart backend
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

---

## Миграции БД

Миграции хранятся в папке `migrations/` и применяются вручную после запуска БД.

### Структура миграций

```
migrations/
├── 001_group_lessons.sql      # Групповые уроки
├── 002_meeting_url.sql        # Ссылка на встречу
├── 003_subscriptions.sql      # Абонементы
└── 004_student_archive.sql    # Архивация учеников
```

### Применение миграции

```bash
# 1. Убедись что postgres запущен
docker compose ps

# 2. Применить миграцию
cat migrations/004_student_archive.sql | docker compose exec -T postgres psql -U postgres -d teach_mini_app
```

> **Примечание:** Используем `cat ... | docker exec -T` вместо `-f /path` для совместимости с Windows (Git Bash)

### Применение всех миграций (первый запуск)

```bash
# Применить все миграции по порядку
for f in migrations/*.sql; do
  echo "Applying $f..."
  cat "$f" | docker compose exec -T postgres psql -U postgres -d teach_mini_app
done
```

### Проверка применённых изменений

```bash
# Посмотреть список таблиц
docker compose exec postgres psql -U postgres -d teach_mini_app -c "\dt"

# Посмотреть структуру таблицы
docker compose exec postgres psql -U postgres -d teach_mini_app -c "\d teacher_student_links"
```

---

## См. также

- [DEPLOYMENT_PROD.md](./DEPLOYMENT_PROD.md) — деплой на продакшен сервер
- [TESTING.md](./TESTING.md) — тестирование

---

## ⚠️ Полный сброс БД (ОПАСНО!)

> **Используй ТОЛЬКО если точно нужно удалить ВСЕ данные и начать с нуля.**
> Это действие НЕОБРАТИМО!

```bash
# 1. Остановить контейнеры И удалить volumes
docker compose down -v

# 2. Запустить заново
docker compose up -d

# 3. Настроить пароль postgres
docker exec -it teach-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# 4. Применить все миграции
for f in migrations/*.sql; do
  echo "Applying $f..."
  cat "$f" | docker compose exec -T postgres psql -U postgres -d teach_mini_app
done

# 5. Перезапустить backend
docker compose restart backend
```
