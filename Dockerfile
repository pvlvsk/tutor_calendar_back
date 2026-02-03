FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Сборка без тестов (тесты запускаются локально перед деплоем)
# Увеличиваем лимит памяти для TypeScript компиляции
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build:no-tests

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
