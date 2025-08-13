/**
 * Google Analytics 追蹤器
 * 提供統一的事件追蹤功能
 */
class AnalyticsTracker {
    constructor(measurementId = null) {
        this.measurementId = measurementId || window.GA_MEASUREMENT_ID || 'G-424DY83DBT';
        this.isEnabled = typeof gtag !== 'undefined';
        this.debugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (this.debugMode) {
            console.log('Analytics Tracker initialized:', {
                measurementId: this.measurementId,
                enabled: this.isEnabled
            });
        }
    }

    /**
     * 追蹤新聞閱讀事件
     * @param {string} newsId - 新聞ID
     * @param {string} analyticsId - Google Analytics 追蹤ID
     * @param {string} title - 新聞標題
     * @param {Object} additionalData - 額外數據
     */
    trackNewsView(newsId, analyticsId, title, additionalData = {}) {
        if (!this.isEnabled) {
            if (this.debugMode) {
                console.log('Analytics not enabled, simulating news view tracking:', {
                    newsId,
                    analyticsId,
                    title,
                    additionalData
                });
            }
            return;
        }

        try {
            gtag('event', 'news_view', {
                news_id: analyticsId || newsId,
                news_title: title,
                page_location: window.location.href,
                page_title: document.title,
                event_category: 'News',
                event_label: 'News View',
                custom_parameters: {
                    source: additionalData.source || 'web',
                    user_agent: navigator.userAgent,
                    viewport_width: window.innerWidth,
                    viewport_height: window.innerHeight,
                    ...additionalData
                }
            });

            if (this.debugMode) {
                console.log('News view tracked:', {
                    newsId,
                    analyticsId,
                    title
                });
            }
        } catch (error) {
            console.error('Error tracking news view:', error);
        }
    }

    /**
     * 追蹤新聞互動事件
     * @param {string} action - 動作類型 (like, share, bookmark, etc.)
     * @param {string} newsId - 新聞ID
     * @param {string} analyticsId - Google Analytics 追蹤ID
     * @param {Object} additionalData - 額外數據
     */
    trackNewsInteraction(action, newsId, analyticsId, additionalData = {}) {
        if (!this.isEnabled) {
            if (this.debugMode) {
                console.log('Analytics not enabled, simulating news interaction tracking:', {
                    action,
                    newsId,
                    analyticsId,
                    additionalData
                });
            }
            return;
        }

        try {
            gtag('event', 'news_interaction', {
                interaction_type: action,
                news_id: analyticsId || newsId,
                page_location: window.location.href,
                event_category: 'News',
                event_label: `News ${action}`,
                ...additionalData
            });

            if (this.debugMode) {
                console.log('News interaction tracked:', {
                    action,
                    newsId,
                    analyticsId
                });
            }
        } catch (error) {
            console.error('Error tracking news interaction:', error);
        }
    }

    /**
     * 追蹤影片播放事件
     * @param {string} videoType - 影片類型 (youtube, instagram)
     * @param {string} videoId - 影片ID
     * @param {string} newsId - 關聯的新聞ID
     * @param {Object} additionalData - 額外數據
     */
    trackVideoPlay(videoType, videoId, newsId, additionalData = {}) {
        if (!this.isEnabled) {
            if (this.debugMode) {
                console.log('Analytics not enabled, simulating video play tracking:', {
                    videoType,
                    videoId,
                    newsId,
                    additionalData
                });
            }
            return;
        }

        try {
            gtag('event', 'video_play', {
                video_type: videoType,
                video_id: videoId,
                news_id: newsId,
                page_location: window.location.href,
                event_category: 'Video',
                event_label: `${videoType} Video Play`,
                ...additionalData
            });

            if (this.debugMode) {
                console.log('Video play tracked:', {
                    videoType,
                    videoId,
                    newsId
                });
            }
        } catch (error) {
            console.error('Error tracking video play:', error);
        }
    }

    /**
     * 追蹤搜尋事件
     * @param {string} searchTerm - 搜尋關鍵字
     * @param {number} resultCount - 結果數量
     * @param {Object} additionalData - 額外數據
     */
    trackSearch(searchTerm, resultCount, additionalData = {}) {
        if (!this.isEnabled) {
            if (this.debugMode) {
                console.log('Analytics not enabled, simulating search tracking:', {
                    searchTerm,
                    resultCount,
                    additionalData
                });
            }
            return;
        }

        try {
            gtag('event', 'search', {
                search_term: searchTerm,
                result_count: resultCount,
                page_location: window.location.href,
                event_category: 'Search',
                event_label: 'News Search',
                ...additionalData
            });

            if (this.debugMode) {
                console.log('Search tracked:', {
                    searchTerm,
                    resultCount
                });
            }
        } catch (error) {
            console.error('Error tracking search:', error);
        }
    }

    /**
     * 追蹤標籤篩選事件
     * @param {string} tag - 標籤名稱
     * @param {number} resultCount - 結果數量
     * @param {Object} additionalData - 額外數據
     */
    trackTagFilter(tag, resultCount, additionalData = {}) {
        if (!this.isEnabled) {
            if (this.debugMode) {
                console.log('Analytics not enabled, simulating tag filter tracking:', {
                    tag,
                    resultCount,
                    additionalData
                });
            }
            return;
        }

        try {
            gtag('event', 'tag_filter', {
                tag_name: tag,
                result_count: resultCount,
                page_location: window.location.href,
                event_category: 'Filter',
                event_label: 'Tag Filter',
                ...additionalData
            });

            if (this.debugMode) {
                console.log('Tag filter tracked:', {
                    tag,
                    resultCount
                });
            }
        } catch (error) {
            console.error('Error tracking tag filter:', error);
        }
    }

    /**
     * 追蹤頁面停留時間
     * @param {string} pageType - 頁面類型 (news_list, news_detail, etc.)
     * @param {string} pageId - 頁面ID（如新聞ID）
     */
    trackPageTiming(pageType, pageId = null) {
        if (!this.isEnabled) return;

        // 記錄頁面進入時間
        const startTime = Date.now();
        
        // 當用戶離開頁面時追蹤停留時間
        const trackTimeOnPage = () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000); // 秒
            
            try {
                gtag('event', 'page_timing', {
                    page_type: pageType,
                    page_id: pageId || 'unknown',
                    time_spent: timeSpent,
                    page_location: window.location.href,
                    event_category: 'Engagement',
                    event_label: 'Time on Page'
                });

                if (this.debugMode) {
                    console.log('Page timing tracked:', {
                        pageType,
                        pageId,
                        timeSpent
                    });
                }
            } catch (error) {
                console.error('Error tracking page timing:', error);
            }
        };

        // 監聽頁面離開事件
        window.addEventListener('beforeunload', trackTimeOnPage);
        window.addEventListener('pagehide', trackTimeOnPage);
        
        // 對於單頁應用，也監聽路由變化
        if (typeof window.addEventListener === 'function') {
            window.addEventListener('popstate', trackTimeOnPage);
        }
    }

    /**
     * 追蹤自定義事件
     * @param {string} eventName - 事件名稱
     * @param {Object} parameters - 事件參數
     */
    trackCustomEvent(eventName, parameters = {}) {
        if (!this.isEnabled) {
            if (this.debugMode) {
                console.log('Analytics not enabled, simulating custom event tracking:', {
                    eventName,
                    parameters
                });
            }
            return;
        }

        try {
            gtag('event', eventName, {
                page_location: window.location.href,
                page_title: document.title,
                timestamp: Date.now(),
                ...parameters
            });

            if (this.debugMode) {
                console.log('Custom event tracked:', {
                    eventName,
                    parameters
                });
            }
        } catch (error) {
            console.error('Error tracking custom event:', error);
        }
    }

    /**
     * 設置用戶屬性
     * @param {Object} properties - 用戶屬性
     */
    setUserProperties(properties = {}) {
        if (!this.isEnabled) return;

        try {
            gtag('config', this.measurementId, {
                custom_map: {
                    user_type: 'user_type',
                    user_role: 'user_role'
                },
                user_properties: properties
            });

            if (this.debugMode) {
                console.log('User properties set:', properties);
            }
        } catch (error) {
            console.error('Error setting user properties:', error);
        }
    }

    /**
     * 獲取客戶端ID
     * @returns {Promise<string>} 客戶端ID
     */
    async getClientId() {
        if (!this.isEnabled) {
            return 'client_id_not_available';
        }

        return new Promise((resolve) => {
            gtag('get', this.measurementId, 'client_id', (clientId) => {
                resolve(clientId || 'unknown');
            });
        });
    }

    /**
     * 初始化頁面追蹤
     * @param {string} pageType - 頁面類型
     * @param {string} pageId - 頁面ID
     * @param {Object} additionalData - 額外數據
     */
    initPageTracking(pageType, pageId = null, additionalData = {}) {
        // 追蹤頁面瀏覽
        if (this.isEnabled) {
            gtag('config', this.measurementId, {
                page_title: document.title,
                page_location: window.location.href,
                custom_parameters: {
                    page_type: pageType,
                    page_id: pageId,
                    ...additionalData
                }
            });
        }

        // 開始追蹤停留時間
        this.trackPageTiming(pageType, pageId);

        if (this.debugMode) {
            console.log('Page tracking initialized:', {
                pageType,
                pageId,
                additionalData
            });
        }
    }
}

// 創建全域實例
if (typeof window !== 'undefined') {
    window.analyticsTracker = new AnalyticsTracker();
}

// 模組導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsTracker;
}
