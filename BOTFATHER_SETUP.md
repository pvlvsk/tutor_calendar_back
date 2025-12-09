# Настройка Telegram бота

## Создание бота

1. Открыть @BotFather в Telegram
2. Отправить /newbot
3. Следовать инструкциям
4. Сохранить токен бота

## Настройка Mini App

1. Отправить /mybots
2. Выбрать бота
3. Bot Settings > Menu Button > Configure menu button
4. Указать URL приложения

## Настройка Web App

1. /mybots > выбрать бота
2. Bot Settings > Configure Mini App
3. Указать URL: https://your-domain.com

## Переменные окружения

```env
BOT_TOKEN=your_bot_token_here
BOT_USERNAME=your_bot
```

## Проверка initData

Backend проверяет подпись initData от Telegram:
- Парсит query string
- Извлекает hash
- Вычисляет HMAC-SHA256
- Сравнивает с полученным hash

## Тестирование

Для локальной разработки используйте:
- ngrok для HTTPS туннеля
- Или VITE_APP_MODE=local с mock данными
