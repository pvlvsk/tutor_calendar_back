# Деплой Backend на удалённый сервер

## Требования

- Ubuntu 20.04+ / Debian 11+
- Docker и Docker Compose v2
- Минимум 1GB RAM, 10GB диска

## Быстрый старт

### 1. Установка Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Клонировать проект

```bash
cd ~
git clone <repository-url> tutor_calendar_back
cd tutor_calendar_back
```

### 3. Создать .env

Используй шаблон для продакшена:

```bash
cp ENV.PROD.TXT .env
nano .env  # Заполни реальными данными
```

Или создай вручную:

```env
NODE_ENV=production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=teach_mini_app
DB_PORT=5432
BACKEND_PORT=3000
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
BOT_TOKEN=your_bot_token
BOT_USERNAME=your_bot
BETA_CODE=beta_2025
```

> **Шаблоны:** `ENV.QA.TXT` - для локальной разработки, `ENV.PROD.TXT` - для продакшена

### 4. Запустить

```bash
docker compose up -d --build
```

### 5. Проверить

```bash
docker compose ps
curl http://localhost:3000/api/health
```

## Сборка без тестов

Dockerfile использует npm run build:no-tests для ускорения.

## Управление

```bash
docker compose up -d          # Запустить
docker compose down           # Остановить
docker compose up -d --build  # Пересобрать
docker compose logs -f backend # Логи
docker compose down -v        # Удалить данные
```

## Portainer

```bash
docker run -d -p 9000:9000 --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data portainer/portainer-ce:latest
```

URL: http://IP:9000

## Переменные .env

- POSTGRES_PASSWORD - пароль БД
- DATABASE_URL - строка подключения (хост = postgres)
- JWT_SECRET - секрет JWT (мин 32 символа)
- BOT_TOKEN - токен от BotFather

## DBeaver подключение

- Host: IP сервера
- Port: 5432
- Database: teach_mini_app
- User/Pass: из .env

---

## Настройка домена и HTTPS

### 1. DNS записи

В панели управления доменом добавьте A-записи:

| Запись                  | Тип | IP         |
| ----------------------- | --- | ---------- |
| api.your-domain.com     | A   | IP_сервера |
| www.api.your-domain.com | A   | IP_сервера |

Проверить DNS:

```bash
dig @8.8.8.8 api.your-domain.com +short
dig @1.1.1.1 api.your-domain.com +short
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
    server_name api.your-domain.com www.api.your-domain.com;

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
sudo certbot --nginx -d api.your-domain.com -d www.api.your-domain.com
```

Certbot автоматически:

- Получит сертификат от Let's Encrypt
- Обновит nginx конфиг для HTTPS
- Настроит автообновление сертификата

### 5. Проверить

```bash
curl https://api.your-domain.com/api/health
```

### 6. Настройка фронтенда

На фронтенде в `.env.production`:

```env
VITE_API_URL=https://api.your-domain.com/api
VITE_APP_MODE=production
```

---

## Обновление SSL сертификата

Certbot автоматически обновляет сертификаты. Проверить:

```bash
sudo certbot renew --dry-run
```

Принудительное обновление:

```bash
sudo certbot renew --force-renewal
```

---

## Доставка изменений на прод

### Вариант 1: Через Git

```bash
# На сервере
cd ~/tutor_calendar_back

# Получить изменения
git pull origin main

# Пересобрать и перезапустить
docker compose down
docker compose up -d --build

# Проверить логи
docker compose logs -f backend
```

### Вариант 2: Ручная загрузка файлов

```bash
# С локальной машины - загрузить изменённые файлы
scp -r src/ root@your-server-ip:~/tutor_calendar_back/
scp package.json root@your-server-ip:~/tutor_calendar_back/

# На сервере - пересобрать
ssh root@your-server-ip
cd ~/tutor_calendar_back
docker compose down
docker compose up -d --build
```

### Вариант 3: Полная перезаливка

```bash
# На локальной машине - создать архив (без node_modules)
cd backend
tar --exclude='node_modules' --exclude='dist' --exclude='.env' -czvf backend.tar.gz .

# Загрузить на сервер
scp backend.tar.gz root@your-server-ip:~/

# На сервере
ssh root@your-server-ip
cd ~
rm -rf tutor_calendar_back_backup
mv tutor_calendar_back tutor_calendar_back_backup
mkdir tutor_calendar_back
cd tutor_calendar_back
tar -xzvf ../backend.tar.gz

# Скопировать .env из бэкапа
cp ../tutor_calendar_back_backup/.env .

# Пересобрать
docker compose down
docker compose up -d --build
```

### Быстрое обновление (только код, без зависимостей)

Если изменились только файлы в `src/`:

```bash
# На сервере
cd ~/tutor_calendar_back
docker compose exec backend sh -c "rm -rf dist && npm run build:no-tests"
docker compose restart backend
```

---

## Миграции базы данных

Миграции хранятся в папке `migrations/` и применяются вручную.

### Структура миграций

```
migrations/
├── 001_group_lessons.sql      # Групповые уроки
├── 002_meeting_url.sql        # Ссылка на встречу
└── ...
```

### Применение миграции

```bash
# 1. Загрузить файл миграции на сервер (если ещё нет)
scp migrations/002_meeting_url.sql root@your-server-ip:~/tutor_calendar_back/migrations/

# 2. На сервере - применить миграцию
cd ~/tutor_calendar_back
docker compose exec postgres psql -U postgres -d teach_mini_app -f /migrations/002_meeting_url.sql
```

### Применение миграции через копирование

```bash
# Скопировать в контейнер и выполнить
docker compose cp migrations/002_meeting_url.sql postgres:/tmp/migration.sql
docker compose exec postgres psql -U postgres -d teach_mini_app -f /tmp/migration.sql
```

### Проверка применённых изменений

```bash
# Подключиться к БД
docker compose exec postgres psql -U postgres -d teach_mini_app

# В psql:
\dt                    -- список таблиц
\d lessons             -- структура таблицы lessons
SELECT * FROM users;   -- просмотр данных
\q                     -- выход
```

### Откат миграции

Создайте файл отката и выполните:

```bash
# Пример: откат добавления колонки
docker compose exec postgres psql -U postgres -d teach_mini_app -c \
  "ALTER TABLE lessons DROP COLUMN IF EXISTS meetingUrl;"
```

### Создание новой миграции

1. Создайте файл `migrations/XXX_description.sql`
2. Напишите SQL:

```sql
-- migrations/003_new_feature.sql
-- Описание: добавление новой фичи

-- Добавить колонку
ALTER TABLE users ADD COLUMN IF NOT EXISTS "newColumn" VARCHAR(255);

-- Создать индекс (если нужно)
CREATE INDEX IF NOT EXISTS idx_users_new_column ON users("newColumn");
```

3. Применить на проде (см. выше)

---

## Бэкап и восстановление БД

### Создание бэкапа

```bash
# На сервере
cd ~/tutor_calendar_back

# Создать дамп
docker compose exec postgres pg_dump -U postgres teach_mini_app > backup_$(date +%Y%m%d_%H%M%S).sql

# Или сжатый
docker compose exec postgres pg_dump -U postgres teach_mini_app | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Восстановление из бэкапа

```bash
# Из обычного файла
docker compose exec -T postgres psql -U postgres -d teach_mini_app < backup_20260112.sql

# Из сжатого
gunzip -c backup_20260112.sql.gz | docker compose exec -T postgres psql -U postgres -d teach_mini_app
```

### Автоматический бэкап (cron)

```bash
# Добавить в crontab
crontab -e

# Ежедневный бэкап в 3:00
0 3 * * * cd ~/tutor_calendar_back && docker compose exec -T postgres pg_dump -U postgres teach_mini_app | gzip > ~/backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## Мониторинг

### Логи

```bash
# Все логи
docker compose logs -f

# Только backend
docker compose logs -f backend

# Последние 100 строк
docker compose logs --tail=100 backend

# С временными метками
docker compose logs -f -t backend
```

### Ресурсы

```bash
# Использование ресурсов контейнерами
docker stats

# Место на диске
df -h
docker system df
```

### Health check

```bash
# Проверка API
curl https://api.quickbotics.ru/api/health

# Проверка БД
docker compose exec postgres pg_isready -U postgres
```
