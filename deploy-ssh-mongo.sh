#!/bin/bash

# MongoDB Setup Script for ACTC Web Application
# Run this after the main deployment to set up MongoDB

set -e

# Configuration
REMOTE_USER="parallels"
REMOTE_HOST="10.211.55.15"
REMOTE_PASSWORD="2doiouxi"
SUDO_PASSWORD="2doiouxi"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐳 Setting up MongoDB on remote server...${NC}"

# Function to run remote commands
run_remote() {
    local cmd="$1"
    sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$cmd"
}

# Function to run remote commands with sudo
run_remote_sudo() {
    local cmd="$1"
    echo "$SUDO_PASSWORD" | sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo '$SUDO_PASSWORD' | sudo -S $cmd"
}

echo -e "${YELLOW}📦 Installing MongoDB...${NC}"

# Install MongoDB
run_remote_sudo "wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -"
run_remote_sudo "echo 'deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse' | tee /etc/apt/sources.list.d/mongodb-org-6.0.list"
run_remote_sudo "apt-get update"
run_remote_sudo "apt-get install -y mongodb-org"

echo -e "${YELLOW}🚀 Starting MongoDB service...${NC}"

# Start and enable MongoDB
run_remote_sudo "systemctl start mongod"
run_remote_sudo "systemctl enable mongod"

echo -e "${YELLOW}🔒 Configuring MongoDB security...${NC}"

# Create MongoDB admin user
run_remote "mongosh --eval \"
  use admin
  db.createUser({
    user: 'actc_admin',
    pwd: 'actc_secure_password_2025',
    roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
  })
\""

# Create application database and user
run_remote "mongosh --eval \"
  use actc_website
  db.createUser({
    user: 'actc_user',
    pwd: 'actc_user_password_2025',
    roles: [{ role: 'readWrite', db: 'actc_website' }]
  })
\""

echo -e "${YELLOW}🔧 Updating MongoDB configuration...${NC}"

# Update MongoDB configuration to require authentication
run_remote_sudo "sed -i 's/#security:/security:/' /etc/mongod.conf"
run_remote_sudo "sed -i '/security:/a\\  authorization: enabled' /etc/mongod.conf"

# Restart MongoDB
run_remote_sudo "systemctl restart mongod"

echo -e "${YELLOW}🔧 Updating application environment...${NC}"

# Update the application's .env file with MongoDB credentials
run_remote "cd /home/parallels/actc_web && sed -i 's|MONGO_URI=.*|MONGO_URI=mongodb://actc_user:actc_user_password_2025@localhost:27017/actc_website|' .env"

echo -e "${YELLOW}🔄 Restarting application...${NC}"

# Restart the application
run_remote "pm2 restart actc-web"

echo -e "${GREEN}✅ MongoDB setup completed successfully!${NC}"
echo -e "${BLUE}📊 MongoDB is running on port 27017${NC}"
echo -e "${BLUE}🔑 Admin user: actc_admin${NC}"
echo -e "${BLUE}🔑 App user: actc_user${NC}"
echo -e "${BLUE}🌐 Application restarted with new database connection${NC}"
