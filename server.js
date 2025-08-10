const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// 設置 JWT 密鑰
process.env.JWT_SECRET = process.env.JWT_SECRET || 'actc_super_secret_jwt_key_2025_secure_and_unique';

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const eventsRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 5001;

// 中間件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態文件服務
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventsRoutes);

// 首頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 管理後台路由
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 處理
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // 處理 Multer 錯誤
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            message: '檔案大小超過限制，每個檔案最大 5MB'
        });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            message: '檔案數量超過限制，最多可上傳 3 張圖片和 1 個附件'
        });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            message: '意外的檔案欄位'
        });
    }
    
    // 檔案類型錯誤
    if (err.message && err.message.includes('Only')) {
        return res.status(400).json({
            message: err.message
        });
    }
    
    // 一般錯誤
    res.status(500).json({ 
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// MongoDB 連接
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/actc_website', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // 創建預設管理員帳號
    const User = require('./models/User');
    try {
        let user = await User.findOne({ username: 'admin' });
        if (!user) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin', 10);
            user = await User.create({
                username: 'admin',
                password: hashedPassword
            });
            console.log('✅ Default admin account created (admin/admin)');
        } else {
            console.log('✅ Admin account already exists');
        }
        
        // 創建預設新聞資料
        const News = require('./models/News');
        const existingNews = await News.countDocuments();
        if (existingNews === 0) {
            const defaultNews = await News.create({
                title: '歡迎來到 ACTC 國際資訊安全人才培育與推廣協會',
                description: '我們致力於推動資訊安全領域的人才培育，提供專業的培訓課程、認證考試和國際交流機會。歡迎加入我們的社群，一起為資訊安全事業努力！',
                date: new Date(),
                images: [],
                file: '',
                link: 'https://actc.org.tw'
            });
            console.log('✅ Default news created');
        } else {
            console.log(`✅ Database has ${existingNews} existing news items`);
        }
        
        // 創建預設活動資料
        const Event = require('./models/Event');
        const existingEvents = await Event.countDocuments();
        if (existingEvents === 0) {
            const defaultEvents = [
                {
                    title: '資訊安全認證培訓課程',
                    type: 'course',
                    description: '為期8週的專業認證課程，涵蓋網路安全、密碼學、風險管理等核心領域。適合想要進入資訊安全領域的專業人士。',
                    date: new Date('2025-09-15T09:00:00'),
                    location: '105台北市松山區復興北路57號',
                    link: ''
                },
                {
                    title: '駭客馬拉松競賽',
                    type: 'meetup',
                    description: '24小時不間斷的資安競賽，挑戰參賽者的技術能力與創新思維。歡迎各領域專家組隊參加。',
                    date: new Date('2025-10-20T08:00:00'),
                    location: '新北市板橋區文化路一段188號',
                    link: 'https://discord.gg/actc-hackathon'
                },
                {
                    title: '資安實務工作坊',
                    type: 'workshop',
                    description: '實作導向的資安技能培訓，讓學員在真實環境中學習防護技術。包含滲透測試、惡意軟體分析等主題。',
                    date: new Date('2025-11-10T13:00:00'),
                    location: '高雄市前金區中正四路211號',
                    link: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_actc'
                }
            ];
            
            await Event.insertMany(defaultEvents);
            console.log('✅ Default events created');
        } else {
            console.log(`✅ Database has ${existingEvents} existing events`);
        }
        
    } catch (err) {
        console.log('❌ Error during initialization:', err.message);
    }
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

// 啟動服務器
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Admin panel: http://localhost:${PORT}/admin`);
});
