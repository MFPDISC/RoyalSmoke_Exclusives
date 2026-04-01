#!/bin/bash

# RoyalSmoke Quick Deploy - Sync changes to server
# This syncs your local changes to the live server

set -e

SERVER="root@104.248.92.92"
REMOTE_PATH="/var/www/royalsmoke"
LOCAL_PATH="/Users/on-set/Local-Coding-Repo/RoyalSmoke Exclusives - GHL & Site"

echo "🚀 RoyalSmoke Quick Deploy"
echo "=========================="
echo ""
echo "📦 Syncing code to server..."

# Sync code (excluding node_modules, database, uploads)
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'database' \
  --exclude 'uploads' \
  --exclude '.DS_Store' \
  "$LOCAL_PATH/" \
  "$SERVER:$REMOTE_PATH/"

echo ""
echo "✅ Code synced!"
echo ""
echo "🔄 Restarting server..."

# SSH into server and restart
ssh "$SERVER" << 'ENDSSH'
cd /var/www/royalsmoke

# Install any new npm dependencies
echo "📦 Checking server dependencies..."
cd server
npm install --production
cd ..

# Rebuild client
echo "🏗️  Building client..."
cd client
npm install
npm run build
cd ..

# Restart PM2
echo "🔄 Restarting API..."
pm2 restart royalsmoke-api || pm2 start server/index.js --name royalsmoke-api

# Reload Nginx
echo "🔄 Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "✅ Deployment complete!"
pm2 status

ENDSSH

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "Your sites:"
echo "  🏪 Main shop: https://www.royalsmokecigars.online"
echo "  👨‍💼 Admin: https://admin.royalsmokecigars.online" 
echo "  🏬 Store: https://store.royalsmokecigars.online"
echo ""
echo "Check logs: ssh root@104.248.92.92 'pm2 logs royalsmoke-api'"
