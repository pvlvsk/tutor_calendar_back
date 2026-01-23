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
BOT_USERNAME=имя_бота
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

# Удалить всё (включая данные!)
docker compose -f docker-compose.prod.yml down -v
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

Скрипт `deploy.sh` уже есть в репозитории. Первый раз сделай его исполняемым:

```bash
chmod +x deploy.sh
```

Использование:

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

### Применение миграции

```bash
# Загрузить миграцию
scp migrations/003_new.sql root@server:~/tutor_calendar_back/migrations/

# Применить на сервере
cd ~/tutor_calendar_back
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d teach_mini_app -f /migrations/003_new.sql
```

### Проверка

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d teach_mini_app -c "\dt"
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

### Полный сброс

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
# Затем установить пароль postgres
```

---

## См. также

- [DEPLOYMENT_DEV.md](./DEPLOYMENT_DEV.md) — локальная разработка
- [TESTING.md](./TESTING.md) — тестирование
