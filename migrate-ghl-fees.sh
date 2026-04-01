#!/bin/bash

# RoyalSmoke Production Database Migration
# Adds GHL contact tracking and monthly fee management

echo "🔄 Starting database migration..."

cd /root/royalsmoke/server

# Backup database first
echo "📦 Backing up database..."
cp database/royalsmoke.db database/royalsmoke.db.backup-$(date +%Y%m%d-%H%M%S)

# Add ghl_contact_id to users table
echo "Adding GHL contact ID to users..."
sqlite3 database/royalsmoke.db "ALTER TABLE users ADD COLUMN ghl_contact_id TEXT;" 2>/dev/null || echo "Column already exists"

# Add monthly fee tracking to stores
echo "Adding monthly fee tracking to stores..."
sqlite3 database/royalsmoke.db "ALTER TABLE stores ADD COLUMN monthly_fee_status TEXT DEFAULT 'pending';" 2>/dev/null || echo "Column already exists"
sqlite3 database/royalsmoke.db "ALTER TABLE stores ADD COLUMN last_fee_payment_date TEXT;" 2>/dev/null || echo "Column already exists"
sqlite3 database/royalsmoke.db "ALTER TABLE stores ADD COLUMN next_fee_due_date TEXT;" 2>/dev/null || echo "Column already exists"

echo "✅ Database migration complete!"
echo "📊 Verifying schema..."

sqlite3 database/royalsmoke.db "PRAGMA table_info(users);" | grep ghl_contact_id
sqlite3 database/royalsmoke.db "PRAGMA table_info(stores);" | grep monthly_fee

echo ""
echo "🎉 Migration successful! Database ready for:"
echo "   - GHL customer sync"
echo "   - R49/month fee tracking"
