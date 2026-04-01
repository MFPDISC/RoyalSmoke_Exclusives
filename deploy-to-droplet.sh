#!/bin/bash

# RoyalSmoke Droplet Deployment Script
# Run this on your DigitalOcean droplet at 104.248.92.92

set -e  # Exit on any error

echo "🚀 Starting RoyalSmoke deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Create directory structure
echo "📁 Creating directories..."
mkdir -p /var/www/royalsmoke

# Install Git if not present
apt install -y git

echo "✅ Software installation complete!"
echo ""
echo "Next steps:"
echo "1. Upload your code to /var/www/royalsmoke"
echo "2. Run the setup script: bash /var/www/royalsmoke/setup-app.sh"
