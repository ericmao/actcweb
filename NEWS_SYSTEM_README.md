# ACTC 新聞管理系統

## 📖 系統概述

這是一個完整的新聞管理系統，包含後台管理、前端呈現和 Google Analytics 整合。系統支援文章創建、編輯、發布，以及圖片、影片嵌入和瀏覽次數追蹤。

## ✨ 主要功能

### 🔧 後台管理功能
- **CRUD 操作**：創建、讀取、更新、刪除新聞
- **媒體支援**：圖片上傳、YouTube/Instagram 影片嵌入
- **狀態管理**：草稿/已發布狀態控制
- **批量操作**：批量發布、設為草稿、刪除
- **搜尋篩選**：標題/內容搜尋、狀態篩選、排序
- **統計資訊**：瀏覽次數、發布統計
- **Google Analytics 整合**：瀏覽數據同步

### 🌐 前端展示功能
- **響應式設計**：適配手機、平板、桌面
- **新聞卡片**：精美的卡片設計，支援動畫效果
- **影片播放**：YouTube 嵌入播放、Instagram 連結
- **互動功能**：分享、收藏、標籤篩選
- **搜尋功能**：即時搜尋、結果高亮
- **分頁載入**：無限滾動或分頁顯示
- **精選/熱門**：精選新聞、熱門文章展示

### 📊 Google Analytics 功能
- **事件追蹤**：新聞閱讀、分享、收藏、影片播放
- **自動同步**：定期從 GA 拉取瀏覽數據
- **詳細統計**：頁面停留時間、用戶行為分析
- **客製化事件**：搜尋、篩選、互動追蹤

## 🏗️ 系統架構

### 後端架構
```
backend/
├── server.js                 # 主伺服器檔案
├── models/
│   ├── News.js              # 新聞數據模型
│   └── User.js              # 使用者模型
├── routes/
│   ├── news.js              # 新聞 API 路由
│   ├── auth.js              # 認證路由
│   └── users.js             # 使用者管理路由
├── middleware/
│   └── adminAuth.js         # 管理員認證中間件
├── services/
│   └── googleAnalytics.js   # Google Analytics 服務
└── uploads/                 # 檔案上傳目錄
    ├── images/              # 圖片檔案
    └── files/               # 附件檔案
```

### 前端架構
```
frontend/
├── public/
│   ├── components/
│   │   ├── NewsCard.js           # 新聞卡片組件
│   │   ├── NewsManagement.js     # 新聞管理組件
│   │   └── AnalyticsTracker.js   # 分析追蹤組件
│   ├── pages/
│   │   ├── news.html             # 公開新聞頁面
│   │   └── admin-news.html       # 管理後台頁面
│   └── assets/                   # 靜態資源
└── styles/                       # 樣式檔案
```

## 🛠️ 技術規格

### 後端技術
- **Node.js + Express**：RESTful API 伺服器
- **MongoDB + Mongoose**：資料庫和 ODM
- **Multer**：檔案上傳處理
- **JWT**：身份認證
- **Google Analytics Data API**：數據拉取

### 前端技術
- **HTML5 + CSS3**：基礎結構和樣式
- **Tailwind CSS**：UI 框架
- **Alpine.js**：輕量級 JavaScript 框架
- **AOS**：動畫庫
- **Google Analytics (gtag.js)**：事件追蹤

### 資料庫結構
```javascript
// News Schema
{
  title: String,           // 標題 (必填)
  content: String,         // 內容 (必填)
  description: String,     // 摘要
  imageUrl: String,        // 主要圖片 URL
  videoUrl: String,        // 影片連結 (YouTube/Instagram)
  videoType: String,       // 影片類型 (youtube/instagram)
  publishDate: Date,       // 發布時間
  status: String,          // 狀態 (draft/published)
  viewCount: Number,       // 瀏覽次數
  analyticsId: String,     // Google Analytics 追蹤 ID
  author: ObjectId,        // 作者 (User 參考)
  tags: [String],         // 標籤陣列
  featured: Boolean,       // 是否精選
  // 向後兼容欄位
  date: Date,
  images: [String],
  file: String,
  link: String
}
```

## 🚀 安裝和部署

### 1. 環境準備
```bash
# 克隆專案
git clone <repository-url>
cd actc_web

# 安裝依賴
npm install

# 複製環境變數範例
cp env.example .env
```

### 2. 環境變數設定
編輯 `.env` 檔案：
```env
# 資料庫設定
MONGO_URI=mongodb://localhost:27017/actc_website

# JWT 設定
JWT_SECRET=your_super_secret_jwt_key

# 伺服器設定
PORT=5001
NODE_ENV=development

# Google Analytics 設定
GA_ENABLED=true
GA_PROPERTY_ID=your_ga_property_id
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_KEY_FILE=path/to/service-account-key.json
```

### 3. Google Analytics 設定

#### 3.1 建立 Google Analytics 4 屬性
1. 登入 [Google Analytics](https://analytics.google.com/)
2. 建立新的 GA4 屬性
3. 記錄 Property ID 和 Measurement ID

#### 3.2 啟用 Google Analytics Data API
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立或選擇專案
3. 啟用 "Google Analytics Data API"
4. 建立服務帳號並下載 JSON 金鑰檔案

#### 3.3 授權服務帳號
1. 在 Google Analytics 中，前往「管理」→「屬性存取權管理」
2. 新增服務帳號 email 為「檢視者」權限

### 4. 資料庫設定
```bash
# 啟動 MongoDB (本地)
mongod

# 或使用 MongoDB Atlas (雲端)
# 將連線字串設定在 MONGO_URI
```

### 5. 啟動應用程式
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

### 6. 建立管理員帳號
首次啟動時會自動創建預設管理員：
- 帳號：`admin`
- 密碼：`admin`

## 📝 API 文檔

### 公開 API

#### 獲取已發布新聞
```
GET /api/news/published
Query Parameters:
- page: 頁碼 (預設: 1)
- limit: 每頁數量 (預設: 10)
- featured: 是否只顯示精選 (true/false)
- tag: 標籤篩選
- search: 搜尋關鍵字
```

#### 獲取單篇新聞
```
GET /api/news/published/:id
Response: 新聞詳情 + Google Analytics 追蹤代碼
```

#### 獲取熱門新聞
```
GET /api/news/trending
Query Parameters:
- limit: 數量限制 (預設: 5)
- days: 統計天數 (預設: 7)
```

#### 獲取精選新聞
```
GET /api/news/featured
Query Parameters:
- limit: 數量限制 (預設: 5)
```

#### 獲取標籤列表
```
GET /api/news/tags
Response: 標籤列表 + 使用次數
```

### 管理 API (需要管理員權限)

#### 獲取所有新聞
```
GET /api/news/admin
Headers: Authorization: Bearer <token>
Query Parameters:
- page, limit, status, search, sortBy, order
```

#### 創建新聞
```
POST /api/news/admin
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: title, content, description, status, tags, featured, image, file, videoUrl
```

#### 更新新聞
```
PUT /api/news/admin/:id
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### 刪除新聞
```
DELETE /api/news/admin/:id
Headers: Authorization: Bearer <token>
```

#### 批量操作
```
POST /api/news/admin/batch
Headers: Authorization: Bearer <token>
Body: { action: "delete|updateStatus|toggleFeatured", ids: [...], data: {...} }
```

#### 更新 Analytics 數據
```
POST /api/news/admin/update-analytics
Headers: Authorization: Bearer <token>
Body: { days: 7 }
```

## 🎨 前端使用說明

### 新聞卡片組件
```javascript
// 創建新聞卡片
const newsCard = new NewsCard(newsData, {
    showFullContent: false,
    enableTracking: true,
    showActions: false
});

// 渲染卡片
const html = newsCard.render();
container.innerHTML = html;
```

### Analytics 追蹤
```javascript
// 手動追蹤新聞閱讀
window.analyticsTracker.trackNewsView(newsId, analyticsId, title);

// 追蹤互動事件
window.analyticsTracker.trackNewsInteraction('share', newsId, analyticsId);

// 追蹤影片播放
window.analyticsTracker.trackVideoPlay('youtube', videoId, newsId);
```

## 🔧 自定義和擴展

### 1. 新增自定義欄位
在 `models/News.js` 中添加新欄位：
```javascript
const newsSchema = new mongoose.Schema({
    // 現有欄位...
    customField: {
        type: String,
        default: ''
    }
});
```

### 2. 新增自定義事件追蹤
在 `AnalyticsTracker.js` 中添加方法：
```javascript
trackCustomEvent(eventName, parameters) {
    // 實現自定義追蹤邏輯
}
```

### 3. 客製化新聞卡片
修改 `NewsCard.js` 中的 `render()` 方法以調整外觀。

### 4. 新增 API 端點
在 `routes/news.js` 中添加新路由。

## 🧪 測試

### 手動測試
1. **新聞 CRUD**：測試創建、編輯、發布、刪除
2. **檔案上傳**：測試圖片和附件上傳
3. **影片嵌入**：測試 YouTube 和 Instagram 連結
4. **搜尋篩選**：測試搜尋和標籤篩選功能
5. **Analytics**：檢查事件是否正確發送到 GA

### API 測試範例
```bash
# 測試獲取新聞
curl "http://localhost:5001/api/news/published?limit=5"

# 測試創建新聞 (需要 token)
curl -X POST "http://localhost:5001/api/news/admin" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=測試新聞" \
  -F "content=這是測試內容"
```

## 🚨 故障排除

### 常見問題

#### 1. MongoDB 連線失敗
```
解決方案：
- 檢查 MongoDB 服務是否運行
- 驗證 MONGO_URI 設定
- 檢查網路連線和防火牆設定
```

#### 2. Google Analytics 數據無法拉取
```
解決方案：
- 驗證服務帳號 JSON 檔案路徑
- 確認服務帳號有 GA 屬性存取權限
- 檢查 GA_PROPERTY_ID 是否正確
```

#### 3. 檔案上傳失敗
```
解決方案：
- 檢查 uploads 目錄權限
- 驗證檔案大小和類型限制
- 確認磁碟空間充足
```

#### 4. 前端 Analytics 追蹤無效
```
解決方案：
- 檢查 GA_MEASUREMENT_ID 設定
- 確認 gtag.js 載入成功
- 在瀏覽器開發者工具中檢查網路請求
```

## 📈 效能優化

### 後端優化
1. **資料庫索引**：已在常用查詢欄位建立索引
2. **圖片壓縮**：考慮添加圖片壓縮中間件
3. **快取機制**：可添加 Redis 快取熱門文章
4. **分頁優化**：使用 cursor-based 分頁處理大量數據

### 前端優化
1. **圖片懶載入**：已實現 `loading="lazy"`
2. **動畫優化**：使用 CSS transform 和 opacity
3. **打包優化**：考慮使用 webpack 或 vite 打包
4. **CDN 部署**：靜態資源可部署到 CDN

## 🔒 安全性考量

### 1. 輸入驗證
- 所有用戶輸入都經過驗證和清理
- 檔案上傳限制類型和大小
- URL 驗證防止 XSS 攻擊

### 2. 身份認證
- JWT token 有效期限制
- 管理員權限分離
- 密碼加密存儲

### 3. 檔案安全
- 上傳檔案類型白名單
- 檔案路徑驗證
- 防止目錄遍歷攻擊

## 📚 部署建議

### 生產環境部署
1. **伺服器**：推薦使用 PM2 管理 Node.js 進程
2. **資料庫**：使用 MongoDB Atlas 或自建 MongoDB 叢集
3. **檔案存儲**：考慮使用 AWS S3 或 Google Cloud Storage
4. **反向代理**：使用 Nginx 處理靜態檔案和負載平衡
5. **HTTPS**：配置 SSL 證書
6. **監控**：設定日誌監控和錯誤追蹤

### Docker 部署
```dockerfile
# Dockerfile 範例
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 📞 支援和維護

### 日誌監控
- 應用程式日誌：檢查伺服器日誌檔案
- Analytics 日誌：監控 GA 數據拉取狀態
- 錯誤追蹤：建議整合 Sentry 或類似服務

### 定期維護
- **資料庫清理**：定期清理舊日誌和無用數據
- **檔案整理**：清理未使用的上傳檔案
- **Analytics 同步**：確保數據同步正常運行
- **安全更新**：定期更新依賴套件

## 📄 授權
MIT License

## 👥 貢獻
歡迎提交 Issue 和 Pull Request

---

**最後更新**：2025年1月
**版本**：1.0.0
**作者**：ACTC 開發團隊
