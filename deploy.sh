#!/bin/bash

# Limpex Deployment Script
# Run this on your VPS/Server

set -e

echo "Starting Limpex deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/limpex
sudo chown -R $USER:$USER /var/www/limpex

# Copy project files
cp -r . /var/www/limpex/

# Navigate to project
cd /var/www/limpex

# Install backend dependencies
cd backend
npm install --production

# Setup database
sudo -u postgres psql -c "CREATE DATABASE limpex;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_secure_password';"

# Run migrations
npm run migrate

# Seed default admin user
npm run seed

# Import products (optional)
npm run import-products

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Setup Nginx
sudo cp ../nginx.conf /etc/nginx/sites-available/limpex
sudo ln -sf /etc/nginx/sites-available/limpex /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Start application with PM2
cd ../backend
pm2 start ../ecosystem.config.js
pm2 save
pm2 startup

# Setup SSL with Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d limpex.com -d www.limpex.com

echo "Deployment complete!"
echo "Default admin credentials:"
echo "Email: admin@limpex.com"
echo "Password: Admin@123"
echo ""
echo "IMPORTANT: Change the default password and update .env file!"
