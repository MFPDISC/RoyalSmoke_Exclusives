#!/bin/bash

# RoyalSmoke Application Setup Script
# Run this after uploading your code to /var/www/royalsmoke

set -e

echo "🔧 Setting up RoyalSmoke application..."

cd /var/www/royalsmoke

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install --production

# Install client dependencies and build
echo "📦 Installing client dependencies..."
cd ../client
npm install
echo "🏗️  Building client..."
npm run build

# Create server .env file
echo "⚙️  Creating server environment file..."
cd ../server
cat > .env << 'EOF'
PORT=5001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/royalsmoke
VITE_USDT_ADDRESS=your-usdt-address-here
VITE_PAYSHAP_RECIPIENT=your-payshap-recipient-here
EOF

echo "⚠️  IMPORTANT: Edit /var/www/royalsmoke/server/.env with your actual values!"

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/royalsmoke << 'EOF'
# www.royalsmokecigars.online - Main shop
server {
    listen 80;
    server_name www.royalsmokecigars.online royalsmokecigars.online;

    root /var/www/royalsmoke/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# admin.royalsmokecigars.online - Admin panel
server {
    listen 80;
    server_name admin.royalsmokecigars.online;

    root /var/www/royalsmoke/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# store.royalsmokecigars.online - Store
server {
    listen 80;
    server_name store.royalsmokecigars.online;

    root /var/www/royalsmoke/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/royalsmoke /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
echo "🧪 Testing Nginx configuration..."
nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Start application with PM2
echo "🚀 Starting application with PM2..."
cd /var/www/royalsmoke/server
pm2 delete royalsmoke-api 2>/dev/null || true
pm2 start server.js --name royalsmoke-api --time
pm2 save
pm2 startup systemd -u root --hp /root

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw allow 22/tcp

echo ""
echo "✅ Application setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit /var/www/royalsmoke/server/.env with your database and API credentials"
echo "2. Restart the API: pm2 restart royalsmoke-api"
echo "3. Get SSL certificates: bash /var/www/royalsmoke/get-ssl.sh"
echo ""
echo "📊 Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View app logs"
echo "  pm2 restart all     - Restart app"
echo "  nginx -t            - Test Nginx config"
echo "  systemctl status nginx - Check Nginx status"
