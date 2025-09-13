#!/bin/bash

# Content Rendering Validation Script
# Usage: ./validate-content-rendering.sh "course-id"

COURSE_ID="$1"
if [ -z "$COURSE_ID" ]; then
    echo "Usage: $0 course-id"
    echo "Example: $0 operating-systems"
    exit 1
fi

TOPIC_URL="http://localhost:3000/topic-story.html?course=$COURSE_ID&index=0"

echo "🧪 Content Rendering Validation for: $COURSE_ID"
echo "================================================"

# 1. Check if page loads
echo "📱 Testing page load..."
if curl -s "$TOPIC_URL" | grep -q "TopicStoryPage"; then
    echo "✅ Page loads with JavaScript class"
else
    echo "❌ Page loading issues"
fi

# 2. Validate JSON files
echo "📋 Validating JSON syntax..."
if jq empty frontend/data/topic-details.json 2>/dev/null; then
    echo "✅ topic-details.json syntax valid"
else
    echo "❌ topic-details.json syntax error"
    jq . frontend/data/topic-details.json 2>&1 | head -5
fi

if jq empty frontend/data/courses.json 2>/dev/null; then
    echo "✅ courses.json syntax valid"
else
    echo "❌ courses.json syntax error"
fi

# 3. Check topic ID exists
echo "🔍 Checking topic availability..."
AVAILABLE_TOPICS=$(jq -r '.topics | keys[]' frontend/data/topic-details.json | grep "^$COURSE_ID-" | wc -l)
echo "📊 Found $AVAILABLE_TOPICS topics for course: $COURSE_ID"

if [ "$AVAILABLE_TOPICS" -gt 0 ]; then
    echo "✅ Topics found:"
    jq -r '.topics | keys[]' frontend/data/topic-details.json | grep "^$COURSE_ID-" | head -3
else
    echo "❌ No topics found for course: $COURSE_ID"
    echo "Available course prefixes:"
    jq -r '.topics | keys[]' frontend/data/topic-details.json | cut -d'-' -f1-2 | sort | uniq | head -5
fi

# 4. Check content structure
echo "📖 Validating content structure..."
FIRST_TOPIC=$(jq -r '.topics | keys[]' frontend/data/topic-details.json | grep "^$COURSE_ID-" | head -1)
if [ -n "$FIRST_TOPIC" ]; then
    CONTENT_SECTIONS=$(jq -r ".topics[\"$FIRST_TOPIC\"].content | length" frontend/data/topic-details.json)
    echo "✅ First topic ($FIRST_TOPIC) has $CONTENT_SECTIONS content sections"
    
    # Check if content has required sections
    SECTION_TYPES=$(jq -r ".topics[\"$FIRST_TOPIC\"].content[].type" frontend/data/topic-details.json | tr '\n' ' ')
    echo "📋 Section types: $SECTION_TYPES"
    
    if echo "$SECTION_TYPES" | grep -q "story_intro"; then
        echo "✅ Has story_intro section"
    else
        echo "❌ Missing story_intro section"
    fi
else
    echo "❌ No first topic found"
fi

# 5. Test actual rendering
echo "🎯 Testing browser rendering..."
echo "Open browser console at: $TOPIC_URL"
echo "Expected behavior:"
echo "- Page should load topic title and content"
echo "- Story sections should be visible"
echo "- No JavaScript errors in console"

# 6. Quick fix suggestions
echo ""
echo "🔧 Quick Fix Checklist:"
echo "- [ ] JSON syntax is valid"
echo "- [ ] Topic IDs follow pattern: $COURSE_ID-topic-name"
echo "- [ ] Content array has 5 sections with proper types"
echo "- [ ] Course exists in CourseDetailPage.js"
echo "- [ ] No JavaScript errors in browser console"

echo ""
echo "🔧 JavaScript Error Detection:"
echo "- Open browser console at: $TOPIC_URL"
echo "- Look for 'Uncaught SyntaxError' or other JavaScript errors"
echo "- Common issues:"
echo "  * Missing catch/finally blocks in try statements"
echo "  * JSON syntax errors in data files"
echo "  * Undefined variables or functions"
echo "  * Missing closing braces or parentheses"

echo ""
echo "🛠️ Quick Fixes:"
echo "1. Validate all JSON files: jq empty frontend/data/*.json"
echo "2. Check JavaScript syntax in topic-story.html"
echo "3. Ensure all try blocks have catch or finally"
echo "4. Verify topic IDs match exactly between files"

echo ""
echo "🌐 Test URL: $TOPIC_URL"
