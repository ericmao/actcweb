#!/bin/bash

# Quick Deployment Script - Runs both main deployment and MongoDB setup
# Deploys to: parallels@10.211.55.15

set -e

echo "🚀 Starting Quick Deployment Process..."

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    else
        echo "❌ Please install sshpass manually for your OS"
        exit 1
    fi
fi

echo "📋 Step 1: Deploying main application..."
./deploy-ssh.sh

echo "📋 Step 2: Setting up MongoDB..."
./deploy-ssh-mongo.sh

echo "✅ Quick deployment completed successfully!"
echo "🌐 Your application is now running at: http://10.211.55.15"
echo "📱 Use 'pm2 monit' to monitor your application"
echo "📝 Use 'pm2 logs actc-web' to view logs"
