#!/bin/bash
# Migration script to add ghl_contact_id column to users table on production server

cd /var/www/royalsmoke

echo "Adding ghl_contact_id column to users table..."
sqlite3 database/royalsmoke.db "ALTER TABLE users ADD COLUMN ghl_contact_id TEXT;" || echo "Column might already exist, continuing..."

echo "✅ Database migration complete!"
echo "Verifying..."
sqlite3 database/royalsmoke.db "PRAGMA table_info(users);" | grep ghl_contact_id && echo "✅ ghl_contact_id column exists!" || echo "❌ Migration failed!"
