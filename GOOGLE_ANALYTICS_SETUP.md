# Google Analytics 設定指南

## 📊 當前設定

**Measurement ID**: `G-424DY83DBT`

系統已配置使用您提供的 Google Analytics 4 Measurement ID。

## ✅ 已完成的設定

### 1. 前端追蹤
- ✅ 新聞頁面已載入 GA 追蹤代碼
- ✅ 管理後台頁面已載入 GA 追蹤代碼
- ✅ 事件追蹤已配置（新聞閱讀、分享、收藏等）

### 2. 追蹤的事件
- 📰 **新聞閱讀**: 用戶點擊「閱讀更多」
- 🔗 **分享**: 用戶分享新聞
- ⭐ **收藏**: 用戶收藏/取消收藏新聞
- 🎥 **影片播放**: YouTube/Instagram 影片播放
- 🔍 **搜尋**: 用戶搜尋新聞
- 🏷️ **標籤篩選**: 用戶使用標籤篩選
- ⏱️ **頁面停留時間**: 用戶在頁面的停留時間

## 🔧 進階設定（可選）

如果您想啟用後端 Google Analytics Data API 功能來自動拉取瀏覽數據：

### 1. 取得服務帳號金鑰
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或建立專案
3. 啟用「Google Analytics Data API」
4. 建立服務帳號
5. 下載 JSON 金鑰檔案

### 2. 設定權限
1. 在 Google Analytics 中前往「管理」→「屬性存取權管理」
2. 添加服務帳號 email 為「檢視者」權限

### 3. 環境變數設定
如果您需要修改設定，請建立 `.env` 檔案：

```env
# Google Analytics 設定
GA_ENABLED=true
GA_PROPERTY_ID=424DY83DBT
GA_MEASUREMENT_ID=G-424DY83DBT
GA_KEY_FILE=path/to/your/service-account-key.json
```

## 📈 驗證追蹤是否正常

### 方法 1: Google Analytics 即時報表
1. 登入 [Google Analytics](https://analytics.google.com/)
2. 選擇您的屬性 (424DY83DBT)
3. 前往「報表」→「即時」
4. 訪問您的網站新聞頁面，應該會看到即時訪客

### 方法 2: 瀏覽器開發者工具
1. 開啟瀏覽器開發者工具 (F12)
2. 前往「Network」標籤
3. 篩選「XHR」或搜尋「google-analytics」
4. 瀏覽網站時應該會看到 GA 請求

### 方法 3: Chrome 擴充功能
安裝「Google Analytics Debugger」擴充功能，能顯示詳細的追蹤資訊。

## 🎯 測試追蹤功能

訪問以下頁面並進行操作：

1. **新聞列表頁**: http://localhost:5001/news
   - 搜尋新聞
   - 點擊標籤篩選
   - 點擊「閱讀更多」

2. **後台管理頁**: http://localhost:5001/admin/news
   - 瀏覽新聞列表
   - 創建/編輯新聞

每個操作都會發送對應的事件到 Google Analytics。

## 🔍 自定義事件

如果您需要追蹤其他事件，可以使用：

```javascript
// 追蹤自定義事件
window.analyticsTracker.trackCustomEvent('custom_event', {
    category: 'User Action',
    label: 'Custom Label',
    value: 1
});
```

## 📱 注意事項

1. **本地開發**: 在 localhost 環境下，系統會輸出除錯資訊到瀏覽器控制台
2. **廣告攔截器**: 部分用戶可能啟用廣告攔截器，會阻止 GA 追蹤
3. **隱私權**: 確保網站有適當的隱私權政策和用戶同意機制
4. **資料延遲**: GA 資料通常有 1-24 小時的延遲

## 🛠️ 故障排除

### 追蹤代碼未載入
- 檢查網路連線
- 確認 Measurement ID 正確
- 檢查是否被廣告攔截器阻擋

### 事件未顯示在 GA
- 檢查瀏覽器控制台是否有錯誤
- 確認事件參數格式正確
- 等待數據同步（最多 24 小時）

---

**設定完成時間**: $(date)
**Measurement ID**: G-424DY83DBT
**狀態**: ✅ 已啟用前端追蹤
