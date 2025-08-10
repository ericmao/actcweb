# ACTC Website Project Structure

## Overview
ACTC (國際資訊安全人才培育與推廣協會) 動態網站專案

## Project Architecture
- **Frontend**: HTML + Tailwind CSS (Responsive Design)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT + bcrypt
- **File Uploads**: Multer
- **Security**: Helmet + CORS

## Directory Structure

```
actc_web/
├── public/                          # Static files served by Express
│   ├── assets/                      # Organized assets
│   │   ├── images/                  # Images (logos, photos)
│   │   ├── icons/                   # Favicons, touch icons
│   │   ├── css/                     # Custom CSS files
│   │   └── js/                      # Custom JavaScript files
│   ├── index.html                   # Main homepage
│   ├── admin.html                   # Admin panel
│   └── uploads/                     # User uploaded files
├── routes/                          # Express route handlers
│   ├── auth.js                      # Authentication routes
│   └── news.js                      # News management routes
├── models/                          # MongoDB models
│   ├── User.js                      # User model
│   └── News.js                      # News model
├── middleware/                      # Express middleware
│   └── auth.js                      # Authentication middleware
├── server.js                        # Main server file
├── package.json                     # Dependencies and scripts
├── env.example                      # Environment variables template
└── README.md                        # Project documentation
```

## Key Features

### Frontend Pages
1. **Homepage** (`index.html`) - Main landing page with news and courses
2. **About** (`about.html`) - Association information and board members
3. **Workgroups** (`workgroups.html`) - Professional working groups
4. **Secretariat** (`secretariat.html`) - Administrative team
5. **Admin Panel** (`admin.html`) - Content management system

### Backend API Endpoints
- `/api/auth/*` - Authentication (login, register, logout)
- `/api/news/*` - News management (CRUD operations)
- `/uploads/*` - File uploads
- `/` - Static file serving

### Database Models
- **User**: Admin accounts with role-based access
- **News**: News articles with metadata and content

## Development Setup

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation
```bash
npm install
cp env.example .env
# Configure .env with your MongoDB URI
npm run dev
```

### Environment Variables
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/actc_website
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

## Deployment
- **Development**: `npm run dev` (with nodemon)
- **Production**: `npm start`
- **Static Files**: Served from `/public` directory
- **API**: RESTful endpoints under `/api/*`

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Helmet.js security headers
- CORS configuration
- Input validation and sanitization

## File Organization Best Practices
- All static assets in `/public/assets/*`
- Consistent naming convention for images
- Modular route and model structure
- Middleware separation for reusability
