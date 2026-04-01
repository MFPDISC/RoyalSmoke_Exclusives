# RoyalSmoke Deployment Guide

## Quick Start (3 Simple Steps)

### Step 1: Upload scripts to droplet
```bash
# From your local machine
scp deploy-to-droplet.sh setup-app.sh get-ssl.sh root@104.248.92.92:/root/
```

### Step 2: SSH and run deployment
```bash
# SSH into droplet
ssh root@104.248.92.92

# Run initial setup
bash /root/deploy-to-droplet.sh
```

### Step 3: Upload code and complete setup
```bash
# From your local machine - upload your code
cd "/Users/on-set/Local-Coding-Repo/RoyalSmoke Exclusives - GHL & Site"
rsync -avz --exclude 'node_modules' --exclude '.git' . root@104.248.92.92:/var/www/royalsmoke/

# Back on the droplet
ssh root@104.248.92.92
bash /var/www/royalsmoke/setup-app.sh

# Edit environment variables
nano /var/www/royalsmoke/server/.env
# Update DATABASE_URL, VITE_USDT_ADDRESS, VITE_PAYSHAP_RECIPIENT

# Restart API
pm2 restart royalsmoke-api

# Wait 10-30 minutes for DNS to propagate, then get SSL
bash /var/www/royalsmoke/get-ssl.sh
```

---

## What Each Script Does

### `deploy-to-droplet.sh`
- Updates system packages
- Installs Node.js 20.x
- Installs Nginx
- Installs Certbot (SSL)
- Installs PM2 (process manager)
- Creates directories

### `setup-app.sh`
- Installs npm dependencies (server + client)
- Builds React app
- Creates .env template
- Configures Nginx for all domains
- Starts app with PM2
- Configures firewall

### `get-ssl.sh`
- Checks DNS propagation
- Obtains SSL certificates from Let's Encrypt
- Configures auto-renewal

---

## Manual Commands (if needed)

### Check app status
```bash
pm2 status
pm2 logs royalsmoke-api
```

### Restart app
```bash
pm2 restart royalsmoke-api
```

### Check Nginx
```bash
nginx -t
systemctl status nginx
systemctl restart nginx
```

### View logs
```bash
# App logs
pm2 logs

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### DNS not propagating
Wait 30 minutes, then check:
```bash
host www.royalsmokecigars.online
```

### App not starting
```bash
pm2 logs royalsmoke-api
# Check for errors in .env or missing dependencies
```

### SSL certificate fails
Make sure DNS is fully propagated first:
```bash
host www.royalsmokecigars.online
# Should show 104.248.92.92
```

---

## Your Domains
- **Main shop:** https://www.royalsmokecigars.online
- **Admin panel:** https://admin.royalsmokecigars.online  
- **Store:** https://store.royalsmokecigars.online

All point to the same React app, routing handled by React Router.
