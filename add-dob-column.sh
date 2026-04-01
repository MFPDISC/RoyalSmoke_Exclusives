#!/bin/bash
DB_FILE="server/database.sqlite"

echo "Check for date_of_birth column..."
count=$(sqlite3 "$DB_FILE" "PRAGMA table_info(users);" | grep -c "date_of_birth")

if [ "$count" -eq "0" ]; then
    echo "Adding date_of_birth column..."
    sqlite3 "$DB_FILE" "ALTER TABLE users ADD COLUMN date_of_birth TEXT;"
    echo "Done."
else
    echo "Column date_of_birth already exists."
fi
