const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CorporateMember = require('../models/CorporateMember');
const { adminAuth, auth } = require('../middleware/adminAuth');

const router = express.Router();

// 設定 Multer 用於檔案上傳
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/images');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB檔案限制
        fieldSize: 10 * 1024 * 1024, // 10MB欄位限制 (解決 field value too long)
        fields: 50, // 允許50個欄位
        fieldNameSize: 1024 // 欄位名稱長度限制
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允許上傳圖片檔案 (JPEG, PNG, GIF, WebP, SVG)'));
        }
    }
});

// ==================== 公開路由 ====================

// 取得顯示中的企業會員（前端使用）
router.get('/displayed', async (req, res) => {
    try {
        const {
            membershipType,
            industry,
            limit = 20,
            skip = 0,
            sortBy = 'displayOrder'
        } = req.query;

        const members = await CorporateMember.getDisplayedMembers({
            membershipType,
            industry,
            limit: parseInt(limit),
            skip: parseInt(skip),
            sortBy
        });

        const total = await CorporateMember.countDocuments({
            isActive: true,
            isDisplayed: true,
            ...(membershipType && { membershipType }),
            ...(industry && { industry: new RegExp(industry, 'i') })
        });

        res.json({
            success: true,
            members,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > parseInt(skip) + members.length
            }
        });
    } catch (error) {
        console.error('取得企業會員失敗:', error);
        res.status(500).json({
            success: false,
            message: '取得企業會員失敗',
            error: error.message
        });
    }
});

// 取得會員統計（前端使用）
router.get('/stats', async (req, res) => {
    try {
        const stats = await CorporateMember.getMembershipStats();
        
        const total = await CorporateMember.countDocuments({});
        const displayed = await CorporateMember.countDocuments({ isDisplayed: true });
        const active = await CorporateMember.countDocuments({ isActive: true });

        res.json({
            success: true,
            stats: {
                total,
                displayed,
                active,
                membershipTypes: stats
            }
        });
    } catch (error) {
        console.error('取得統計失敗:', error);
        res.status(500).json({
            success: false,
            message: '取得統計失敗',
            error: error.message
        });
    }
});

// ==================== 管理員路由 ====================

// 取得所有企業會員（管理員）
router.get('/admin', adminAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            membershipType,
            isActive,
            isDisplayed,
            industry
        } = req.query;

        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // 建立查詢條件
        const query = {};
        
        if (search) {
            query.$or = [
                { companyName: new RegExp(search, 'i') },
                { companyNameEn: new RegExp(search, 'i') },
                { contactPerson: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }
        
        if (membershipType) query.membershipType = membershipType;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (isDisplayed !== undefined) query.isDisplayed = isDisplayed === 'true';
        if (industry) query.industry = new RegExp(industry, 'i');

        const members = await CorporateMember.find(query)
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);

        const total = await CorporateMember.countDocuments(query);

        // 統計資訊
        const stats = await CorporateMember.getMembershipStats();

        res.json({
            success: true,
            members,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            stats
        });
    } catch (error) {
        console.error('取得企業會員失敗:', error);
        res.status(500).json({
            success: false,
            message: '取得企業會員失敗',
            error: error.message
        });
    }
});

// 創建企業會員
router.post('/admin', adminAuth, upload.single('logo'), async (req, res) => {
    try {
        const memberData = { ...req.body };
        
        // 處理上傳的logo
        if (req.file) {
            memberData.logo = `/uploads/images/${req.file.filename}`;
        }

        // 處理陣列欄位
        if (memberData.services && typeof memberData.services === 'string') {
            memberData.services = memberData.services.split(',').map(s => s.trim()).filter(s => s);
        }
        if (memberData.specialization && typeof memberData.specialization === 'string') {
            memberData.specialization = memberData.specialization.split(',').map(s => s.trim()).filter(s => s);
        }
        if (memberData.tags && typeof memberData.tags === 'string') {
            memberData.tags = memberData.tags.split(',').map(s => s.trim()).filter(s => s);
        }

        // 處理布林值
        memberData.isActive = memberData.isActive === 'true' || memberData.isActive === true;
        memberData.isDisplayed = memberData.isDisplayed === 'true' || memberData.isDisplayed === true;

        // 處理日期
        if (memberData.expiryDate) {
            memberData.expiryDate = new Date(memberData.expiryDate);
        }

        // 設定創建者
        memberData.createdBy = req.user.userId;

        const member = new CorporateMember(memberData);
        await member.save();

        await member.populate('createdBy', 'username fullName');

        res.status(201).json({
            success: true,
            message: '企業會員創建成功',
            member
        });
    } catch (error) {
        console.error('創建企業會員失敗:', error);
        
        // 如果有上傳檔案但創建失敗，刪除檔案
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('刪除上傳檔案失敗:', unlinkError);
            }
        }

        res.status(400).json({
            success: false,
            message: '創建企業會員失敗',
            error: error.message
        });
    }
});

// 取得單一企業會員
router.get('/admin/:id', adminAuth, async (req, res) => {
    try {
        const member = await CorporateMember.findById(req.params.id)
            .populate('createdBy', 'username fullName')
            .populate('updatedBy', 'username fullName');

        if (!member) {
            return res.status(404).json({
                success: false,
                message: '企業會員不存在'
            });
        }

        res.json({
            success: true,
            member
        });
    } catch (error) {
        console.error('取得企業會員失敗:', error);
        res.status(500).json({
            success: false,
            message: '取得企業會員失敗',
            error: error.message
        });
    }
});

// 更新企業會員
router.put('/admin/:id', adminAuth, upload.single('logo'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // 🔧 過濾允許更新的欄位 - 排除系統欄位和虛擬欄位
        const allowedFields = [
            'companyName', 'companyNameEn', 'description', 'contactPerson', 'contactTitle',
            'email', 'phone', 'website', 'country', 'membershipType', 'membershipLevel',
            'industry', 'services', 'specialization', 'isActive', 'isDisplayed', 
            'displayOrder', 'tags', 'expiryDate', 'logo'
        ];
        
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });
        
        // 🔧 處理布林值轉換 (FormData 會將布林值轉為字串)
        if (updateData.isActive !== undefined) {
            updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
        }
        if (updateData.isDisplayed !== undefined) {
            updateData.isDisplayed = updateData.isDisplayed === 'true' || updateData.isDisplayed === true;
        }
        
        // 🔧 處理數字轉換
        if (updateData.displayOrder !== undefined) {
            updateData.displayOrder = parseInt(updateData.displayOrder) || 0;
        }
        
        // 🔧 處理陣列轉換 (如果是空字串則轉為空陣列)
        if (updateData.services !== undefined) {
            updateData.services = updateData.services ? updateData.services.split(',').map(s => s.trim()).filter(s => s) : [];
        }
        if (updateData.specialization !== undefined) {
            updateData.specialization = updateData.specialization ? updateData.specialization.split(',').map(s => s.trim()).filter(s => s) : [];
        }
        if (updateData.tags !== undefined) {
            updateData.tags = updateData.tags ? updateData.tags.split(',').map(s => s.trim()).filter(s => s) : [];
        }
        
        


        const member = await CorporateMember.findById(id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: '企業會員不存在'
            });
        }

        let logoUrl = member.logo;

        // 處理logo上傳
        if (req.file) {
            // 刪除舊logo檔案
            if (member.logo && member.logo.startsWith('/uploads/')) {
                const oldLogoPath = path.join(__dirname, '..', member.logo);
                try {
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlinkSync(oldLogoPath);
                    }
                } catch (deleteError) {
                    console.error('刪除舊logo失敗:', deleteError);
                }
            }
            logoUrl = `/uploads/images/${req.file.filename}`;
        }

        // 處理logo URL從表單
        if (updateData.logo !== undefined && updateData.logo !== logoUrl) {
            logoUrl = updateData.logo;
        }

        // 處理移除logo
        if (updateData.removeLogo === 'true' || updateData.removeLogo === true) {
            if (member.logo && member.logo.startsWith('/uploads/')) {
                const oldLogoPath = path.join(__dirname, '..', member.logo);
                try {
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlinkSync(oldLogoPath);
                    }
                } catch (deleteError) {
                    console.error('刪除logo檔案失敗:', deleteError);
                }
            }
            logoUrl = '';
        }

        // 🗑️ 移除重複的處理邏輯（已在上面處理過）

        // 處理日期
        if (updateData.expiryDate) {
            updateData.expiryDate = new Date(updateData.expiryDate);
        }

        // 設定更新資訊
        updateData.updatedBy = req.user.userId;
        updateData.logo = logoUrl;

        const updatedMember = await CorporateMember.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'username fullName')
         .populate('updatedBy', 'username fullName');

        res.json({
            success: true,
            message: '企業會員更新成功',
            member: updatedMember
        });
    } catch (error) {
        console.error('更新企業會員失敗:', error);

        // 如果有上傳檔案但更新失敗，刪除檔案
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('刪除上傳檔案失敗:', unlinkError);
            }
        }

        res.status(400).json({
            success: false,
            message: '更新企業會員失敗',
            error: error.message
        });
    }
});

// 切換顯示狀態
router.patch('/admin/:id/toggle-display', adminAuth, async (req, res) => {
    try {
        const member = await CorporateMember.findById(req.params.id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: '企業會員不存在'
            });
        }

        await member.toggleDisplay();
        member.updatedBy = req.user.userId;
        await member.save();

        res.json({
            success: true,
            message: `企業會員${member.isDisplayed ? '已設為顯示' : '已設為隱藏'}`,
            member
        });
    } catch (error) {
        console.error('切換顯示狀態失敗:', error);
        res.status(500).json({
            success: false,
            message: '切換顯示狀態失敗',
            error: error.message
        });
    }
});

// 切換啟用狀態
router.patch('/admin/:id/toggle-active', adminAuth, async (req, res) => {
    try {
        const member = await CorporateMember.findById(req.params.id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: '企業會員不存在'
            });
        }

        member.isActive = !member.isActive;
        member.updatedBy = req.user.userId;
        await member.save();

        res.json({
            success: true,
            message: `企業會員${member.isActive ? '已啟用' : '已停用'}`,
            member
        });
    } catch (error) {
        console.error('切換啟用狀態失敗:', error);
        res.status(500).json({
            success: false,
            message: '切換啟用狀態失敗',
            error: error.message
        });
    }
});

// 更新顯示順序
router.patch('/admin/:id/display-order', adminAuth, async (req, res) => {
    try {
        const { displayOrder } = req.body;
        
        if (typeof displayOrder !== 'number') {
            return res.status(400).json({
                success: false,
                message: '顯示順序必須是數字'
            });
        }

        const member = await CorporateMember.findById(req.params.id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: '企業會員不存在'
            });
        }

        await member.updateDisplayOrder(displayOrder);
        member.updatedBy = req.user.userId;
        await member.save();

        res.json({
            success: true,
            message: '顯示順序更新成功',
            member
        });
    } catch (error) {
        console.error('更新顯示順序失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新顯示順序失敗',
            error: error.message
        });
    }
});

// 批量操作
router.patch('/admin/batch', adminAuth, async (req, res) => {
    try {
        const { ids, action, value } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請提供有效的ID陣列'
            });
        }

        let updateData = { updatedBy: req.user.userId };

        switch (action) {
            case 'toggleDisplay':
                updateData.isDisplayed = value;
                break;
            case 'toggleActive':
                updateData.isActive = value;
                break;
            case 'updateMembershipType':
                updateData.membershipType = value;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: '無效的操作類型'
                });
        }

        const result = await CorporateMember.updateMany(
            { _id: { $in: ids } },
            updateData
        );

        res.json({
            success: true,
            message: `批量操作完成，影響 ${result.modifiedCount} 筆記錄`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('批量操作失敗:', error);
        res.status(500).json({
            success: false,
            message: '批量操作失敗',
            error: error.message
        });
    }
});

// 刪除企業會員
router.delete('/admin/:id', adminAuth, async (req, res) => {
    try {
        const member = await CorporateMember.findById(req.params.id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: '企業會員不存在'
            });
        }

        // 刪除logo檔案
        if (member.logo && member.logo.startsWith('/uploads/')) {
            const logoPath = path.join(__dirname, '..', member.logo);
            try {
                if (fs.existsSync(logoPath)) {
                    fs.unlinkSync(logoPath);
                }
            } catch (deleteError) {
                console.error('刪除logo檔案失敗:', deleteError);
            }
        }

        await CorporateMember.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: '企業會員刪除成功'
        });
    } catch (error) {
        console.error('刪除企業會員失敗:', error);
        res.status(500).json({
            success: false,
            message: '刪除企業會員失敗',
            error: error.message
        });
    }
});

module.exports = router;