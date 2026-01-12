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

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=teach_mini_app
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/teach_mini_app
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
BOT_TOKEN=your_bot_token
BOT_USERNAME=your_bot
BETA_CODE=beta_2025
BACKEND_PORT=3000
```

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

| Запись | Тип | IP |
|--------|-----|-----|
| api.your-domain.com | A | IP_сервера |
| www.api.your-domain.com | A | IP_сервера |

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
