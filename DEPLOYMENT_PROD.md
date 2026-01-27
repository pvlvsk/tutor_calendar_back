# Деплой Backend на продакшен сервер

## Требования

- Ubuntu 20.04+ / Debian 11+
- Docker и Docker Compose v2
- Минимум 1GB RAM, 10GB диска
- Домен с настроенными DNS записями

---

## Быстрый старт

### 1. Установка Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Клонировать проект

```bash
cd ~
git clone git@github.com:pvlvsk/tutor_calendar_back.git
cd tutor_calendar_back
```

### 3. Создать .env

```bash
cp .env.production.example .env
nano .env  # Заполни реальными данными
```

**Важные переменные:**

```env
NODE_ENV=production
POSTGRES_PASSWORD=надёжный_пароль_для_БД
JWT_SECRET=секретный_ключ_минимум_32_символа
BOT_TOKEN=токен_от_BotFather
BOT_USERNAME=имя_бота_без_@
WEBAPP_URL=https://quickbotics.ru
```

### 4. Запустить

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Настроить postgres

```bash
# Установить пароль (должен совпадать с POSTGRES_PASSWORD в .env!)
docker exec -it teach-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'твой_пароль';"

# Установить московское время для логов
docker exec -it teach-postgres psql -U postgres -c "ALTER SYSTEM SET log_timezone = 'Europe/Moscow';"
docker exec -it teach-postgres psql -U postgres -c "SELECT pg_reload_conf();"

# Перезапустить backend
docker compose -f docker-compose.prod.yml restart backend
```

### 6. Проверить

```bash
curl http://localhost:3000/api/health
```

---

## 🔒 Безопасность

### Postgres защищён

В `docker-compose.prod.yml` postgres слушает только на `127.0.0.1`:

```yaml
postgres:
  ports:
    - "127.0.0.1:5432:5432"  # Только localhost, не интернет
```

Это защищает от:
- Сканеров и ботов — порт не виден из интернета
- Brute-force атак — доступ только через SSH

### Подключение к БД на проде

- **Backend** — через Docker сеть (`postgres:5432`)
- **DBeaver/pgAdmin** — через SSH туннель (см. ниже)
- **Извне напрямую** — невозможно, порт закрыт

---

## Управление

```bash
# Запуск
docker compose -f docker-compose.prod.yml up -d

# Остановка
docker compose -f docker-compose.prod.yml down

# Пересборка
docker compose -f docker-compose.prod.yml up -d --build

# Логи
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## Настройка домена и HTTPS

### 1. DNS записи

| Запись | Тип | Значение |
|--------|-----|----------|
| `api.your-domain.com` | A | IP сервера |

Проверить:

```bash
dig @8.8.8.8 api.your-domain.com +short
```

### 2. Установить nginx и certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 3. Настроить nginx

```bash
sudo tee /etc/nginx/sites-available/api << 'NGINX'
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Получить SSL сертификат

```bash
sudo certbot --nginx -d api.your-domain.com
```

### 5. Проверить

```bash
curl https://api.your-domain.com/api/health
```

> **⚠️ CORS**: Заголовки CORS обрабатываются на уровне NestJS (`src/main.ts`).
> **НЕ добавляй** `add_header Access-Control-*` в nginx — это приведёт к дублированию заголовков и ошибке CORS.

---

## Настройка Telegram Webhook

Чтобы бот отвечал на команду `/start`, нужно настроить webhook.

### 1. Установить webhook

```bash
curl -X POST https://api.your-domain.com/api/bot/set-webhook \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_BOT_TOKEN" \
  -d '{"url": "https://api.your-domain.com/api/bot/webhook"}'
```

### 2. Проверить webhook

```bash
curl -X GET https://api.your-domain.com/api/bot/webhook-info \
  -H "X-Admin-Secret: YOUR_BOT_TOKEN"
```

### 3. Проверить работу

1. Открой бота в Telegram
2. Нажми `/start`
3. Должно прийти приветственное сообщение с кнопкой "Открыть приложение"

### Удалить webhook (если нужно)

```bash
curl -X POST https://api.your-domain.com/api/bot/delete-webhook \
  -H "X-Admin-Secret: YOUR_BOT_TOKEN"
```

---

## DBeaver через SSH туннель

### Шаг 1: Создать SSH туннель

В терминале (Git Bash / PowerShell / Terminal):

```bash
ssh -L 5433:localhost:5432 root@IP_СЕРВЕРА
```

Введи пароль от сервера. **Оставь окно открытым!**

### Шаг 2: Подключиться в DBeaver

**Main tab:**

| Поле | Значение |
|------|----------|
| Host | `localhost` |
| Port | `5433` |
| Database | `teach_mini_app` |
| Username | `postgres` |
| Password | из `.env` (POSTGRES_PASSWORD) |

**SSH tab: ОТКЛЮЧЕНА** ❌ (галочка снята)

### Схема подключения

```
DBeaver → localhost:5433 → SSH туннель → сервер:5432 → postgres
```

> **Важно:** Пока работаешь с БД — держи терминал с SSH открытым.

---

## Доставка изменений

### Быстрый деплой (рекомендуется, даунтайм ~3 сек)

```bash
cd ~/tutor_calendar_back
git pull origin main

# Собрать новый образ без остановки старого
docker compose -f docker-compose.prod.yml build backend

# Перезапустить только backend (postgres остаётся)
docker compose -f docker-compose.prod.yml up -d --no-deps backend

# Проверить
sleep 3
curl http://localhost:3000/api/health
```

### Скрипт для деплоя

Скрипт `deploy.sh` уже есть в репозитории.

**Первый раз** — дай права на выполнение (один раз):

```bash
chmod +x deploy.sh
```

**Деплой:**

```bash
./deploy.sh
```

### Полная пересборка (с даунтаймом)

Если нужно пересобрать всё (например, изменились зависимости):

```bash
cd ~/tutor_calendar_back
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Миграции БД

Миграции хранятся в папке `migrations/` и применяются вручную.

### Структура миграций

```
migrations/
├── 001_group_lessons.sql      # Групповые уроки
├── 002_meeting_url.sql        # Ссылка на встречу
├── 003_subscriptions.sql      # Абонементы
└── 004_student_archive.sql    # Архивация учеников
```

### Применение миграции (после git pull)

```bash
cd ~/tutor_calendar_back

# Применить конкретную миграцию
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d teach_mini_app -f /migrations/004_student_archive.sql
```

> **Примечание:** Папка `migrations/` автоматически монтируется в контейнер как `/migrations/`

### Применение всех миграций (первый деплой)

```bash
cd ~/tutor_calendar_back

# Применить все миграции по порядку
for f in migrations/*.sql; do
  echo "Applying $f..."
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres -d teach_mini_app < "$f"
done
```

### Проверка

```bash
# Список таблиц
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d teach_mini_app -c "\dt"

# Структура конкретной таблицы
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d teach_mini_app -c "\d teacher_student_links"
```

---

## Бэкапы

### Создание бэкапа

```bash
cd ~/tutor_calendar_back
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres teach_mini_app | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Восстановление

```bash
gunzip -c backup_20260123.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d teach_mini_app
```

### Автобэкап (cron)

```bash
crontab -e

# Ежедневно в 3:00
0 3 * * * cd ~/tutor_calendar_back && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres teach_mini_app | gzip > ~/backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## Мониторинг

```bash
# Логи
docker compose -f docker-compose.prod.yml logs -f backend

# Ресурсы
docker stats

# Health check
curl https://api.your-domain.com/api/health
```

---

## Portainer (опционально)

```bash
docker run -d -p 9000:9000 --name portainer --restart=always \
  -e TZ=Europe/Moscow \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data portainer/portainer-ce:latest
```

URL: `http://IP:9000`

---

## Troubleshooting

### Ошибка "password authentication failed"

```bash
docker exec -it teach-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'пароль_из_env';"
docker compose -f docker-compose.prod.yml restart backend
```

---

## См. также

- [DEPLOYMENT_DEV.md](./DEPLOYMENT_DEV.md) — локальная разработка
- [TESTING.md](./TESTING.md) — тестирование

---

## ⚠️ Полный сброс БД (ОПАСНО!)

> **Используй ТОЛЬКО если точно нужно удалить ВСЕ данные и начать с нуля.**
> Это действие НЕОБРАТИМО! Сначала сделай бэкап!

```bash
# 0. Сделать бэкап (на всякий случай)
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres teach_mini_app | gzip > backup_before_reset.sql.gz

# 1. Остановить контейнеры И удалить volumes
docker compose -f docker-compose.prod.yml down -v

# 2. Запустить заново
docker compose -f docker-compose.prod.yml up -d --build

# 3. Настроить пароль postgres
docker exec -it teach-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'пароль_из_env';"

# 4. Применить все миграции
for f in migrations/*.sql; do
  echo "Applying $f..."
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres -d teach_mini_app < "$f"
done

# 5. Перезапустить backend
docker compose -f docker-compose.prod.yml restart backend
```
