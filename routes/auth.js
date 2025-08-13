const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// 登入
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 驗證輸入
        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        // 查找用戶
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        // 檢查用戶是否被停用
        if (!user.isActive) {
            return res.status(401).json({
                message: 'Account is suspended. Please contact administrator.'
            });
        }

        // 驗證密碼
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        // 更新最後登入時間
        user.lastLogin = new Date();
        await user.save();

        // 生成 JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                role: user.role 
            },
            process.env.JWT_SECRET || 'actc_super_secret_jwt_key_2025',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                isFirstLogin: user.isFirstLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 修改密碼 (需要認證)
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 驗證輸入
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({
                message: 'New password must be at least 4 characters long'
            });
        }

        // 查找用戶
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // 驗證當前密碼
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        // 檢查新密碼是否與當前密碼相同
        const isNewPasswordSame = await user.comparePassword(newPassword);
        if (isNewPasswordSame) {
            return res.status(400).json({
                message: 'New password must be different from current password'
            });
        }

        // 更新密碼
        await user.updatePassword(newPassword);

        res.json({
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 強制修改密碼 (首次登入)
router.post('/force-change-password', auth, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                message: 'New password is required'
            });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({
                message: 'Password must be at least 4 characters long'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // 檢查是否為預設密碼
        const isDefaultPassword = await user.comparePassword('user');
        if (!isDefaultPassword && !user.isFirstLogin) {
            return res.status(400).json({
                message: 'Password has already been changed'
            });
        }

        // 更新密碼
        await user.updatePassword(newPassword);

        res.json({
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Force change password error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 驗證 token
router.get('/verify', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({
                message: 'User not found or inactive'
            });
        }

        res.json({
            message: 'Token is valid',
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                isFirstLogin: user.isFirstLogin
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

module.exports = router;
