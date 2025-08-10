#!/bin/bash

# Connection Diagnostic Script for ACTC Web Application
# Diagnoses all possible connection issues

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

echo -e "${BLUE}🔍 ACTC Web Application Connection Diagnostic${NC}"
echo -e "${BLUE}=============================================${NC}"

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

echo -e "${YELLOW}📡 Step 1: Network Connectivity Test${NC}"
echo "----------------------------------------"

# Test basic network connectivity
if ping -c 1 "$REMOTE_HOST" &> /dev/null; then
    echo -e "${GREEN}✅ Network connectivity: OK${NC}"
else
    echo -e "${RED}❌ Network connectivity: FAILED${NC}"
    echo "Cannot reach $REMOTE_HOST"
    exit 1
fi

echo -e "${YELLOW}🔐 Step 2: SSH Connection Test${NC}"
echo "--------------------------------"

# Test SSH connection
if sshpass -p "$REMOTE_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH OK'" &> /dev/null; then
    echo -e "${GREEN}✅ SSH connection: OK${NC}"
else
    echo -e "${RED}❌ SSH connection: FAILED${NC}"
    echo "Cannot establish SSH connection"
    exit 1
fi

echo -e "${YELLOW}🌐 Step 3: Application Status Check${NC}"
echo "------------------------------------"

# Check if application is running
if run_remote "pm2 list | grep actc-web" &> /dev/null; then
    echo -e "${GREEN}✅ PM2 process: Running${NC}"
    run_remote "pm2 status actc-web"
else
    echo -e "${RED}❌ PM2 process: Not running${NC}"
fi

# Check if port 5001 is listening
if run_remote "netstat -tulpn | grep :5001" &> /dev/null; then
    echo -e "${GREEN}✅ Port 5001: Listening${NC}"
    run_remote "netstat -tulpn | grep :5001"
else
    echo -e "${RED}❌ Port 5001: Not listening${NC}"
fi

echo -e "${YELLOW}🔒 Step 4: Firewall Status Check${NC}"
echo "--------------------------------"

# Check firewall status
echo "Current firewall rules:"
run_remote_sudo "ufw status numbered"

# Check if ports are allowed
echo -e "\nChecking specific ports:"
for port in 22 80 443 5001 27017; do
    if run_remote_sudo "ufw status | grep $port" &> /dev/null; then
        echo -e "${GREEN}✅ Port $port: Allowed${NC}"
    else
        echo -e "${RED}❌ Port $port: Blocked${NC}"
    fi
done

echo -e "${YELLOW}🌍 Step 5: nginx Status Check${NC}"
echo "----------------------------"

# Check nginx status
if run_remote_sudo "systemctl is-active nginx" | grep -q "active"; then
    echo -e "${GREEN}✅ nginx: Active${NC}"
    echo "nginx configuration test:"
    run_remote_sudo "nginx -t"
else
    echo -e "${RED}❌ nginx: Inactive${NC}"
fi

echo -e "${YELLOW}📊 Step 6: System Resources Check${NC}"
echo "--------------------------------"

# Check system resources
echo "Memory usage:"
run_remote "free -h"

echo -e "\nDisk usage:"
run_remote "df -h"

echo -e "\nCPU load:"
run_remote "uptime"

echo -e "${YELLOW}🔍 Step 7: Application Logs Check${NC}"
echo "--------------------------------"

# Check application logs
echo "Recent PM2 logs:"
run_remote "pm2 logs actc-web --lines 5"

echo -e "\nnginx error logs:"
run_remote_sudo "tail -5 /var/log/nginx/error.log"

echo -e "${YELLOW}🔧 Step 8: Quick Fix Attempts${NC}"
echo "--------------------------------"

# Try to restart services
echo "Restarting PM2 application..."
run_remote "pm2 restart actc-web"

echo "Restarting nginx..."
run_remote_sudo "systemctl restart nginx"

echo "Checking final status..."
sleep 3

# Final status check
echo -e "\n${BLUE}📊 Final Status Check:${NC}"
echo "------------------------"

if run_remote "pm2 list | grep actc-web" &> /dev/null; then
    echo -e "${GREEN}✅ PM2: Running${NC}"
else
    echo -e "${RED}❌ PM2: Failed${NC}"
fi

if run_remote "netstat -tulpn | grep :5001" &> /dev/null; then
    echo -e "${GREEN}✅ Port 5001: Listening${NC}"
else
    echo -e "${RED}❌ Port 5001: Not listening${NC}"
fi

if run_remote_sudo "systemctl is-active nginx" | grep -q "active"; then
    echo -e "${GREEN}✅ nginx: Active${NC}"
else
    echo -e "${RED}❌ nginx: Inactive${NC}"
fi

echo -e "\n${BLUE}🌐 Try accessing: http://$REMOTE_HOST${NC}"
echo -e "${BLUE}📱 Monitor with: pm2 monit${NC}"
echo -e "${BLUE}📝 View logs: pm2 logs actc-web${NC}"

echo -e "\n${GREEN}✅ Diagnostic completed!${NC}"
