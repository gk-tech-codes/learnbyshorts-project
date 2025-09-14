#!/usr/bin/env python3
"""
Tech News to Educational Shorts Generator
Converts crawled articles into bite-sized educational content
"""

import json
import requests
from datetime import datetime
import os
import hashlib

class TechShortsGenerator:
    def __init__(self):
        self.educational_prompts = {
            "AI": [
                "Explain this AI development in simple terms that a beginner could understand",
                "What are the key implications of this AI advancement for everyday users?",
                "Break down the technical concepts in this AI news into digestible points",
                "How does this AI development compare to previous breakthroughs?",
                "What should developers know about this AI technology?"
            ],
            "Tech": [
                "Summarize this tech news in 3 key takeaways",
                "What does this technology mean for the future?",
                "Explain the business impact of this tech development",
                "How will this technology affect consumers?",
                "What are the pros and cons of this tech advancement?"
            ]
        }
        
        self.image_templates = {
            "AI": [
                {"type": "gradient", "colors": ["#667eea", "#764ba2"], "icon": "🤖"},
                {"type": "gradient", "colors": ["#f093fb", "#f5576c"], "icon": "🧠"},
                {"type": "gradient", "colors": ["#4facfe", "#00f2fe"], "icon": "⚡"},
                {"type": "solid", "color": "#1a1a2e", "accent": "#16213e", "icon": "🚀"}
            ],
            "Tech": [
                {"type": "gradient", "colors": ["#fa709a", "#fee140"], "icon": "💻"},
                {"type": "gradient", "colors": ["#a8edea", "#fed6e3"], "icon": "📱"},
                {"type": "gradient", "colors": ["#ff9a9e", "#fecfef"], "icon": "🔧"},
                {"type": "solid", "color": "#2d3748", "accent": "#4a5568", "icon": "⚙️"}
            ]
        }
    
    def generate_educational_content(self, article):
        """Generate educational short content from article"""
        category = article.get('category', 'Tech')
        prompt = self.educational_prompts[category][0]  # Use first prompt for now
        
        # Extract key points from article
        key_points = self.extract_key_points(article)
        
        short = {
            "id": f"short_{article['id']}",
            "title": self.create_short_title(article['title']),
            "original_title": article['title'],
            "content": key_points,
            "source_url": article['link'],
            "source_name": article['source'],
            "category": category,
            "educational_prompt": prompt,
            "image_template": self.select_image_template(category),
            "created_at": datetime.now().isoformat(),
            "estimated_read_time": "2-3 min"
        }
        
        return short
    
    def extract_key_points(self, article):
        """Extract 3-5 key educational points from article"""
        summary = article.get('summary', '')
        title = article['title']
        
        # Simple extraction logic - in production, use AI/NLP
        points = []
        
        # Add title as main point
        points.append({
            "type": "headline",
            "text": title,
            "emphasis": "high"
        })
        
        # Add summary as context
        if summary:
            points.append({
                "type": "context",
                "text": summary[:200] + "..." if len(summary) > 200 else summary,
                "emphasis": "medium"
            })
        
        # Add category-specific insights
        if article['category'] == 'AI':
            points.append({
                "type": "insight",
                "text": "💡 Key AI Insight: This development shows how AI continues to evolve and impact various industries.",
                "emphasis": "high"
            })
        else:
            points.append({
                "type": "insight", 
                "text": "🔍 Tech Impact: Understanding these developments helps us prepare for future technology trends.",
                "emphasis": "high"
            })
        
        # Add learning objective
        points.append({
            "type": "learning",
            "text": f"📚 Learn more about {article['category']} developments and their real-world applications.",
            "emphasis": "medium"
        })
        
        return points
    
    def create_short_title(self, original_title):
        """Create engaging short title"""
        # Simplify and make more engaging
        if len(original_title) > 60:
            # Take first part and add engaging element
            short_title = original_title[:50] + "..."
        else:
            short_title = original_title
            
        # Add engaging prefixes for different types
        if "AI" in original_title.upper():
            return f"🤖 AI Update: {short_title}"
        elif any(word in original_title.lower() for word in ['startup', 'funding', 'investment']):
            return f"💰 Startup News: {short_title}"
        elif any(word in original_title.lower() for word in ['security', 'privacy', 'hack']):
            return f"🔒 Security Alert: {short_title}"
        else:
            return f"📱 Tech News: {short_title}"
    
    def select_image_template(self, category):
        """Select appropriate image template"""
        templates = self.image_templates.get(category, self.image_templates['Tech'])
        # For now, return first template - could randomize or use ML
        return templates[0]
    
    def process_articles(self, articles_file):
        """Process all articles into shorts"""
        print(f"📚 Processing articles into educational shorts...")
        
        with open(articles_file, 'r') as f:
            data = json.load(f)
        
        articles = data['articles']
        shorts = []
        
        for article in articles:
            short = self.generate_educational_content(article)
            shorts.append(short)
        
        print(f"✅ Generated {len(shorts)} educational shorts")
        return shorts
    
    def save_shorts(self, shorts):
        """Save shorts to JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data/educational_shorts_{timestamp}.json"
        
        shorts_data = {
            "generated_at": datetime.now().isoformat(),
            "total_shorts": len(shorts),
            "categories": list(set(short['category'] for short in shorts)),
            "shorts": shorts
        }
        
        with open(filename, 'w') as f:
            json.dump(shorts_data, f, indent=2)
        
        print(f"💾 Saved {len(shorts)} shorts to {filename}")
        return filename
    
    def generate_homepage_data(self, shorts):
        """Generate data structure for homepage display"""
        homepage_shorts = []
        
        for short in shorts[:10]:  # Limit to 10 for homepage
            homepage_short = {
                "id": short['id'],
                "title": short['title'],
                "category": short['category'],
                "readTime": short['estimated_read_time'],
                "imageTemplate": short['image_template'],
                "preview": short['content'][0]['text'][:100] + "...",
                "sourceUrl": short['source_url'],
                "sourceName": short['source_name']
            }
            homepage_shorts.append(homepage_short)
        
        return {
            "featuredShorts": homepage_shorts,
            "lastUpdated": datetime.now().isoformat(),
            "totalShorts": len(shorts)
        }

if __name__ == "__main__":
    generator = TechShortsGenerator()
    
    # Find latest articles file
    data_files = [f for f in os.listdir('data') if f.startswith('rss_tech_news_')]
    if not data_files:
        print("❌ No articles found. Run rss-crawler.py first.")
        exit(1)
    
    latest_file = f"data/{sorted(data_files)[-1]}"
    print(f"📖 Processing: {latest_file}")
    
    # Generate shorts
    shorts = generator.process_articles(latest_file)
    shorts_file = generator.save_shorts(shorts)
    
    # Generate homepage data
    homepage_data = generator.generate_homepage_data(shorts)
    
    # Save homepage data
    with open('data/homepage_shorts.json', 'w') as f:
        json.dump(homepage_data, f, indent=2)
    
    print(f"🏠 Homepage data saved to data/homepage_shorts.json")
    
    # Show sample shorts
    print(f"\n📱 Sample Educational Shorts:")
    for i, short in enumerate(shorts[:3]):
        print(f"\n{i+1}. {short['title']}")
        print(f"   Category: {short['category']}")
        print(f"   Template: {short['image_template']}")
        print(f"   Points: {len(short['content'])} educational points")
        print(f"   Source: {short['source_name']}")
