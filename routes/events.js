const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 配置 multer 用於檔案上傳
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        
        if (file.fieldname === 'image' || file.fieldname === 'instructorPhoto') {
            uploadPath = 'uploads/images/';
        } else if (file.fieldname === 'file') {
            uploadPath = 'uploads/files/';
        } else {
            uploadPath = 'uploads/';
        }
        
        // 確保目錄存在
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // 生成唯一檔名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'image' || file.fieldname === 'instructorPhoto') {
        // 圖片檔案類型檢查
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for image fields'), false);
        }
    } else if (file.fieldname === 'file') {
        // 一般檔案類型檢查（20MB限制）
        if (file.size > 20 * 1024 * 1024) {
            cb(new Error('File size cannot exceed 20MB'), false);
        } else {
            cb(null, true);
        }
    } else {
        cb(null, true);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB
    }
});

// 獲取所有活動 (公開)
router.get('/', async (req, res) => {
    try {
        const { 
            type, 
            status, 
            search, 
            tags, 
            upcoming, 
            page = 1, 
            limit = 10,
            sortBy = 'date',
            sortOrder = 'asc'
        } = req.query;

        // 建立查詢條件
        let query = {};
        
        // 類型篩選
        if (type) {
            query.type = type;
        }
        
        // 狀態篩選 (公開 API 只顯示已發布的活動)
        query.status = { $in: ['published', 'registration_open', 'registration_closed'] };
        
        // 搜尋功能
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { shortDescription: { $regex: search, $options: 'i' } },
                { 'instructor.name': { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        // 標籤篩選
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }
        
        // 即將到來的活動
        if (upcoming === 'true') {
            query.date = { $gte: new Date() };
        }

        // 排序
        let sortOptions = {};
        if (sortBy === 'date') {
            sortOptions.date = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'title') {
            sortOptions.title = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'createdAt') {
            sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
        }
        
        // 分頁
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // 執行查詢
        const events = await Event.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v');
        
        // 獲取總數
        const total = await Event.countDocuments(query);
        
        res.json({
            events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 獲取所有活動 (管理員用)
router.get('/admin', auth, async (req, res) => {
    try {
        const { 
            type, 
            status, 
            search, 
            tags, 
            page = 1, 
            limit = 10,
            sortBy = 'date',
            sortOrder = 'asc'
        } = req.query;

        // 建立查詢條件
        let query = {};
        
        // 類型篩選
        if (type) {
            query.type = type;
        }
        
        // 狀態篩選 (管理員可以看到所有狀態)
        if (status) {
            query.status = status;
        }
        
        // 搜尋功能
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { shortDescription: { $regex: search, $options: 'i' } },
                { 'instructor.name': { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        // 標籤篩選
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }

        // 排序
        let sortOptions = {};
        if (sortBy === 'date') {
            sortOptions.date = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'title') {
            sortOptions.title = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'createdAt') {
            sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
        }
        
        // 分頁
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // 執行查詢
        const events = await Event.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v');
        
        // 獲取總數
        const total = await Event.countDocuments(query);
        
        res.json({
            events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get admin events error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 獲取活動統計資訊 (管理員用)
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await Event.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const totalEvents = await Event.countDocuments();
        const upcomingEvents = await Event.countDocuments({
            date: { $gte: new Date() },
            status: { $in: ['published', 'registration_open'] }
        });
        
        // 新增檔案和圖片統計
        const eventsWithFiles = await Event.countDocuments({ 'file.path': { $exists: true, $ne: null } });
        const eventsWithImages = await Event.countDocuments({ 'image': { $exists: true, $ne: null } });
        
        res.json({
            totalEvents,
            upcomingEvents,
            eventsWithFiles,
            eventsWithImages,
            statusBreakdown: stats
        });
    } catch (error) {
        console.error('Get events stats error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 創建活動 (需要認證，支援檔案上傳)
router.post('/', auth, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'instructorPhoto', maxCount: 1 }
]), async (req, res) => {
    try {
        const { 
            title, 
            type, 
            description, 
            shortDescription,
            date, 
            endDate,
            location, 
            virtualLocation,
            link,
            instructor,
            duration,
            capacity,
            price,
            status,
            tags,
            requirements,
            materials
        } = req.body;
        
        // 驗證必填字段
        if (!title || !type || !description || !date || !location) {
            return res.status(400).json({
                message: 'Title, type, description, date, and location are required'
            });
        }

        // 驗證活動類型
        const validTypes = ['meetup', 'workshop', 'course', 'conference', 'training', 'others'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: 'Invalid event type. Must be one of: ' + validTypes.join(', ')
            });
        }

        // 驗證狀態
        const validStatuses = ['draft', 'published', 'registration_open', 'registration_closed', 'cancelled', 'completed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        // 處理檔案上傳
        let eventData = {
            title,
            type,
            description,
            shortDescription,
            date: new Date(date),
            endDate: endDate ? new Date(endDate) : undefined,
            location,
            virtualLocation,
            link: link || '',
            instructor: instructor ? JSON.parse(instructor) : {},
            duration: duration ? JSON.parse(duration) : {},
            capacity: capacity || undefined,
            price: price ? JSON.parse(price) : { isFree: true },
            status: status || 'draft',
            tags: tags ? JSON.parse(tags) : [],
            requirements,
            materials: materials ? JSON.parse(materials) : []
        };

        // 處理活動圖片
        if (req.files && req.files.image) {
            eventData.image = '/' + req.files.image[0].path;
        }

        // 處理活動檔案
        if (req.files && req.files.file) {
            eventData.file = {
                path: '/' + req.files.file[0].path,
                originalName: req.files.file[0].originalname,
                size: req.files.file[0].size,
                mimeType: req.files.file[0].mimetype
            };
        }

        // 處理講師照片
        if (req.files && req.files.instructorPhoto && eventData.instructor) {
            eventData.instructor.photo = '/' + req.files.instructorPhoto[0].path;
        }

        // 創建活動
        const event = new Event(eventData);
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

// 更新活動 (需要認證，支援檔案上傳)
router.put('/:id', auth, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'instructorPhoto', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // 查找活動
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // 驗證活動類型（如果提供）
        if (updateData.type) {
            const validTypes = ['meetup', 'workshop', 'course', 'conference', 'training', 'others'];
            if (!validTypes.includes(updateData.type)) {
                return res.status(400).json({
                    message: 'Invalid event type. Must be one of: ' + validTypes.join(', ')
                });
            }
        }

        // 驗證狀態（如果提供）
        if (updateData.status) {
            const validStatuses = ['draft', 'published', 'registration_open', 'registration_closed', 'cancelled', 'completed'];
            if (!validStatuses.includes(updateData.status)) {
                return res.status(400).json({
                    message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
                });
            }
        }

        // 處理日期欄位
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }
        if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
        }

        // 處理 JSON 欄位
        if (updateData.instructor) {
            updateData.instructor = JSON.parse(updateData.instructor);
        }
        if (updateData.duration) {
            updateData.duration = JSON.parse(updateData.duration);
        }
        if (updateData.price) {
            updateData.price = JSON.parse(updateData.price);
        }
        if (updateData.tags) {
            updateData.tags = JSON.parse(updateData.tags);
        }
        if (updateData.materials) {
            updateData.materials = JSON.parse(updateData.materials);
        }

        // 處理檔案上傳
        if (req.files && req.files.image) {
            updateData.image = '/' + req.files.image[0].path;
            
            // 刪除舊圖片
            if (event.image && fs.existsSync(event.image.substring(1))) {
                fs.unlinkSync(event.image.substring(1));
            }
        }

        if (req.files && req.files.file) {
            updateData.file = {
                path: '/' + req.files.file[0].path,
                originalName: req.files.file[0].originalname,
                size: req.files.file[0].size,
                mimeType: req.files.file[0].mimetype
            };
            
            // 刪除舊檔案
            if (event.file && event.file.path && fs.existsSync(event.file.path.substring(1))) {
                fs.unlinkSync(event.file.path.substring(1));
            }
        }

        if (req.files && req.files.instructorPhoto && updateData.instructor) {
            updateData.instructor.photo = '/' + req.files.instructorPhoto[0].path;
            
            // 刪除舊講師照片
            if (event.instructor && event.instructor.photo && fs.existsSync(event.instructor.photo.substring(1))) {
                fs.unlinkSync(event.instructor.photo.substring(1));
            }
        }

        // 更新活動
        const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { 
            new: true, 
            runValidators: true 
        });

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

        // 刪除相關檔案
        if (event.image && fs.existsSync(event.image.substring(1))) {
            fs.unlinkSync(event.image.substring(1));
        }
        
        if (event.file && event.file.path && fs.existsSync(event.file.path.substring(1))) {
            fs.unlinkSync(event.file.path.substring(1));
        }
        
        if (event.instructor && event.instructor.photo && fs.existsSync(event.instructor.photo.substring(1))) {
            fs.unlinkSync(event.instructor.photo.substring(1));
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

        // 檢查活動狀態
        if (!['published', 'registration_open', 'registration_closed'].includes(event.status)) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // 增加瀏覽次數
        event.views += 1;
        await event.save();

        res.json(event);
    } catch (error) {
        console.error('Get single event error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 下載活動檔案 (公開)
router.get('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);
        
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        if (!event.file || !event.file.path) {
            return res.status(404).json({
                message: 'No file available for download'
            });
        }

        // 檢查檔案是否存在
        const filePath = event.file.path.substring(1);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: 'File not found on server'
            });
        }

        // 增加下載次數
        event.downloads += 1;
        await event.save();

        // 設定下載標頭
        res.setHeader('Content-Disposition', `attachment; filename="${event.file.originalName}"`);
        res.setHeader('Content-Type', event.file.mimeType);
        
        // 發送檔案
        res.sendFile(path.resolve(filePath));

    } catch (error) {
        console.error('Download event file error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 報名活動 (公開)
router.post('/:id/register', async (req, res) => {
    try {
        const { id } = req.params;
        const { participantName, participantEmail, participantPhone } = req.body;
        
        // 驗證必填欄位
        if (!participantName || !participantEmail) {
            return res.status(400).json({
                message: 'Participant name and email are required'
            });
        }

        // 查找活動
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // 檢查活動狀態
        if (event.status !== 'registration_open') {
            return res.status(400).json({
                message: 'Event registration is not open'
            });
        }

        // 檢查名額
        if (event.capacity && event.registeredCount >= event.capacity) {
            return res.status(400).json({
                message: 'Event is full'
            });
        }

        // 增加報名人數
        event.registeredCount += 1;
        await event.save();

        res.json({
            message: 'Registration successful',
            event: {
                id: event._id,
                title: event.title,
                registeredCount: event.registeredCount,
                remainingSpots: event.remainingSpots
            }
        });

    } catch (error) {
        console.error('Event registration error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 取消報名 (公開)
router.post('/:id/unregister', async (req, res) => {
    try {
        const { id } = req.params;
        const { participantEmail } = req.body;
        
        if (!participantEmail) {
            return res.status(400).json({
                message: 'Participant email is required'
            });
        }

        // 查找活動
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // 檢查活動狀態
        if (event.status !== 'registration_open') {
            return res.status(400).json({
                message: 'Event registration is not open'
            });
        }

        // 減少報名人數
        if (event.registeredCount > 0) {
            event.registeredCount -= 1;
            await event.save();
        }

        res.json({
            message: 'Unregistration successful',
            event: {
                id: event._id,
                title: event.title,
                registeredCount: event.registeredCount,
                remainingSpots: event.remainingSpots
            }
        });

    } catch (error) {
        console.error('Event unregistration error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

module.exports = router;
