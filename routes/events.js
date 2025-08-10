const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// 獲取所有活動 (公開)
router.get('/', async (req, res) => {
    try {
        const events = await Event.find()
            .sort({ date: 1, createdAt: -1 }) // 按日期升序排列，新建立的在前
            .select('-__v');
        
        res.json(events);
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 創建活動 (需要認證)
router.post('/', auth, async (req, res) => {
    try {
        const { title, type, description, date, location, link } = req.body;
        
        // 驗證必填字段
        if (!title || !type || !description || !date || !location) {
            return res.status(400).json({
                message: 'Title, type, description, date, and location are required'
            });
        }

        // 驗證活動類型
        const validTypes = ['meetup', 'workshop', 'course', 'others'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: 'Invalid event type. Must be one of: ' + validTypes.join(', ')
            });
        }

        // 創建活動
        const event = new Event({
            title,
            type,
            description,
            date: new Date(date),
            location,
            link: link || ''
        });

        await event.save();

        res.status(201).json({
            message: 'Event created successfully',
            event
        });

    } catch (error) {
        console.error('Create event error:', error);
        
        // 處理不同類型的錯誤
        let errorMessage = 'Internal server error';
        let statusCode = 500;

        if (error.name === 'ValidationError') {
            errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
            statusCode = 400;
        } else if (error.message) {
            errorMessage = error.message;
            statusCode = 400;
        }

        res.status(statusCode).json({
            message: errorMessage
        });
    }
});

// 更新活動 (需要認證)
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, type, description, date, location, link } = req.body;
        
        // 查找活動
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // 驗證活動類型（如果提供）
        if (type) {
            const validTypes = ['meetup', 'workshop', 'course', 'others'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    message: 'Invalid event type. Must be one of: ' + validTypes.join(', ')
                });
            }
        }

        // 更新活動
        const updatedEvent = await Event.findByIdAndUpdate(id, {
            title: title || event.title,
            type: type || event.type,
            description: description || event.description,
            date: date ? new Date(date) : event.date,
            location: location || event.location,
            link: link !== undefined ? link : event.link
        }, { new: true, runValidators: true });

        res.json({
            message: 'Event updated successfully',
            event: updatedEvent
        });

    } catch (error) {
        console.error('Update event error:', error);
        
        // 處理不同類型的錯誤
        let errorMessage = 'Internal server error';
        let statusCode = 500;

        if (error.name === 'ValidationError') {
            errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
            statusCode = 400;
        } else if (error.message) {
            errorMessage = error.message;
            statusCode = 400;
        }

        res.status(statusCode).json({
            message: errorMessage
        });
    }
});

// 刪除活動 (需要認證)
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 查找活動
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // 刪除活動
        await Event.findByIdAndDelete(id);

        res.json({
            message: 'Event deleted successfully'
        });

    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 獲取單個活動 (公開)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id).select('-__v');
        
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        res.json(event);
    } catch (error) {
        console.error('Get single event error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

module.exports = router;
