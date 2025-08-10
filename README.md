# ACTC 國際資訊安全人才培育與推廣協會 - 動態網站

## 功能特色

### 🎯 最新消息管理
- **多圖片上傳**: 支援最多3張圖片 (JPG/PNG, 每張最大5MB)
- **檔案附件**: 支援 PPTX、PDF、DOCX 格式
- **活動連結**: 可添加外部連結
- **分類管理**: 聯盟動態、活動預告、技術分享、一般

### 🎨 前台展示
- **響應式設計**: 手機1列，桌面2列網格佈局
- **圖片輪播**: 使用 Swiper.js 實現流暢的圖片滑動
- **現代化 UI**: 使用 Tailwind CSS 設計，重點色為橙色

### 🔐 後台管理
- **JWT 認證**: 安全的登入系統
- **即時更新**: 新增/編輯/刪除後立即更新前台顯示
- **檔案管理**: 完整的檔案上傳和管理功能

## 技術棧

- **後端**: Node.js + Express
- **資料庫**: MongoDB + Mongoose
- **檔案上傳**: Multer
- **前端**: HTML5 + Tailwind CSS + Swiper.js
- **認證**: JWT (JSON Web Token)

## 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動 MongoDB
```bash
# macOS (使用 Homebrew)
brew services start mongodb/brew/mongodb-community

# 或手動啟動
mongod
```

### 3. 啟動服務器
```bash
npm start
```

### 4. 訪問網站
- **前台**: http://localhost:5001
- **後台**: http://localhost:5001/admin
- **預設帳號**: admin / admin

## 系統架構

### 資料庫模型
- **User**: 管理員帳號
- **News**: 最新消息 (包含標題、描述、日期、圖片陣列、檔案、連結)

### API 端點
- `POST /api/auth/login` - 管理員登入
- `GET /api/news` - 獲取新聞列表
- `POST /api/news` - 新增新聞
- `PUT /api/news/:id` - 更新新聞
- `DELETE /api/news/:id` - 刪除新聞

### 檔案結構
```
actc_web/
├── models/          # 資料庫模型
├── routes/          # API 路由
├── middleware/      # 中間件
├── public/          # 靜態檔案
├── uploads/         # 上傳檔案
├── server.js        # 主服務器
└── package.json     # 依賴配置
```

## 使用說明

### 新增消息
1. 登入後台管理系統
2. 點擊「新增消息」按鈕
3. 填寫標題、描述、日期等資訊
4. 上傳圖片 (最多3張)
5. 上傳附件檔案 (可選)
6. 填寫活動連結 (可選)
7. 點擊「儲存」

### 編輯消息
1. 在消息列表中點擊「編輯」
2. 修改相關資訊
3. 重新上傳圖片和附件 (編輯時需要重新上傳)
4. 點擊「儲存」

### 刪除消息
1. 在消息列表中點擊「刪除」
2. 確認刪除操作

## 開發說明

### 環境變數
創建 `.env` 文件：
```env
MONGO_URI=mongodb://localhost:27017/actc_website
JWT_SECRET=your_jwt_secret_key
PORT=5001
```

### 自定義樣式
- 主要顏色定義在 `tailwind.config.js`
- 重點色為 `actc-orange` (#f97316)

### 圖片上傳配置
- 支援格式: JPG, PNG
- 最大大小: 5MB
- 最大數量: 3張
- 儲存路徑: `/uploads/images/`

### 檔案上傳配置
- 支援格式: PPTX, PDF, DOCX
- 儲存路徑: `/uploads/files/`

## 部署說明

### 生產環境
1. 設置環境變數
2. 配置 MongoDB 連接
3. 設置 JWT 密鑰
4. 配置反向代理 (如 Nginx)
5. 設置 SSL 證書

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 維護說明

### 資料庫備份
```bash
mongodump --db actc_website --out backup/
```

### 日誌查看
```bash
# 查看服務器日誌
tail -f logs/server.log

# 查看錯誤日誌
tail -f logs/error.log
```

### 性能優化
- 圖片壓縮和縮圖生成
- 資料庫索引優化
- 快取策略實施

## 聯絡資訊

如有問題或建議，請聯絡 ACTC 技術團隊。

---

© 2025 ACTC 國際資訊安全人才培育與推廣協會
