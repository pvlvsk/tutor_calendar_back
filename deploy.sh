#!/bin/bash
# ===========================================
# Быстрый деплой backend (даунтайм ~3 сек)
# ===========================================
set -e

cd ~/tutor_calendar_back

echo "📥 Pulling changes..."
git pull origin main

echo "🔨 Building new image..."
docker compose -f docker-compose.prod.yml build backend

# ===========================================
# Применение миграций
# ===========================================
echo "📦 Applying migrations..."

# Получаем имя контейнера postgres
POSTGRES_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q postgres 2>/dev/null || echo "teach-postgres")

if [ -n "$POSTGRES_CONTAINER" ]; then
  for f in migrations/*.sql; do
    if [ -f "$f" ]; then
      echo "  → Applying $(basename $f)..."
      # Используем -f для подавления ошибок если миграция уже применена
      docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d teach_mini_app < "$f" 2>&1 | grep -v "already exists" | grep -v "duplicate" || true
    fi
  done
  echo "✅ Migrations applied"
else
  echo "⚠️ Postgres container not found, skipping migrations"
fi

echo "🚀 Deploying (restarting backend)..."
docker compose -f docker-compose.prod.yml up -d --no-deps backend

echo "⏳ Waiting for startup..."
sleep 3

echo "✅ Health check:"
curl -s http://localhost:3000/api/health
echo ""
echo ""
echo "✨ Deploy complete!"
