from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 允許跨域請求

# 數據文件路徑
NEWS_FILE = 'news_data.json'

# 初始化新聞數據
def init_news_data():
    if not os.path.exists(NEWS_FILE):
        default_news = [
            {
                "id": 1,
                "title": "ACTC成立大會圓滿成功",
                "description": "亞洲科技合作聯盟(ACTC)於今日正式成立，來自亞洲各國的科技領袖齊聚一堂，共同見證這一重要時刻。聯盟將致力於促進亞洲地區的科技合作與創新發展。",
                "date": "2025-08-10",
                "images": [],
                "file": "",
                "link": "",
                "category": "聯盟動態",
                "status": "published"
            },
            {
                "id": 2,
                "title": "首屆亞洲科技峰會即將舉行",
                "description": "ACTC將於下個月舉辦首屆亞洲科技峰會，主題為「共建亞洲科技生態圈」。峰會將匯集亞洲各國的科技專家、企業家和政策制定者，共同探討亞洲科技發展的未來方向。",
                "date": "2025-08-09",
                "images": [],
                "file": "",
                "link": "",
                "category": "活動預告",
                "status": "published"
            }
        ]
        save_news_data(default_news)
    return load_news_data()

def load_news_data():
    try:
        with open(NEWS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_news_data(news_data):
    with open(NEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(news_data, f, ensure_ascii=False, indent=2)

# 獲取所有新聞
@app.route('/api/news', methods=['GET'])
def get_news():
    news_data = load_news_data()
    return jsonify(news_data)

# 獲取單個新聞
@app.route('/api/news/<int:news_id>', methods=['GET'])
def get_news_by_id(news_id):
    try:
        news_data = load_news_data()
        
        # 找到指定的新聞
        news = None
        for item in news_data:
            if item['id'] == news_id:
                news = item
                break
        
        if news is None:
            return jsonify({"success": False, "message": "新聞不存在"}), 404
        
        return jsonify(news)
    except Exception as e:
        return jsonify({"success": False, "message": f"獲取新聞失敗: {str(e)}"}), 500

# 新增新聞
@app.route('/api/news', methods=['POST'])
def add_news():
    try:
        data = request.get_json()
        news_data = load_news_data()
        
        # 生成新ID
        new_id = max([news['id'] for news in news_data], default=0) + 1
        
        new_news = {
            "id": new_id,
            "title": data.get('title', ''),
            "description": data.get('description', ''),
            "date": datetime.now().strftime('%Y-%m-%d'),
            "images": data.get('images', []),
            "file": data.get('file', ''),
            "link": data.get('link', ''),
            "category": data.get('category', '一般'),
            "status": "published"
        }
        
        news_data.append(new_news)
        save_news_data(news_data)
        
        return jsonify({"success": True, "message": "新聞新增成功", "news": new_news}), 201
    except Exception as e:
        return jsonify({"success": False, "message": f"新增失敗: {str(e)}"}), 500

# 更新新聞
@app.route('/api/news/<int:news_id>', methods=['PUT'])
def update_news(news_id):
    try:
        data = request.get_json()
        news_data = load_news_data()
        
        # 找到要更新的新聞
        news_index = None
        for i, news in enumerate(news_data):
            if news['id'] == news_id:
                news_index = i
                break
        
        if news_index is None:
            return jsonify({"success": False, "message": "新聞不存在"}), 404
        
        # 更新新聞內容
        news_data[news_index].update({
            "title": data.get('title', news_data[news_index]['title']),
            "description": data.get('description', news_data[news_index]['description']),
            "date": data.get('date', news_data[news_index]['date']),
            "images": data.get('images', news_data[news_index]['images']),
            "file": data.get('file', news_data[news_index]['file']),
            "link": data.get('link', news_data[news_index]['link']),
            "category": data.get('category', news_data[news_index]['category']),
            "status": data.get('status', news_data[news_index]['status'])
        })
        
        save_news_data(news_data)
        
        return jsonify({"success": True, "message": "新聞更新成功", "news": news_data[news_index]})
    except Exception as e:
        return jsonify({"success": False, "message": f"更新失敗: {str(e)}"}), 500

# 刪除新聞
@app.route('/api/news/<int:news_id>', methods=['DELETE'])
def delete_news(news_id):
    try:
        news_data = load_news_data()
        
        # 找到要刪除的新聞
        news_index = None
        for i, news in enumerate(news_data):
            if news['id'] == news_id:
                news_index = i
                break
        
        if news_index is None:
            return jsonify({"success": False, "message": "新聞不存在"}), 404
        
        # 刪除新聞
        deleted_news = news_data.pop(news_index)
        save_news_data(news_data)
        
        return jsonify({"success": True, "message": "新聞刪除成功", "deleted_news": deleted_news})
    except Exception as e:
        return jsonify({"success": False, "message": f"刪除失敗: {str(e)}"}), 500

# 用戶認證
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # 簡單的認證邏輯（實際應用中應該使用數據庫和加密）
        if username == 'admin' and password == 'admin123':
            return jsonify({
                "success": True,
                "message": "登入成功",
                "token": "admin-token-12345",
                "user": {
                    "username": username,
                    "role": "admin"
                }
            })
        else:
            return jsonify({"success": False, "message": "帳號或密碼錯誤"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": f"登入失敗: {str(e)}"}), 500

# 獲取統計數據
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        news_data = load_news_data()
        
        stats = {
            "total_news": len(news_data),
            "total_users": 150,  # 模擬數據
            "published_news": len([news for news in news_data if news['status'] == 'published']),
            "draft_news": len([news for news in news_data if news['status'] == 'draft'])
        }
        
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        return jsonify({"success": False, "message": f"獲取統計數據失敗: {str(e)}"}), 500

if __name__ == '__main__':
    # 初始化數據
    init_news_data()
    
    print("🚀 ACTC後端服務器啟動中...")
    print("📰 新聞管理API: http://localhost:5001/api/news")
    print("🔐 登入API: http://localhost:5001/api/auth/login")
    print("📊 統計API: http://localhost:5001/api/dashboard/stats")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
