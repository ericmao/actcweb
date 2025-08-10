const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    images: [{
        type: String,
        trim: true
    }],
    file: {
        type: String,
        trim: true
    },
    link: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true; // 允許空值
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Link must be a valid URL'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 索引優化
newsSchema.index({ date: -1 });
newsSchema.index({ createdAt: -1 });

// 虛擬字段：格式化日期
newsSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
});

// 虛擬字段：檢查是否有附件
newsSchema.virtual('hasAttachment').get(function() {
    return this.file || this.link;
});

// 確保虛擬字段在 JSON 中顯示
newsSchema.set('toJSON', { virtuals: true });
newsSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('News', newsSchema);
