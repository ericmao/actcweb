const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [4, 'Password must be at least 4 characters long'] // 降低最小長度以配合default密碼
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFirstLogin: {
        type: Boolean,
        default: true // 新用戶首次登入需要更改密碼
    },
    email: {
        type: String,
        trim: true,
        sparse: true // 允許多個null值，但不允許重複的非null值
    },
    fullName: {
        type: String,
        trim: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// 密碼驗證方法
userSchema.methods.comparePassword = async function(candidatePassword) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(candidatePassword, this.password);
};

// 密碼更新方法
userSchema.methods.updatePassword = async function(newPassword) {
    this.password = newPassword; // 讓 pre-save middleware 處理加密
    this.isFirstLogin = false; // 更改密碼後標記為非首次登入
    return this.save();
};

// 密碼加密中間件
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model('User', userSchema);
