#!/bin/bash

# Quick fix script for RoyalSmoke production database
# Run this on the server to update the database schema

echo "🔧 RoyalSmoke Database Fix"
echo "=========================="
echo ""

SERVER="root@104.248.92.92"

echo "Running database setup on server..."
ssh "$SERVER" << 'ENDSSH'

cd /var/www/royalsmoke/server

echo "📊 Current database tables:"
sqlite3 ../database/royalsmoke.db ".tables"

echo ""
echo "🔄 Running database setup..."
node db_setup.js

echo ""
echo "📋 Checking stores table:"
sqlite3 ../database/royalsmoke.db "SELECT COUNT(*) as store_count FROM stores;"
sqlite3 ../database/royalsmoke.db "SELECT name, email, is_approved FROM stores ORDER BY created_at DESC LIMIT 3;"

echo ""
echo "📋 Checking store_products table structure:"
sqlite3 ../database/royalsmoke.db "PRAGMA table_info(store_products);"

echo ""
echo "🔄 Restarting API..."
pm2 restart royalsmoke-api

echo ""
echo "✅ Database fix complete!"
echo ""
echo "Test by:"
echo "1. Go to https://royalsmokecigars.online/admin"
echo "2. Login with PIN: royal2024"
echo "3. Check Stores tab"

ENDSSH

echo ""
echo "Done! Try refreshing your admin page."
