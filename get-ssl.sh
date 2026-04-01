#!/bin/bash

# RoyalSmoke SSL Certificate Setup Script
# Run this after the app is running and DNS has propagated

set -e

echo "🔒 Setting up SSL certificates..."

# Check if DNS is propagated
echo "🔍 Checking DNS propagation..."
for domain in www.royalsmokecigars.online royalsmokecigars.online admin.royalsmokecigars.online store.royalsmokecigars.online; do
    echo "Checking $domain..."
    if ! host $domain | grep -q "104.248.92.92"; then
        echo "⚠️  WARNING: $domain does not resolve to 104.248.92.92 yet"
        echo "Please wait for DNS to propagate (5-30 minutes) and try again"
        exit 1
    fi
done

echo "✅ DNS propagation confirmed!"
echo ""

# Get SSL certificates
echo "📜 Obtaining SSL certificates from Let's Encrypt..."
certbot --nginx \
    -d www.royalsmokecigars.online \
    -d royalsmokecigars.online \
    -d admin.royalsmokecigars.online \
    -d store.royalsmokecigars.online \
    --non-interactive \
    --agree-tos \
    --redirect \
    -m admin@royalsmokecigars.online

echo ""
echo "✅ SSL certificates installed!"
echo ""
echo "🌐 Your site is now live at:"
echo "  https://www.royalsmokecigars.online"
echo "  https://admin.royalsmokecigars.online"
echo "  https://store.royalsmokecigars.online"
echo ""
echo "🔄 Certificates will auto-renew via certbot timer"
