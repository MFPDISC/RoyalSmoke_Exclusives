#!/bin/bash

# Add VIP discount tracking columns to users table

echo "Adding VIP discount tracking columns..."

sqlite3 database/royalsmoke.db <<EOF
-- Add discount tracking columns
ALTER TABLE users ADD COLUMN discount_used_this_month REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN discount_cap_monthly REAL DEFAULT 1000;
ALTER TABLE users ADD COLUMN discount_reset_month TEXT DEFAULT '';

-- Update existing users
UPDATE users SET discount_reset_month = strftime('%Y-%m', 'now') WHERE discount_reset_month = '';

.quit
EOF

echo "✅ VIP discount tracking columns added successfully!"
echo ""
echo "New columns:"
echo "  - discount_used_this_month (tracks monthly VIP savings)"
echo "  - discount_cap_monthly (R1,000 default cap)"
echo "  - discount_reset_month (tracks last reset)"
