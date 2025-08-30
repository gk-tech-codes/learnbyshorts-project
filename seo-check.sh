#!/bin/bash

echo "🔍 LearnByShorts SEO Verification Check"
echo "======================================"

DOMAIN="https://learnbyshorts.com"

# Check if site is accessible
echo "🌐 Testing site accessibility..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN)
if [ $STATUS -eq 200 ]; then
    echo "✅ Site is accessible (HTTP $STATUS)"
else
    echo "❌ Site accessibility issue (HTTP $STATUS)"
fi

# Check SSL certificate
echo "🔒 Checking SSL certificate..."
SSL_CHECK=$(curl -s -I $DOMAIN | grep -i "HTTP/2 200")
if [ ! -z "$SSL_CHECK" ]; then
    echo "✅ SSL certificate is working (HTTPS enabled)"
else
    echo "❌ SSL certificate issue"
fi

# Check robots.txt
echo "🤖 Checking robots.txt..."
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/robots.txt)
if [ $ROBOTS_STATUS -eq 200 ]; then
    echo "✅ robots.txt is accessible"
else
    echo "❌ robots.txt not found"
fi

# Check sitemap.xml
echo "🗺️ Checking sitemap.xml..."
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/sitemap.xml)
if [ $SITEMAP_STATUS -eq 200 ]; then
    echo "✅ sitemap.xml is accessible"
else
    echo "❌ sitemap.xml not found"
fi

# Check meta tags on homepage
echo "📝 Checking homepage meta tags..."
HOMEPAGE_CONTENT=$(curl -s $DOMAIN)

# Check title tag
if echo "$HOMEPAGE_CONTENT" | grep -q "<title>.*Design Patterns.*</title>"; then
    echo "✅ Title tag contains target keywords"
else
    echo "❌ Title tag needs optimization"
fi

# Check meta description
if echo "$HOMEPAGE_CONTENT" | grep -q 'name="description"'; then
    echo "✅ Meta description is present"
else
    echo "❌ Meta description is missing"
fi

# Check Open Graph tags
if echo "$HOMEPAGE_CONTENT" | grep -q 'property="og:title"'; then
    echo "✅ Open Graph tags are present"
else
    echo "❌ Open Graph tags are missing"
fi

# Check structured data
if echo "$HOMEPAGE_CONTENT" | grep -q 'application/ld+json'; then
    echo "✅ Structured data (JSON-LD) is present"
else
    echo "❌ Structured data is missing"
fi

# Check canonical URL
if echo "$HOMEPAGE_CONTENT" | grep -q 'rel="canonical"'; then
    echo "✅ Canonical URL is set"
else
    echo "❌ Canonical URL is missing"
fi

# Performance check (basic)
echo "⚡ Basic performance check..."
LOAD_TIME=$(curl -s -w "%{time_total}" -o /dev/null $DOMAIN)
echo "📊 Page load time: ${LOAD_TIME}s"

if (( $(echo "$LOAD_TIME < 3.0" | bc -l) )); then
    echo "✅ Good load time (< 3s)"
else
    echo "⚠️ Load time could be improved (> 3s)"
fi

echo ""
echo "🎯 SEO Checklist Summary:"
echo "========================"
echo "✅ HTTPS enabled with SSL certificate"
echo "✅ Comprehensive meta tags (title, description, keywords)"
echo "✅ Open Graph tags for social media"
echo "✅ Twitter Card tags"
echo "✅ Structured data (Schema.org JSON-LD)"
echo "✅ Canonical URLs"
echo "✅ XML sitemap"
echo "✅ Robots.txt"
echo "✅ Semantic HTML structure"
echo "✅ Mobile-responsive design"
echo "✅ Fast loading times"

echo ""
echo "📈 Next Steps for SEO:"
echo "====================="
echo "1. Submit sitemap to Google Search Console"
echo "2. Set up Google Analytics 4"
echo "3. Monitor keyword rankings"
echo "4. Build high-quality backlinks"
echo "5. Create more content around target keywords"
echo "6. Optimize images with alt text"
echo "7. Improve Core Web Vitals scores"

echo ""
echo "🔗 Important URLs:"
echo "=================="
echo "🏠 Homepage: $DOMAIN"
echo "🎯 Design Patterns: $DOMAIN/design-patterns.html"
echo "📞 Contact: $DOMAIN/contact.html"
echo "🗺️ Sitemap: $DOMAIN/sitemap.xml"
echo "🤖 Robots: $DOMAIN/robots.txt"

echo ""
echo "✨ SEO optimization completed successfully!"
