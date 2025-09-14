#!/usr/bin/env python3
"""
Tech News Crawler - Finds latest AI and tech articles
"""

import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os
import time
import hashlib
from urllib.parse import urljoin, urlparse

class TechNewsCrawler:
    def __init__(self, sources_file='sources.json'):
        with open(sources_file, 'r') as f:
            self.config = json.load(f)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
    def crawl_source(self, source):
        """Crawl a single news source"""
        print(f"🔍 Crawling {source['name']}...")
        
        try:
            response = self.session.get(source['url'], timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = []
            article_elements = soup.select(source['selectors']['articles'])
            
            for element in article_elements[:5]:  # Limit to 5 articles per source
                article = self.extract_article(element, source)
                if article and self.is_relevant(article):
                    articles.append(article)
                    
            print(f"✅ Found {len(articles)} relevant articles from {source['name']}")
            return articles
            
        except Exception as e:
            print(f"❌ Error crawling {source['name']}: {str(e)}")
            return []
    
    def extract_article(self, element, source):
        """Extract article data from HTML element"""
        try:
            title_elem = element.select_one(source['selectors']['title'])
            link_elem = element.select_one(source['selectors']['link'])
            image_elem = element.select_one(source['selectors']['image'])
            summary_elem = element.select_one(source['selectors']['summary'])
            
            if not title_elem or not link_elem:
                return None
                
            title = title_elem.get_text(strip=True)
            link = link_elem.get('href')
            
            # Make link absolute
            if link and not link.startswith('http'):
                link = urljoin(source['url'], link)
            
            image_url = None
            if image_elem:
                image_url = image_elem.get('src') or image_elem.get('data-src')
                if image_url and not image_url.startswith('http'):
                    image_url = urljoin(source['url'], image_url)
            
            summary = summary_elem.get_text(strip=True) if summary_elem else ""
            
            return {
                'id': hashlib.md5(link.encode()).hexdigest()[:12],
                'title': title,
                'link': link,
                'image_url': image_url,
                'summary': summary,
                'source': source['name'],
                'crawled_at': datetime.now().isoformat(),
                'domain': urlparse(link).netloc
            }
            
        except Exception as e:
            print(f"⚠️ Error extracting article: {str(e)}")
            return None
    
    def is_relevant(self, article):
        """Check if article is relevant to AI/tech"""
        text = f"{article['title']} {article['summary']}".lower()
        
        for keyword in self.config['keywords']:
            if keyword.lower() in text:
                return True
        return False
    
    def crawl_all(self):
        """Crawl all configured sources"""
        print("🚀 Starting tech news crawl...")
        all_articles = []
        
        for source in self.config['sources']:
            articles = self.crawl_source(source)
            all_articles.extend(articles)
            time.sleep(1)  # Be respectful to servers
        
        # Remove duplicates
        seen_links = set()
        unique_articles = []
        for article in all_articles:
            if article['link'] not in seen_links:
                seen_links.add(article['link'])
                unique_articles.append(article)
        
        print(f"📊 Total unique articles found: {len(unique_articles)}")
        return unique_articles
    
    def save_articles(self, articles, filename=None):
        """Save articles to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"data/tech_news_{timestamp}.json"
        
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w') as f:
            json.dump({
                'crawled_at': datetime.now().isoformat(),
                'total_articles': len(articles),
                'articles': articles
            }, f, indent=2)
        
        print(f"💾 Saved {len(articles)} articles to {filename}")
        return filename

def lambda_handler(event, context):
    """AWS Lambda handler"""
    crawler = TechNewsCrawler()
    articles = crawler.crawl_all()
    
    # Save to /tmp in Lambda
    filename = crawler.save_articles(articles, '/tmp/latest_tech_news.json')
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Successfully crawled {len(articles)} articles',
            'articles_count': len(articles),
            'filename': filename
        })
    }

if __name__ == "__main__":
    crawler = TechNewsCrawler()
    articles = crawler.crawl_all()
    crawler.save_articles(articles)
