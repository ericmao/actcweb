const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

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

        // 驗證密碼
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        // 生成 JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'actc_super_secret_jwt_key_2025',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username
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

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'New password must be at least 8 characters long'
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

// 驗證 token (可選，用於前端檢查登入狀態)
router.get('/verify', auth, (req, res) => {
    res.json({
        message: 'Token is valid',
        user: {
            id: req.user.userId,
            username: req.user.username
        }
    });
});

module.exports = router;
