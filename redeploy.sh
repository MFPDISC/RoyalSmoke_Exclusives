#!/bin/bash
# Run on droplet to pull latest code and restart: bash redeploy.sh
set -e
cd /var/www/royalsmoke
git pull origin main

cd client && npm install && npm run build && cd ..
cd server && npm install && cd ..

pm2 restart royalsmoke
echo "Done. App restarted."
