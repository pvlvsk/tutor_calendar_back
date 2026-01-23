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

echo "🚀 Deploying (restarting backend)..."
docker compose -f docker-compose.prod.yml up -d --no-deps backend

echo "⏳ Waiting for startup..."
sleep 3

echo "✅ Health check:"
curl -s http://localhost:3000/api/health
echo ""
echo ""
echo "✨ Deploy complete!"
