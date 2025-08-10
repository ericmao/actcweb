#!/bin/bash

# Firewall Check and Fix Script for ACTC Web Application
# Checks and fixes firewall issues on the remote server

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

echo -e "${BLUE}🔒 Checking and fixing firewall issues...${NC}"

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

echo -e "${YELLOW}📋 Checking current firewall status...${NC}"

# Check UFW status
run_remote_sudo "ufw status verbose"

echo -e "${YELLOW}🔧 Resetting firewall rules...${NC}"

# Reset firewall to default
run_remote_sudo "ufw --force reset"

# Allow SSH
run_remote_sudo "ufw allow 22/tcp"

# Allow HTTP
run_remote_sudo "ufw allow 80/tcp"

# Allow HTTPS
run_remote_sudo "ufw allow 443/tcp"

# Allow application port
run_remote_sudo "ufw allow 5001/tcp"

# Allow MongoDB port (if needed)
run_remote_sudo "ufw allow 27017/tcp"

# Enable firewall
run_remote_sudo "ufw --force enable"

echo -e "${YELLOW}📊 New firewall status:${NC}"
run_remote_sudo "ufw status numbered"

echo -e "${YELLOW}🌐 Testing application port...${NC}"

# Check if application port is accessible
if run_remote "netstat -tulpn | grep :5001" &> /dev/null; then
    echo -e "${GREEN}✅ Port 5001 is listening${NC}"
else
    echo -e "${RED}❌ Port 5001 is not listening${NC}"
fi

echo -e "${YELLOW}🔍 Checking nginx status...${NC}"

# Check nginx
run_remote_sudo "systemctl status nginx --no-pager -l"

echo -e "${YELLOW}🔍 Checking PM2 status...${NC}"

# Check PM2
run_remote "pm2 status"

echo -e "${GREEN}✅ Firewall check and fix completed!${NC}"
echo -e "${BLUE}🌐 Try accessing: http://$REMOTE_HOST${NC}"
echo -e "${BLUE}📱 Check PM2: pm2 monit${NC}"
echo -e "${BLUE}📝 Check logs: pm2 logs actc-web${NC}"
