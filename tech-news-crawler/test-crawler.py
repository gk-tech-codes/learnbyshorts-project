#!/usr/bin/env python3
"""
Test script for the tech news crawler
"""

from crawler import TechNewsCrawler
import json

def main():
    print("🧪 Testing Tech News Crawler")
    print("============================")
    
    crawler = TechNewsCrawler()
    
    # Test single source first
    source = crawler.config['sources'][0]  # TechCrunch
    print(f"\n🔍 Testing single source: {source['name']}")
    articles = crawler.crawl_source(source)
    
    if articles:
        print(f"✅ Successfully crawled {len(articles)} articles")
        print("\n📰 Sample article:")
        print(json.dumps(articles[0], indent=2))
    else:
        print("❌ No articles found")
    
    # Test full crawl
    print(f"\n🚀 Testing full crawl...")
    all_articles = crawler.crawl_all()
    
    if all_articles:
        filename = crawler.save_articles(all_articles)
        print(f"✅ Full crawl complete! Saved to {filename}")
        
        # Show summary
        sources = {}
        for article in all_articles:
            sources[article['source']] = sources.get(article['source'], 0) + 1
        
        print("\n📊 Articles by source:")
        for source, count in sources.items():
            print(f"  {source}: {count} articles")
    else:
        print("❌ Full crawl failed")

if __name__ == "__main__":
    main()
