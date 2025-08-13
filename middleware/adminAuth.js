const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 基本認證中間件
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'actc_super_secret_jwt_key_2025');
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired. Please login again.' 
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token.' 
            });
        }
        res.status(400).json({ 
            message: 'Invalid token.' 
        });
    }
};

// 管理員權限中間件
const adminAuth = async (req, res, next) => {
    try {
        // 先進行基本認證
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'actc_super_secret_jwt_key_2025');
        
        // 查找用戶並檢查角色
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ 
                message: 'User not found or inactive.' 
            });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin role required.' 
            });
        }
        
        req.user = { 
            ...decoded, 
            role: user.role, 
            userId: user._id.toString() 
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired. Please login again.' 
            });
        }
        res.status(401).json({ 
            message: 'Invalid token.' 
        });
    }
};

module.exports = { auth, adminAuth };
