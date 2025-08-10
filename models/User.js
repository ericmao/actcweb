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
        minlength: [8, 'Password must be at least 8 characters long']
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
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(newPassword, 10);
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
