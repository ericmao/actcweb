# ACTC Web Application - SSH Deployment Guide

This guide explains how to deploy the ACTC Web Application to your SSH server at `parallels@10.211.55.15`.

## 🚀 Quick Start

For the fastest deployment, run:

```bash
./deploy-quick.sh
```

This will automatically:
1. Deploy the main application
2. Set up MongoDB
3. Configure nginx reverse proxy
4. Set up PM2 process management

## 📋 Prerequisites

### Local Machine Requirements
- macOS or Linux
- `sshpass` (will be installed automatically if missing)
- Git repository with your application code

### Remote Server Requirements
- Ubuntu/Debian-based system
- SSH access with sudo privileges
- Internet connection for package installation

## 🔧 Manual Deployment Steps

### Step 1: Main Application Deployment

```bash
./deploy-ssh.sh
```

This script will:
- Connect to your remote server
- Install Node.js, PM2, and nginx
- Copy your application files
- Set up environment variables
- Configure nginx reverse proxy
- Start the application with PM2

### Step 2: MongoDB Setup (Optional)

If you need a local MongoDB instance:

```bash
./deploy-ssh-mongo.sh
```

This will:
- Install MongoDB 6.0
- Create secure database users
- Configure authentication
- Update your application's database connection

## 🌐 What Gets Deployed

### Application Structure
```
/home/parallels/actc_web/
├── server.js          # Main Express server
├── package.json       # Dependencies
├── models/            # Database models
├── routes/            # API routes
├── middleware/        # Express middleware
├── public/            # Static files
├── uploads/           # User uploads
└── .env              # Environment variables
```

### Services
- **Node.js Application**: Running on port 5001
- **PM2 Process Manager**: For application management
- **nginx**: Reverse proxy on port 80
- **MongoDB**: Database on port 27017 (if enabled)
- **UFW Firewall**: Configured for security

## 📊 Application Management

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs actc-web

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart actc-web

# Stop application
pm2 stop actc-web

# View detailed info
pm2 show actc-web
```

### nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View status
sudo systemctl status nginx
```

### MongoDB Commands (if installed)
```bash
# Connect to database
mongosh -u actc_user -p actc_user_password_2025 actc_website

# View database status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

## 🔒 Security Features

### Firewall Configuration
- SSH (port 22): Allowed
- HTTP (port 80): Allowed
- HTTPS (port 443): Allowed
- All other ports: Blocked

### MongoDB Security
- Authentication enabled
- Separate users for admin and application
- Secure passwords configured

### Application Security
- Helmet.js for security headers
- CORS configuration
- JWT authentication
- Input validation

## 🐛 Troubleshooting

### Common Issues

#### Connection Failed
```bash
# Test SSH connection manually
ssh parallels@10.211.55.15
```

#### Application Not Starting
```bash
# Check PM2 logs
pm2 logs actc-web

# Check application status
pm2 status

# Restart application
pm2 restart actc-web
```

#### nginx Issues
```bash
# Check nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### MongoDB Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh --eval "db.runCommand('ping')"
```

### Log Locations
- **Application logs**: `pm2 logs actc-web`
- **nginx logs**: `/var/log/nginx/`
- **MongoDB logs**: `/var/log/mongodb/`
- **System logs**: `journalctl -u nginx` or `journalctl -u mongod`

## 🔄 Updating the Application

To deploy updates:

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Redeploy**:
   ```bash
   ./deploy-ssh.sh
   ```

3. **Restart application**:
   ```bash
   pm2 restart actc-web
   ```

## 📱 Monitoring

### PM2 Dashboard
```bash
pm2 monit
```

### System Resources
```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Network connections
netstat -tulpn
```

## 🌍 Environment Variables

The following environment variables are automatically configured:

```bash
NODE_ENV=production
PORT=5001
JWT_SECRET=actc_super_secret_jwt_key_2025_secure_and_unique
MONGO_URI=mongodb://actc_user:actc_user_password_2025@localhost:27017/actc_website
```

## 📞 Support

If you encounter issues:

1. Check the logs using the commands above
2. Verify all services are running
3. Check firewall and network connectivity
4. Ensure all dependencies are properly installed

## 🔐 Default Credentials

### Application
- **Admin username**: `admin`
- **Admin password**: `admin`

### MongoDB (if installed)
- **Admin user**: `actc_admin`
- **Admin password**: `actc_secure_password_2025`
- **App user**: `actc_user`
- **App password**: `actc_user_password_2025`

⚠️ **Important**: Change these default passwords in production!

---

**Happy Deploying! 🚀**
