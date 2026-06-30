#!/bin/bash
# Run this ONCE on a fresh droplet as root: bash setup-droplet.sh
set -e

echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git nginx

echo "==> Installing PM2..."
npm install -g pm2

echo "==> Creating app directory..."
mkdir -p /var/www/royalsmoke
mkdir -p /var/www/royalsmoke/database

echo "==> Cloning repo..."
cd /var/www
git clone https://github.com/mfpdisc/RoyalSmoke_Exclusives.git royalsmoke || true

echo "==> Installing server dependencies..."
cd /var/www/royalsmoke/server
npm install

echo "==> Building frontend..."
cd /var/www/royalsmoke/client
npm install
npm run build

echo "==> Setting up .env..."
if [ ! -f /var/www/royalsmoke/server/.env ]; then
  cat > /var/www/royalsmoke/server/.env <<'ENVEOF'
PORT=5001
ADMIN_PASSWORD=RoyalAdmin2024!
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
GHL_API_KEY=
GHL_LOCATION_ID=
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_SANDBOX=true
ENVEOF
  echo "==> .env created. Edit /var/www/royalsmoke/server/.env to fill in your keys."
fi

echo "==> Initialising database..."
cd /var/www/royalsmoke/server
node db_setup.js || true

echo "==> Starting app with PM2..."
pm2 delete royalsmoke 2>/dev/null || true
pm2 start index.js --name royalsmoke --cwd /var/www/royalsmoke/server
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo "==> Writing Nginx config..."
cat > /etc/nginx/sites-available/royalsmoke <<'NGINXEOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/royalsmoke /etc/nginx/sites-enabled/royalsmoke
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "======================================"
echo "  RoyalSmoke is live!"
echo "  Visit: http://134.122.59.180"
echo "  Signup page:  http://134.122.59.180/join"
echo "  Admin panel:  http://134.122.59.180/members-admin"
echo "  Admin password: RoyalAdmin2024!  (change in /var/www/royalsmoke/server/.env)"
echo "======================================"
