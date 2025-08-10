#!/bin/bash

# ACTC Web Project Deployment Script
# Target: parallels@10.211.55.15

set -e

echo "🚀 Starting deployment to parallels@10.211.55.15..."

# Configuration
REMOTE_USER="parallels"
REMOTE_HOST="10.211.55.15"
REMOTE_PASS="2doiouxi"
REMOTE_DIR="/home/parallels/actc_web"
REMOTE_PORT="22"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v sshpass &> /dev/null; then
        print_error "sshpass is not installed. Installing..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install sshpass
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y sshpass
        else
            print_error "Please install sshpass manually for your OS"
            exit 1
        fi
    fi
    
    if ! command -v rsync &> /dev/null; then
        print_error "rsync is not installed. Please install it manually."
        exit 1
    fi
}

# Create remote directory structure
setup_remote_dirs() {
    print_status "Setting up remote directories..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        mkdir -p ~/actc_web
        mkdir -p ~/actc_web/uploads/files
        mkdir -p ~/actc_web/uploads/images
        mkdir -p ~/actc_web/logs
        mkdir -p ~/actc_web/backups
EOF
}

# Install Node.js and MongoDB on remote server
install_remote_dependencies() {
    print_status "Installing Node.js and MongoDB on remote server..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        # Update package list
        sudo apt-get update
        
        # Install Node.js 18.x
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Install PM2 for process management
        if ! command -v pm2 &> /dev/null; then
            sudo npm install -g pm2
        fi
        
        # Install MongoDB
        if ! command -v mongod &> /dev/null; then
            wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            sudo systemctl enable mongod
            sudo systemctl start mongod
        fi
        
        # Install nginx
        if ! command -v nginx &> /dev/null; then
            sudo apt-get install -y nginx
            sudo systemctl enable nginx
            sudo systemctl start nginx
        fi
        
        # Install certbot for SSL
        if ! command -v certbot &> /dev/null; then
            sudo apt-get install -y certbot python3-certbot-nginx
        fi
EOF
}

# Sync project files to remote server
sync_files() {
    print_status "Syncing project files to remote server..."
    
    # Exclude unnecessary files
    rsync -avz --progress \
        --exclude 'node_modules/' \
        --exclude '.git/' \
        --exclude 'venv/' \
        --exclude '*.log' \
        --exclude '.env' \
        --exclude 'uploads/' \
        --exclude 'logs/' \
        --exclude 'backups/' \
        -e "sshpass -p $REMOTE_PASS ssh -o StrictHostKeyChecking=no -p $REMOTE_PORT" \
        ./ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
}

# Install npm dependencies on remote server
install_npm_dependencies() {
    print_status "Installing npm dependencies on remote server..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << EOF
        cd $REMOTE_DIR
        npm install --production
EOF
}

# Create environment file on remote server
create_env_file() {
    print_status "Creating environment file on remote server..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        cd ~/actc_web
        
        # Create .env file
        cat > .env << 'ENVEOF'
MONGO_URI=mongodb://localhost:27017/actc_website
JWT_SECRET=actc_super_secret_jwt_key_2025_production_secure
PORT=5001
NODE_ENV=production
EOF

        # Create production environment file
        cat > .env.production << 'ENVEOF'
MONGO_URI=mongodb://localhost:27017/actc_website
JWT_SECRET=actc_super_secret_jwt_key_2025_production_secure
PORT=5001
NODE_ENV=production
ENVEOF
EOF
}

# Setup PM2 ecosystem file
setup_pm2() {
    print_status "Setting up PM2 process manager..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        cd ~/actc_web
        
        # Create PM2 ecosystem file
        cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'actc-web',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
PM2EOF
EOF
}

# Setup nginx configuration
setup_nginx() {
    print_status "Setting up nginx configuration..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        # Create nginx site configuration
        sudo tee /etc/nginx/sites-available/actc-web << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL configuration (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Client max body size for file uploads
    client_max_body_size 10M;
    
    # Root directory
    root /home/parallels/actc_web/public;
    index index.html;
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
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
    
    # Uploads directory
    location /uploads/ {
        alias /home/parallels/actc_web/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Admin panel
    location /admin {
        try_files $uri $uri/ /admin.html;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINXEOF

        # Enable the site
        sudo ln -sf /etc/nginx/sites-available/actc-web /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test nginx configuration
        sudo nginx -t
        
        # Reload nginx
        sudo systemctl reload nginx
EOF
}

# Start the application
start_application() {
    print_status "Starting the application..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        cd ~/actc_web
        
        # Stop existing PM2 processes
        pm2 stop actc-web || true
        pm2 delete actc-web || true
        
        # Start the application with PM2
        pm2 start ecosystem.config.js --env production
        
        # Save PM2 configuration
        pm2 save
        
        # Setup PM2 to start on boot
        pm2 startup
EOF
}

# Create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        cd ~/actc_web
        
        # Create startup script
        cat > start.sh << 'STARTEOF'
#!/bin/bash

# ACTC Web Startup Script
cd /home/parallels/actc_web

# Start MongoDB if not running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    sudo systemctl start mongod
fi

# Start nginx if not running
if ! pgrep -x "nginx" > /dev/null; then
    echo "Starting nginx..."
    sudo systemctl start nginx
fi

# Start the application with PM2
echo "Starting ACTC Web application..."
pm2 start ecosystem.config.js --env production

echo "ACTC Web application started successfully!"
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs actc-web"
STARTEOF

        chmod +x start.sh
        
        # Create stop script
        cat > stop.sh << 'STOPEOF'
#!/bin/bash

# ACTC Web Stop Script
cd /home/parallels/actc_web

echo "Stopping ACTC Web application..."
pm2 stop actc-web

echo "ACTC Web application stopped successfully!"
STOPEOF

        chmod +x stop.sh
        
        # Create restart script
        cat > restart.sh << 'RESTARTEOF'
#!/bin/bash

# ACTC Web Restart Script
cd /home/parallels/actc_web

echo "Restarting ACTC Web application..."
pm2 restart actc-web

echo "ACTC Web application restarted successfully!"
RESTARTEOF

        chmod +x restart.sh
EOF
}

# Display deployment information
show_deployment_info() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "🌐 Application Information:"
    echo "   - URL: http://10.211.55.15 (HTTP)"
    echo "   - Admin Panel: http://10.211.55.15/admin"
    echo "   - API Endpoint: http://10.211.55.15/api"
    echo ""
    echo "🔧 Management Commands:"
    echo "   - Start: ssh parallels@10.211.55.15 'cd ~/actc_web && ./start.sh'"
    echo "   - Stop: ssh parallels@10.211.55.15 'cd ~/actc_web && ./stop.sh'"
    echo "   - Restart: ssh parallels@10.211.55.15 'cd ~/actc_web && ./restart.sh'"
    echo "   - View logs: ssh parallels@10.211.55.15 'cd ~/actc_web && pm2 logs actc-web'"
    echo "   - View status: ssh parallels@10.211.55.15 'cd ~/actc_web && pm2 status'"
    echo ""
    echo "📁 Remote Directory: /home/parallels/actc_web"
    echo "🗄️  Database: MongoDB running on localhost:27017"
    echo "⚡ Process Manager: PM2"
    echo "🌍 Web Server: nginx"
    echo ""
    echo "🔐 Default Admin Credentials:"
    echo "   - Username: admin"
    echo "   - Password: admin"
    echo ""
    echo "⚠️  Important Notes:"
    echo "   - Change default admin password after first login"
    echo "   - Configure SSL certificate with certbot if needed"
    echo "   - Update server firewall settings if required"
}

# Main deployment function
main() {
    print_status "Starting ACTC Web deployment..."
    
    check_requirements
    setup_remote_dirs
    install_remote_dependencies
    sync_files
    install_npm_dependencies
    create_env_file
    setup_pm2
    setup_nginx
    start_application
    create_startup_script
    show_deployment_info
}

# Run deployment
main "$@"
