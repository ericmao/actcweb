const { google } = require('googleapis');
const News = require('../models/News');

class GoogleAnalyticsService {
    constructor() {
        this.analytics = null;
        this.propertyId = process.env.GA_PROPERTY_ID;
        this.isEnabled = process.env.GA_ENABLED === 'true';
        
        if (this.isEnabled) {
            this.initializeAnalytics();
        }
    }

    /**
     * 初始化 Google Analytics Data API
     */
    async initializeAnalytics() {
        try {
            // 使用服務帳號金鑰或 Application Default Credentials
            const auth = new google.auth.GoogleAuth({
                keyFile: process.env.GA_KEY_FILE, // 服務帳號 JSON 檔案路徑
                scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
            });

            this.analytics = google.analyticsdata({
                version: 'v1beta',
                auth: auth,
            });

            console.log('✅ Google Analytics Data API initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Google Analytics:', error.message);
            this.isEnabled = false;
        }
    }

    /**
     * 獲取特定新聞文章的頁面瀏覽量
     * @param {string} analyticsId - 新聞文章的 analytics ID
     * @param {number} days - 查詢天數（預設 30 天）
     * @returns {Promise<number>} 頁面瀏覽量
     */
    async getNewsViewCount(analyticsId, days = 30) {
        if (!this.isEnabled || !this.analytics) {
            return this.getMockViewCount(); // 返回模擬數據
        }

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const response = await this.analytics.properties.runReport({
                property: `properties/${this.propertyId}`,
                requestBody: {
                    dateRanges: [
                        {
                            startDate: startDate.toISOString().split('T')[0],
                            endDate: 'today'
                        }
                    ],
                    dimensions: [
                        {
                            name: 'customEvent:news_id'
                        }
                    ],
                    metrics: [
                        {
                            name: 'eventCount'
                        }
                    ],
                    dimensionFilter: {
                        filter: {
                            fieldName: 'customEvent:news_id',
                            stringFilter: {
                                matchType: 'EXACT',
                                value: analyticsId
                            }
                        }
                    }
                }
            });

            const rows = response.data.rows || [];
            if (rows.length > 0) {
                return parseInt(rows[0].metricValues[0].value) || 0;
            }
            
            return 0;
        } catch (error) {
            console.error(`Error fetching view count for ${analyticsId}:`, error.message);
            return 0;
        }
    }

    /**
     * 批量獲取所有新聞文章的瀏覽量
     * @param {number} days - 查詢天數
     * @returns {Promise<Array>} 包含 analyticsId 和 viewCount 的陣列
     */
    async getAllNewsViewCounts(days = 30) {
        if (!this.isEnabled || !this.analytics) {
            return this.getMockAllViewCounts(); // 返回模擬數據
        }

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const response = await this.analytics.properties.runReport({
                property: `properties/${this.propertyId}`,
                requestBody: {
                    dateRanges: [
                        {
                            startDate: startDate.toISOString().split('T')[0],
                            endDate: 'today'
                        }
                    ],
                    dimensions: [
                        {
                            name: 'customEvent:news_id'
                        }
                    ],
                    metrics: [
                        {
                            name: 'eventCount'
                        }
                    ],
                    orderBys: [
                        {
                            metric: {
                                metricName: 'eventCount'
                            },
                            desc: true
                        }
                    ]
                }
            });

            const rows = response.data.rows || [];
            return rows.map(row => ({
                analyticsId: row.dimensionValues[0].value,
                viewCount: parseInt(row.metricValues[0].value) || 0
            }));
        } catch (error) {
            console.error('Error fetching all news view counts:', error.message);
            return [];
        }
    }

    /**
     * 更新資料庫中的瀏覽量數據
     * @param {number} days - 查詢天數
     */
    async updateNewsViewCounts(days = 30) {
        console.log('🔄 Updating news view counts from Google Analytics...');
        
        try {
            const viewCounts = await this.getAllNewsViewCounts(days);
            let updatedCount = 0;

            for (const { analyticsId, viewCount } of viewCounts) {
                try {
                    const result = await News.updateOne(
                        { analyticsId: analyticsId },
                        { $set: { viewCount: viewCount } }
                    );
                    
                    if (result.modifiedCount > 0) {
                        updatedCount++;
                    }
                } catch (error) {
                    console.error(`Error updating view count for ${analyticsId}:`, error.message);
                }
            }

            console.log(`✅ Updated view counts for ${updatedCount} news articles`);
            return { success: true, updatedCount };
        } catch (error) {
            console.error('❌ Failed to update news view counts:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 獲取熱門新聞（根據瀏覽量排序）
     * @param {number} limit - 限制數量
     * @param {number} days - 時間範圍（天數）
     * @returns {Promise<Array>} 熱門新聞陣列
     */
    async getTrendingNews(limit = 10, days = 7) {
        try {
            // 如果啟用了 GA，先更新瀏覽量
            if (this.isEnabled) {
                await this.updateNewsViewCounts(days);
            }

            const trendingNews = await News.find({ status: 'published' })
                .sort({ viewCount: -1, publishDate: -1 })
                .limit(limit)
                .populate('author', 'username fullName')
                .select('title summary imageUrl videoUrl publishDate viewCount analyticsId');

            return trendingNews;
        } catch (error) {
            console.error('Error fetching trending news:', error.message);
            return [];
        }
    }

    /**
     * 生成 Google Analytics 追蹤事件的 JavaScript 代碼
     * @param {string} analyticsId - 新聞文章的 analytics ID
     * @param {string} title - 新聞標題
     * @returns {string} GA 追蹤代碼
     */
    generateTrackingCode(analyticsId, title) {
        return `
            // Google Analytics 新聞閱讀追蹤
            if (typeof gtag !== 'undefined') {
                gtag('event', 'news_view', {
                    'news_id': '${analyticsId}',
                    'news_title': '${title.replace(/'/g, "\\'")}',
                    'event_category': 'News',
                    'event_label': 'News View'
                });
            }
        `;
    }

    /**
     * 模擬數據 - 當 GA 未啟用時使用
     */
    getMockViewCount() {
        return Math.floor(Math.random() * 1000) + 50; // 50-1050 之間的隨機數
    }

    getMockAllViewCounts() {
        // 返回一些模擬數據
        return [
            { analyticsId: 'mock_1', viewCount: 856 },
            { analyticsId: 'mock_2', viewCount: 642 },
            { analyticsId: 'mock_3', viewCount: 423 },
            { analyticsId: 'mock_4', viewCount: 289 },
            { analyticsId: 'mock_5', viewCount: 156 }
        ];
    }

    /**
     * 檢查 Google Analytics 設定狀態
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            propertyId: this.propertyId,
            hasAnalytics: !!this.analytics,
            keyFile: !!process.env.GA_KEY_FILE
        };
    }
}

// 創建單例實例
const analyticsService = new GoogleAnalyticsService();

// 定期更新瀏覽量（每小時）
if (analyticsService.isEnabled) {
    setInterval(() => {
        analyticsService.updateNewsViewCounts(7); // 更新過去7天的數據
    }, 60 * 60 * 1000); // 每小時執行一次
}

module.exports = analyticsService;
