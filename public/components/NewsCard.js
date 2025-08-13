/**
 * 新聞卡片組件
 * 展示單個新聞項目的卡片，支援圖片、影片和互動效果
 */
class NewsCard {
    constructor(news, options = {}) {
        this.news = news;
        this.options = {
            showFullContent: false,
            enableTracking: true,
            showActions: false,
            ...options
        };
    }

    /**
     * 生成新聞卡片的 HTML
     */
    render() {
        const { news, options } = this;
        const publishDate = new Date(news.publishDate || news.date);
        const formattedDate = publishDate.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        return `
            <article class="news-card bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group" 
                     data-news-id="${news._id}" 
                     data-analytics-id="${news.analyticsId || ''}"
                     data-aos="fade-up">
                
                <!-- 媒體內容區域 -->
                ${this.renderMediaContent()}
                
                <!-- 內容區域 -->
                <div class="p-6">
                    <!-- 標籤和日期 -->
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex flex-wrap gap-2">
                            ${this.renderTags()}
                            ${news.featured ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>精選</span>' : ''}
                        </div>
                        <time class="text-sm text-gray-500" datetime="${publishDate.toISOString()}">
                            ${formattedDate}
                        </time>
                    </div>
                    
                    <!-- 標題 -->
                    <h3 class="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        ${this.escapeHtml(news.title)}
                    </h3>
                    
                    <!-- 摘要 -->
                    <p class="text-gray-600 mb-4 line-clamp-3">
                        ${this.escapeHtml(news.summary || news.description || this.truncateText(news.content, 150))}
                    </p>
                    
                    <!-- 作者和瀏覽次數 -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center text-sm text-gray-500">
                            ${news.author ? `
                                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                                </svg>
                                <span>${this.escapeHtml(news.author.fullName || news.author.username)}</span>
                            ` : ''}
                        </div>
                        <div class="flex items-center text-sm text-gray-500">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="view-count">${this.formatViewCount(news.viewCount || 0)}</span>
                        </div>
                    </div>
                    
                    <!-- 操作按鈕 -->
                    <div class="flex items-center justify-between">
                        <button class="read-more-btn inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                                onclick="NewsCard.viewNews('${news._id}', '${news.analyticsId || ''}', '${this.escapeHtml(news.title)}')">
                            閱讀更多
                            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                        
                        ${options.showActions ? this.renderActionButtons() : ''}
                        
                        <!-- 分享按鈕 -->
                        <div class="flex items-center space-x-2">
                            <button class="share-btn p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all"
                                    onclick="NewsCard.shareNews('${news._id}', '${this.escapeHtml(news.title)}')"
                                    title="分享">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                                </svg>
                            </button>
                            
                            <button class="bookmark-btn p-2 text-gray-400 hover:text-yellow-600 rounded-full hover:bg-yellow-50 transition-all"
                                    onclick="NewsCard.toggleBookmark('${news._id}')"
                                    title="收藏">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * 渲染媒體內容（圖片或影片）
     */
    renderMediaContent() {
        const { news } = this;
        
        // 優先顯示用戶上傳的圖片，即使有影片連結
        if (news.imageUrl || (news.images && news.images.length > 0)) {
            return this.renderImageContent();
        } else if (news.videoUrl) {
            return this.renderVideoContent();
        }
        
        return '<div class="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center"><svg class="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg></div>';
    }

    /**
     * 渲染影片內容
     */
    renderVideoContent() {
        const { news } = this;
        
        if (news.videoType === 'youtube' && news.youtubeEmbedId) {
            const thumbnailUrl = `https://img.youtube.com/vi/${news.youtubeEmbedId}/maxresdefault.jpg`;
            return `
                <div class="relative h-48 bg-black overflow-hidden">
                    <img src="${thumbnailUrl}" 
                         alt="${this.escapeHtml(news.title)}" 
                         class="w-full h-full object-cover"
                         onerror="this.src='https://img.youtube.com/vi/${news.youtubeEmbedId}/hqdefault.jpg'">
                    <div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-20 transition-all">
                        <div class="bg-red-600 rounded-full p-3 transform group-hover:scale-110 transition-transform cursor-pointer"
                             onclick="NewsCard.playVideo('${news.youtubeEmbedId}', 'youtube')">
                            <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                        YouTube
                    </div>
                </div>
            `;
        } else if (news.videoType === 'instagram') {
            return `
                <div class="relative h-48 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 overflow-hidden">
                    <div class="absolute inset-0 flex items-center justify-center text-white">
                        <div class="text-center">
                            <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            <p class="text-sm font-medium">Instagram 影片</p>
                        </div>
                    </div>
                    <div class="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all cursor-pointer"
                         onclick="NewsCard.openInstagramPost('${news.videoUrl}')">
                    </div>
                </div>
            `;
        }
        
        return '';
    }

    /**
     * 渲染圖片內容
     */
    renderImageContent() {
        const { news } = this;
        const imageUrl = news.imageUrl || (news.images && news.images[0]);
        
        if (!imageUrl) {
            console.warn('⚠️ NewsCard: 沒有圖片URL', news.title);
            return '';
        }
        
        console.log('🖼️ NewsCard: 渲染圖片', imageUrl, '新聞:', news.title);
        
        return `
            <div class="relative h-48 overflow-hidden bg-gray-100">
                <img src="${imageUrl}" 
                     alt="${this.escapeHtml(news.title)}" 
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                     style="display: block;"
                     onload="console.log('✅ NewsCard圖片載入成功:', this.src); this.style.opacity='1';"
                     onerror="console.error('❌ NewsCard圖片載入失敗:', this.src, 'News:', '${this.escapeHtml(news.title)}'); this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="absolute inset-0 w-full h-full bg-gray-200 items-center justify-center" style="display: none;">
                    <div class="text-center">
                        <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                        </svg>
                        <div class="text-xs text-gray-500">圖片載入失敗</div>
                        <div class="text-xs text-gray-400 mt-1">${imageUrl}</div>
                    </div>
                </div>
                ${news.videoUrl && news.videoType === 'youtube' ? `
                    <div class="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path>
                        </svg>
                        YouTube
                    </div>
                ` : ''}
                ${news.videoUrl && news.videoType === 'instagram' ? `
                    <div class="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path>
                        </svg>
                        Instagram
                    </div>
                ` : ''}
                ${news.images && news.images.length > 1 ? `
                    <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                        +${news.images.length - 1} 張圖片
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 渲染標籤
     */
    renderTags() {
        const { news } = this;
        if (!news.tags || news.tags.length === 0) return '';
        
        return news.tags.slice(0, 3).map(tag => 
            `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer" onclick="NewsCard.filterByTag('${tag}')">#${this.escapeHtml(tag)}</span>`
        ).join(' ');
    }

    /**
     * 渲染操作按鈕（管理員模式）
     */
    renderActionButtons() {
        const { news } = this;
        return `
            <div class="flex items-center space-x-2">
                <button class="edit-btn p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-all"
                        onclick="NewsCard.editNews('${news._id}')"
                        title="編輯">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                
                <button class="delete-btn p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-all"
                        onclick="NewsCard.deleteNews('${news._id}', '${this.escapeHtml(news.title)}')"
                        title="刪除">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
                
                <button class="status-btn p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all"
                        onclick="NewsCard.toggleStatus('${news._id}', '${news.status}')"
                        title="${news.status === 'published' ? '設為草稿' : '發布'}">
                    ${news.status === 'published' ? 
                        '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>' : 
                        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                    }
                </button>
            </div>
        `;
    }

    /**
     * 工具方法：截斷文本
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    /**
     * 工具方法：轉義 HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 工具方法：格式化瀏覽次數
     */
    formatViewCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    // ===============================
    // 靜態方法 - 處理用戶互動
    // ===============================

    /**
     * 查看新聞詳情
     */
    static async viewNews(newsId, analyticsId, title) {
        try {
            // Google Analytics 追蹤
            if (window.analyticsTracker) {
                window.analyticsTracker.trackNewsView(newsId, analyticsId, title, {
                    source: 'news_card',
                    timestamp: Date.now()
                });
            }

            // 導航到新聞詳情頁面或顯示模態框
            if (typeof window.showNewsModal === 'function') {
                window.showNewsModal(newsId);
            } else {
                window.location.href = `/news/${newsId}`;
            }
        } catch (error) {
            console.error('Error viewing news:', error);
        }
    }

    /**
     * 播放影片
     */
    static playVideo(videoId, type, newsId = null) {
        // 追蹤影片播放事件
        if (window.analyticsTracker && newsId) {
            window.analyticsTracker.trackVideoPlay(type, videoId, newsId, {
                source: 'news_card',
                timestamp: Date.now()
            });
        }

        if (type === 'youtube') {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
            modal.innerHTML = `
                <div class="relative max-w-4xl w-full">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold">
                        ✕ 關閉
                    </button>
                    <div class="relative pb-9/16">
                        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                                class="absolute top-0 left-0 w-full h-full rounded-lg"
                                style="aspect-ratio: 16/9; height: 70vh;"
                                frameborder="0" 
                                allowfullscreen>
                        </iframe>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    /**
     * 開啟 Instagram 貼文
     */
    static openInstagramPost(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    /**
     * 分享新聞
     */
    static async shareNews(newsId, title) {
        const url = `${window.location.origin}/news/${newsId}`;
        
        // 追蹤分享事件
        if (window.analyticsTracker) {
            window.analyticsTracker.trackNewsInteraction('share', newsId, null, {
                share_method: navigator.share ? 'native' : 'clipboard',
                title: title
            });
        }
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    url: url
                });
            } catch (error) {
                console.log('分享取消或失敗');
            }
        } else {
            // 降級處理：複製到剪貼板
            try {
                await navigator.clipboard.writeText(url);
                this.showToast('連結已複製到剪貼板！');
            } catch (error) {
                console.error('複製失敗:', error);
            }
        }
    }

    /**
     * 切換收藏狀態
     */
    static toggleBookmark(newsId) {
        const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
        const index = bookmarks.indexOf(newsId);
        const action = index > -1 ? 'remove_bookmark' : 'add_bookmark';
        
        // 追蹤收藏事件
        if (window.analyticsTracker) {
            window.analyticsTracker.trackNewsInteraction(action, newsId, null, {
                bookmark_count: index > -1 ? bookmarks.length - 1 : bookmarks.length + 1
            });
        }
        
        if (index > -1) {
            bookmarks.splice(index, 1);
            this.showToast('已取消收藏');
        } else {
            bookmarks.push(newsId);
            this.showToast('已加入收藏');
        }
        
        localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
        
        // 更新按鈕狀態
        const button = document.querySelector(`[onclick="NewsCard.toggleBookmark('${newsId}')"]`);
        if (button) {
            const svg = button.querySelector('svg');
            if (index > -1) {
                svg.setAttribute('fill', 'none');
                button.classList.remove('text-yellow-600');
                button.classList.add('text-gray-400');
            } else {
                svg.setAttribute('fill', 'currentColor');
                button.classList.remove('text-gray-400');
                button.classList.add('text-yellow-600');
            }
        }
    }

    /**
     * 依標籤篩選
     */
    static filterByTag(tag) {
        if (typeof window.filterNewsByTag === 'function') {
            window.filterNewsByTag(tag);
        }
    }

    /**
     * 編輯新聞（管理員功能）
     */
    static editNews(newsId) {
        if (typeof window.editNews === 'function') {
            window.editNews(newsId);
        }
    }

    /**
     * 刪除新聞（管理員功能）
     */
    static async deleteNews(newsId, title) {
        if (confirm(`確定要刪除新聞「${title}」嗎？此操作無法復原。`)) {
            try {
                const response = await fetch(`/api/news/admin/${newsId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });

                if (response.ok) {
                    this.showToast('新聞已刪除');
                    // 重新載入新聞列表
                    if (typeof window.loadNews === 'function') {
                        window.loadNews();
                    }
                } else {
                    const error = await response.json();
                    this.showToast('刪除失敗：' + error.message, 'error');
                }
            } catch (error) {
                console.error('Delete news error:', error);
                this.showToast('刪除失敗：網路錯誤', 'error');
            }
        }
    }

    /**
     * 切換新聞狀態（管理員功能）
     */
    static async toggleStatus(newsId, currentStatus) {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        
        try {
            const response = await fetch(`/api/news/admin/${newsId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                this.showToast(`新聞已${newStatus === 'published' ? '發布' : '設為草稿'}`);
                // 重新載入新聞列表
                if (typeof window.loadNews === 'function') {
                    window.loadNews();
                }
            } else {
                const error = await response.json();
                this.showToast('更新失敗：' + error.message, 'error');
            }
        } catch (error) {
            console.error('Toggle status error:', error);
            this.showToast('更新失敗：網路錯誤', 'error');
        }
    }

    /**
     * 顯示提示訊息
     */
    static showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transform transition-all duration-300 translate-y-0 opacity-100 ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 導出給全域使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsCard;
} else {
    window.NewsCard = NewsCard;
}
