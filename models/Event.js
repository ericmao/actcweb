const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    type: {
        type: String,
        required: [true, 'Event type is required'],
        enum: {
            values: ['meetup', 'workshop', 'course', 'others'],
            message: 'Event type must be one of: meetup, workshop, course, others'
        }
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        maxlength: [200, 'Location cannot exceed 200 characters']
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
eventSchema.index({ date: -1 });
eventSchema.index({ type: 1 });
eventSchema.index({ createdAt: -1 });

// 虛擬字段：格式化日期
eventSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short'
    });
});

// 虛擬字段：格式化時間
eventSchema.virtual('formattedDateTime').get(function() {
    return this.date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// 虛擬字段：活動類型中文名稱
eventSchema.virtual('typeLabel').get(function() {
    const typeLabels = {
        'meetup': '聚會',
        'workshop': '工作坊',
        'course': '課程',
        'others': '其他'
    };
    return typeLabels[this.type] || this.type;
});

// 虛擬字段：檢查是否有外部連結
eventSchema.virtual('hasLink').get(function() {
    return !!this.link;
});

// 虛擬字段：判斷連結類型
eventSchema.virtual('linkIcon').get(function() {
    if (!this.link) return null;
    
    const url = this.link.toLowerCase();
    if (url.includes('discord')) return 'fab fa-discord';
    if (url.includes('teams') || url.includes('microsoft')) return 'fab fa-microsoft';
    return 'fas fa-external-link-alt';
});

// 確保虛擬字段在 JSON 中顯示
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
