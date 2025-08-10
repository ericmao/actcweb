#!/bin/bash

# ACTC Web Project Simple Deployment Script
# Target: parallels@10.211.55.15

set -e

echo "🚀 Starting simple deployment to parallels@10.211.55.15..."

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

# Test SSH connection
test_connection() {
    print_status "Testing SSH connection..."
    
    if sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
        print_status "SSH connection successful!"
    else
        print_error "SSH connection failed. Please check your credentials and network connection."
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
        echo "Directories created successfully"
EOF
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking if Node.js is installed..."
    
    if sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "command -v node" 2>/dev/null; then
        print_status "Node.js is already installed"
        return 0
    else
        print_warning "Node.js is not installed. You'll need to install it manually on the server."
        return 1
    fi
}

# Check if MongoDB is installed
check_mongodb() {
    print_status "Checking if MongoDB is installed..."
    
    if sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "command -v mongod" 2>/dev/null; then
        print_status "MongoDB is already installed"
        return 0
    else
        print_warning "MongoDB is not installed. You'll need to install it manually on the server."
        return 1
    fi
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
        if command -v npm &> /dev/null; then
            npm install --production
            echo "npm dependencies installed successfully"
        else
            echo "npm not found. Please install Node.js first."
        fi
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
ENVEOF

        echo "Environment file created successfully"
EOF
}

# Create simple startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        cd ~/actc_web
        
        # Create startup script
        cat > start.sh << 'STARTEOF'
#!/bin/bash

# ACTC Web Startup Script
cd /home/parallels/actc_web

echo "Starting ACTC Web application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Warning: MongoDB is not running. Please start it manually:"
    echo "  sudo systemctl start mongod"
fi

# Start the application
echo "Starting application on port 5001..."
node server.js &

echo "ACTC Web application started successfully!"
echo "Access the application at: http://10.211.55.15:5001"
echo "Admin panel at: http://10.211.55.15:5001/admin"
echo ""
echo "To stop the application, use: pkill -f 'node server.js'"
STARTEOF

        chmod +x start.sh
        
        # Create stop script
        cat > stop.sh << 'STOPEOF'
#!/bin/bash

# ACTC Web Stop Script
cd /home/parallels/actc_web

echo "Stopping ACTC Web application..."
pkill -f "node server.js" || true

echo "ACTC Web application stopped successfully!"
STOPEOF

        chmod +x stop.sh
        
        # Create status script
        cat > status.sh << 'STATUSEOF'
#!/bin/bash

# ACTC Web Status Script
cd /home/parallels/actc_web

echo "=== ACTC Web Application Status ==="

# Check if application is running
if pgrep -f "node server.js" > /dev/null; then
    echo "✅ Application is running"
    echo "Process ID: $(pgrep -f 'node server.js')"
    echo "Port: 5001"
else
    echo "❌ Application is not running"
fi

# Check MongoDB status
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB is not running"
fi

# Check Node.js installation
if command -v node &> /dev/null; then
    echo "✅ Node.js is installed: $(node --version)"
else
    echo "❌ Node.js is not installed"
fi

echo "================================"
STATUSEOF

        chmod +x status.sh
        
        echo "Startup scripts created successfully"
EOF
}

# Display deployment information
show_deployment_info() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "🌐 Application Information:"
    echo "   - URL: http://10.211.55.15:5001"
    echo "   - Admin Panel: http://10.211.55.15:5001/admin"
    echo "   - API Endpoint: http://10.211.55.15:5001/api"
    echo ""
    echo "🔧 Management Commands:"
    echo "   - Start: ssh parallels@10.211.55.15 'cd ~/actc_web && ./start.sh'"
    echo "   - Stop: ssh parallels@10.211.55.15 'cd ~/actc_web && ./stop.sh'"
    echo "   - Status: ssh parallels@10.211.55.15 'cd ~/actc_web && ./status.sh'"
    echo ""
    echo "📁 Remote Directory: /home/parallels/actc_web"
    echo "🗄️  Database: MongoDB (needs to be installed and started)"
    echo "⚡ Process Manager: Direct Node.js execution"
    echo ""
    echo "🔐 Default Admin Credentials:"
    echo "   - Username: admin"
    echo "   - Password: admin"
    echo ""
    echo "⚠️  Important Notes:"
    echo "   - Change default admin password after first login"
    echo "   - Application runs directly on port 5001"
    echo "   - You may need to install Node.js and MongoDB manually on the server"
    echo "   - For production, consider using PM2 and nginx"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. SSH to the server: ssh parallels@10.211.55.15"
    echo "   2. Navigate to project: cd ~/actc_web"
    echo "   3. Install dependencies: npm install --production"
    echo "   4. Start the application: ./start.sh"
}

# Main deployment function
main() {
    print_status "Starting ACTC Web simple deployment..."
    
    check_requirements
    test_connection
    setup_remote_dirs
    check_nodejs
    check_mongodb
    sync_files
    install_npm_dependencies
    create_env_file
    create_startup_script
    show_deployment_info
}

# Run deployment
main "$@"
