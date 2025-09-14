#!/usr/bin/env python3
"""
RSS-based Tech News Crawler - More reliable than HTML scraping
"""

import feedparser
import json
import requests
from datetime import datetime
import hashlib
import os

class RSSNewsCrawler:
    def __init__(self):
        self.feeds = [
            {
                "name": "TechCrunch AI",
                "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
                "category": "AI"
            },
            {
                "name": "VentureBeat AI",
                "url": "https://venturebeat.com/ai/feed/",
                "category": "AI"
            },
            {
                "name": "MIT Technology Review",
                "url": "https://www.technologyreview.com/feed/",
                "category": "Tech"
            },
            {
                "name": "Ars Technica",
                "url": "https://feeds.arstechnica.com/arstechnica/index",
                "category": "Tech"
            },
            {
                "name": "The Verge",
                "url": "https://www.theverge.com/rss/index.xml",
                "category": "Tech"
            }
        ]
        
        self.ai_keywords = [
            "artificial intelligence", "machine learning", "AI", "ML", 
            "neural network", "deep learning", "GPT", "LLM", "ChatGPT",
            "generative AI", "computer vision", "NLP", "robotics"
        ]
    
    def crawl_feed(self, feed_info):
        """Crawl a single RSS feed"""
        print(f"🔍 Crawling {feed_info['name']}...")
        
        try:
            feed = feedparser.parse(feed_info['url'])
            articles = []
            
            for entry in feed.entries[:10]:  # Limit to 10 per feed
                article = {
                    'id': hashlib.md5(entry.link.encode()).hexdigest()[:12],
                    'title': entry.title,
                    'link': entry.link,
                    'summary': getattr(entry, 'summary', ''),
                    'published': getattr(entry, 'published', ''),
                    'source': feed_info['name'],
                    'category': feed_info['category'],
                    'crawled_at': datetime.now().isoformat()
                }
                
                # Try to get image
                if hasattr(entry, 'media_content'):
                    article['image_url'] = entry.media_content[0]['url']
                elif hasattr(entry, 'enclosures') and entry.enclosures:
                    article['image_url'] = entry.enclosures[0].href
                else:
                    article['image_url'] = None
                
                # Check relevance for general tech feeds
                if feed_info['category'] == 'Tech':
                    if self.is_ai_relevant(article):
                        articles.append(article)
                else:
                    articles.append(article)
            
            print(f"✅ Found {len(articles)} articles from {feed_info['name']}")
            return articles
            
        except Exception as e:
            print(f"❌ Error crawling {feed_info['name']}: {str(e)}")
            return []
    
    def is_ai_relevant(self, article):
        """Check if article is AI/ML relevant"""
        text = f"{article['title']} {article['summary']}".lower()
        return any(keyword.lower() in text for keyword in self.ai_keywords)
    
    def crawl_all(self):
        """Crawl all RSS feeds"""
        print("🚀 Starting RSS news crawl...")
        all_articles = []
        
        for feed_info in self.feeds:
            articles = self.crawl_feed(feed_info)
            all_articles.extend(articles)
        
        # Remove duplicates by link
        seen_links = set()
        unique_articles = []
        for article in all_articles:
            if article['link'] not in seen_links:
                seen_links.add(article['link'])
                unique_articles.append(article)
        
        print(f"📊 Total unique articles found: {len(unique_articles)}")
        return unique_articles
    
    def save_articles(self, articles):
        """Save articles to JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data/rss_tech_news_{timestamp}.json"
        
        os.makedirs("data", exist_ok=True)
        
        data = {
            'crawled_at': datetime.now().isoformat(),
            'total_articles': len(articles),
            'sources': list(set(article['source'] for article in articles)),
            'articles': articles
        }
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"💾 Saved {len(articles)} articles to {filename}")
        return filename

if __name__ == "__main__":
    crawler = RSSNewsCrawler()
    articles = crawler.crawl_all()
    
    if articles:
        filename = crawler.save_articles(articles)
        
        # Show sample articles
        print(f"\n📰 Sample articles:")
        for i, article in enumerate(articles[:3]):
            print(f"\n{i+1}. {article['title']}")
            print(f"   Source: {article['source']}")
            print(f"   Link: {article['link']}")
            print(f"   Summary: {article['summary'][:100]}...")
    else:
        print("❌ No articles found")
