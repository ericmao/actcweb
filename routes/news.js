const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const News = require('../models/News');
const auth = require('../middleware/auth');

const router = express.Router();

// 確保上傳目錄存在
const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const filesDir = path.join(uploadsDir, 'files');

[uploadsDir, imagesDir, filesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer 配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'images') {
            cb(null, imagesDir);
        } else if (file.fieldname === 'file') {
            cb(null, filesDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'images') {
        // 圖片文件類型檢查
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for images field'), false);
        }
    } else if (file.fieldname === 'file') {
        // 文件類型檢查
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
            'application/pdf', // pdf
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PPTX, PDF, and DOCX files are allowed'), false);
        }
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 4 // 最多4個文件 (3張圖片 + 1個文件)
    }
});

// 獲取所有新聞 (公開)
router.get('/', async (req, res) => {
    try {
        const news = await News.find()
            .sort({ date: -1, createdAt: -1 })
            .select('-__v');
        
        res.json(news);
    } catch (error) {
        console.error('Get news error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 創建新聞 (需要認證)
router.post('/', auth, upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'file', maxCount: 1 }
]), async (req, res, next) => {
    try {
        const { title, description, date, link } = req.body;
        
        // 驗證必填字段
        if (!title || !description) {
            return res.status(400).json({
                message: 'Title and description are required'
            });
        }

        // 處理上傳的文件
        const images = req.files?.images?.map(file => 
            `/uploads/images/${file.filename}`) || [];
        const file = req.files?.file?.[0] ? 
            `/uploads/files/${req.files.file[0].filename}` : '';

        // 創建新聞
        const news = new News({
            title,
            description,
            date: date ? new Date(date) : new Date(),
            images,
            file,
            link: link || ''
        });

        await news.save();

        res.status(201).json({
            message: 'News created successfully',
            news
        });

    } catch (error) {
        console.error('Create news error:', error);
        
        // 如果是文件類型錯誤，刪除已上傳的文件
        if (error.message.includes('Only') && req.files) {
            Object.values(req.files).flat().forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }

        // 處理不同類型的錯誤
        let errorMessage = 'Internal server error';
        let statusCode = 500;

        if (error.code === 'LIMIT_FILE_SIZE') {
            errorMessage = '檔案大小超過限制，每個檔案最大 5MB';
            statusCode = 400;
        } else if (error.code === 'LIMIT_FILE_COUNT') {
            errorMessage = '檔案數量超過限制，最多可上傳 3 張圖片和 1 個附件';
            statusCode = 400;
        } else if (error.message.includes('Only')) {
            errorMessage = error.message;
            statusCode = 400;
        } else if (error.name === 'ValidationError') {
            errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
            statusCode = 400;
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(statusCode).json({
            message: errorMessage
        });
    }
});

// 更新新聞 (需要認證)
router.put('/:id', auth, upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'file', maxCount: 1 }
]), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, date, link } = req.body;
        
        // 查找新聞
        const news = await News.findById(id);
        if (!news) {
            return res.status(404).json({
                message: 'News not found'
            });
        }

        // 處理上傳的文件
        let images = news.images;
        let file = news.file;

        if (req.files?.images) {
            // 刪除舊圖片
            images.forEach(imgPath => {
                const fullPath = path.join(__dirname, '..', imgPath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
            images = req.files.images.map(file => `/uploads/images/${file.filename}`);
        }

        if (req.files?.file) {
            // 刪除舊文件
            if (file) {
                const fullPath = path.join(__dirname, '..', file);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
            file = `/uploads/files/${req.files.file[0].filename}`;
        }

        // 更新新聞
        const updatedNews = await News.findByIdAndUpdate(id, {
            title: title || news.title,
            description: description || news.description,
            date: date ? new Date(date) : news.date,
            images,
            file,
            link: link !== undefined ? link : news.link
        }, { new: true, runValidators: true });

        res.json({
            message: 'News updated successfully',
            news: updatedNews
        });

    } catch (error) {
        console.error('Update news error:', error);
        
        // 處理不同類型的錯誤
        let errorMessage = 'Internal server error';
        let statusCode = 500;

        if (error.code === 'LIMIT_FILE_SIZE') {
            errorMessage = '檔案大小超過限制，每個檔案最大 5MB';
            statusCode = 400;
        } else if (error.code === 'LIMIT_FILE_COUNT') {
            errorMessage = '檔案數量超過限制，最多可上傳 3 張圖片和 1 個附件';
            statusCode = 400;
        } else if (error.message.includes('Only')) {
            errorMessage = error.message;
            statusCode = 400;
        } else if (error.name === 'ValidationError') {
            errorMessage = Object.values(error.errors).map(e => e.message).join(', ');
            statusCode = 400;
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(statusCode).json({
            message: errorMessage
        });
    }
});

// 刪除新聞 (需要認證)
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 查找新聞
        const news = await News.findById(id);
        if (!news) {
            return res.status(404).json({
                message: 'News not found'
            });
        }

        // 刪除相關文件
        news.images.forEach(imgPath => {
            const fullPath = path.join(__dirname, '..', imgPath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });

        if (news.file) {
            const fullPath = path.join(__dirname, '..', news.file);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        // 刪除新聞
        await News.findByIdAndDelete(id);

        res.json({
            message: 'News deleted successfully'
        });

    } catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

// 獲取單個新聞 (公開)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findById(id).select('-__v');
        
        if (!news) {
            return res.status(404).json({
                message: 'News not found'
            });
        }

        res.json(news);
    } catch (error) {
        console.error('Get single news error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

module.exports = router;
