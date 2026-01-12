FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Используем build:no-tests для быстрой сборки на сервере
RUN npm run build:no-tests

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
