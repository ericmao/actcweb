#!/bin/bash

# ACTC Web Application SSH Deployment Script
# Deploys to: parallels@10.211.55.15

set -e  # Exit on any error

# Configuration
REMOTE_USER="parallels"
REMOTE_HOST="10.211.55.15"
REMOTE_PASSWORD="2doiouxi"
SUDO_PASSWORD="2doiouxi"
REMOTE_DIR="/home/parallels/actc_web"
REMOTE_PORT="5001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting ACTC Web Application SSH Deployment...${NC}"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass is not installed. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    else
        echo -e "${RED}❌ Please install sshpass manually for your OS${NC}"
        exit 1
    fi
fi

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

# Function to copy files
copy_files() {
    local src="$1"
    local dest="$2"
    sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no -r "$src" "$REMOTE_USER@$REMOTE_HOST:$dest"
}

echo -e "${YELLOW}📋 Checking remote server connection...${NC}"

# Test connection
if ! run_remote "echo 'Connection successful'" &> /dev/null; then
    echo -e "${RED}❌ Failed to connect to remote server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected to remote server${NC}"

echo -e "${YELLOW}🔧 Setting up remote environment...${NC}"

# Create remote directory if it doesn't exist
run_remote "mkdir -p $REMOTE_DIR"

# Install Node.js and npm if not present
if ! run_remote "command -v node" &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js on remote server...${NC}"
    run_remote_sudo "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
    run_remote_sudo "apt-get install -y nodejs"
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi

# Install PM2 if not present
if ! run_remote "command -v pm2" &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2 globally...${NC}"
    run_remote "npm install -g pm2"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Install nginx if not present
if ! run_remote "command -v nginx" &> /dev/null; then
    echo -e "${YELLOW}📦 Installing nginx...${NC}"
    run_remote_sudo "apt-get update && apt-get install -y nginx"
    run_remote_sudo "systemctl enable nginx"
else
    echo -e "${GREEN}✅ nginx already installed${NC}"
fi

echo -e "${YELLOW}📁 Copying application files...${NC}"

# Stop existing PM2 process if running
run_remote "pm2 stop actc-web || true"
run_remote "pm2 delete actc-web || true"

# Copy application files (excluding node_modules and other unnecessary files)
echo -e "${YELLOW}📤 Copying source files...${NC}"
copy_files "." "$REMOTE_DIR"

# Remove unnecessary files on remote
run_remote "cd $REMOTE_DIR && rm -rf node_modules package-lock.json .git .gitignore .env"

echo -e "${YELLOW}📦 Installing dependencies on remote server...${NC}"

# Install dependencies on remote
run_remote "cd $REMOTE_DIR && npm install --production"

echo -e "${YELLOW}🔧 Setting up environment variables...${NC}"

# Create .env file on remote
run_remote "cd $REMOTE_DIR && cat > .env << 'EOF'
NODE_ENV=production
PORT=$REMOTE_PORT
JWT_SECRET=actc_super_secret_jwt_key_2025_secure_and_unique
MONGO_URI=mongodb://localhost:27017/actc_website
EOF"

echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"

# Start application with PM2
run_remote "cd $REMOTE_DIR && pm2 start server.js --name actc-web --env production"
run_remote "pm2 save"
run_remote "pm2 startup"

echo -e "${YELLOW}🌐 Setting up nginx reverse proxy...${NC}"

# Create nginx configuration
run_remote_sudo "cat > /etc/nginx/sites-available/actc-web << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:$REMOTE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads {
        alias $REMOTE_DIR/uploads;
        expires 30d;
        add_header Cache-Control \"public, immutable\";
    }

    location /assets {
        alias $REMOTE_DIR/public/assets;
        expires 30d;
        add_header Cache-Control \"public, immutable\";
    }
}
EOF"

# Enable site and restart nginx
run_remote_sudo "ln -sf /etc/nginx/sites-available/actc-web /etc/nginx/sites-enabled/"
run_remote_sudo "rm -f /etc/nginx/sites-enabled/default"
run_remote_sudo "nginx -t"
run_remote_sudo "systemctl restart nginx"

echo -e "${YELLOW}🔒 Setting up firewall...${NC}"

# Configure firewall
run_remote_sudo "ufw allow 22/tcp"
run_remote_sudo "ufw allow 80/tcp"
run_remote_sudo "ufw allow 443/tcp"
run_remote_sudo "ufw --force enable"

echo -e "${YELLOW}📊 Checking application status...${NC}"

# Check application status
run_remote "pm2 status"
run_remote "pm2 logs actc-web --lines 10"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Your application is now running at: http://$REMOTE_HOST${NC}"
echo -e "${BLUE}📱 PM2 Dashboard: pm2 monit${NC}"
echo -e "${BLUE}📝 Logs: pm2 logs actc-web${NC}"
echo -e "${BLUE}🔄 Restart: pm2 restart actc-web${NC}"
echo -e "${BLUE}⏹️  Stop: pm2 stop actc-web${NC}"

# Optional: Open in browser
if command -v open &> /dev/null; then
    echo -e "${YELLOW}🌐 Opening application in browser...${NC}"
    open "http://$REMOTE_HOST"
fi
