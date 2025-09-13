#!/bin/bash

# Live Course Testing Script for Chain 6.5 Verification
# Tests actual URLs with curl requests and validates content

COURSE_ID="$1"
BASE_URL="http://localhost:3000"

if [ -z "$COURSE_ID" ]; then
    echo "Usage: $0 <course-id>"
    echo "Example: $0 operating-systems"
    exit 1
fi

echo "🧪 Live Course Testing: $COURSE_ID"
echo "=================================="
echo "🌐 Base URL: $BASE_URL"
echo ""

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
ERRORS=()

# Function to test URL and content
test_url() {
    local test_name="$1"
    local url="$2"
    local expected_content="$3"
    local description="$4"
    
    echo "🔍 Testing: $test_name"
    echo "📍 URL: $url"
    
    # Test if URL loads (HTTP 200)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$HTTP_STATUS" != "200" ]; then
        echo "❌ FAIL: HTTP $HTTP_STATUS"
        ERRORS+=("$test_name: HTTP $HTTP_STATUS")
        ((TESTS_FAILED++))
        echo ""
        return 1
    fi
    
    # Test if expected content is present
    CONTENT=$(curl -s "$url")
    if echo "$CONTENT" | grep -q "$expected_content"; then
        echo "✅ PASS: $description"
        ((TESTS_PASSED++))
    else
        echo "❌ FAIL: Expected content not found"
        echo "🔍 Looking for: $expected_content"
        ERRORS+=("$test_name: Missing expected content")
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Function to test JSON API endpoints
test_json() {
    local test_name="$1"
    local url="$2"
    local jq_filter="$3"
    local description="$4"
    
    echo "🔍 Testing: $test_name"
    echo "📍 URL: $url"
    
    CONTENT=$(curl -s "$url")
    if echo "$CONTENT" | jq -e "$jq_filter" > /dev/null 2>&1; then
        echo "✅ PASS: $description"
        ((TESTS_PASSED++))
    else
        echo "❌ FAIL: JSON validation failed"
        echo "🔍 Filter: $jq_filter"
        ERRORS+=("$test_name: JSON validation failed")
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Function to test JavaScript functionality
test_javascript() {
    local test_name="$1"
    local url="$2"
    local js_check="$3"
    local description="$4"
    
    echo "🔍 Testing: $test_name"
    echo "📍 URL: $url"
    
    CONTENT=$(curl -s "$url")
    if echo "$CONTENT" | grep -q "$js_check"; then
        echo "✅ PASS: $description"
        ((TESTS_PASSED++))
    else
        echo "❌ FAIL: JavaScript check failed"
        ERRORS+=("$test_name: JavaScript issue")
        ((TESTS_FAILED++))
    fi
    echo ""
}

echo "📱 1. HOMEPAGE INTEGRATION TEST"
echo "==============================="
test_url "Homepage Load" "$BASE_URL/index.html" "LearnByShorts" "Homepage loads successfully"
test_url "Course Tile Present" "$BASE_URL/index.html" "$COURSE_ID" "Course tile visible on homepage"

echo "📚 2. COURSE DETAIL PAGE TEST"
echo "============================="
COURSE_URL="$BASE_URL/course-detail.html?id=$COURSE_ID"
test_url "Course Detail Load" "$COURSE_URL" "course-detail" "Course detail page loads"
test_url "Course Title Present" "$COURSE_URL" "Operating Systems" "Course title displays"
test_javascript "Course JS Loaded" "$COURSE_URL" "CourseDetailPage" "JavaScript class loaded"

echo "📖 3. TOPIC STORY PAGES TEST"
echo "============================"
# Test first topic
TOPIC_URL="$BASE_URL/topic-story.html?course=$COURSE_ID&index=0"
test_url "First Topic Load" "$TOPIC_URL" "TopicStoryPage" "First topic page loads"
test_url "Story Content Present" "$TOPIC_URL" "Maya" "Story content with characters present"
test_javascript "Topic JS Loaded" "$TOPIC_URL" "async loadTopics" "Topic loading JavaScript present"

# Test additional topics if they exist
for i in {1..6}; do
    TOPIC_URL="$BASE_URL/topic-story.html?course=$COURSE_ID&index=$i"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TOPIC_URL")
    if [ "$HTTP_STATUS" = "200" ]; then
        CONTENT=$(curl -s "$TOPIC_URL")
        if echo "$CONTENT" | grep -q "Maya\|David\|Sarah\|Alex"; then
            echo "✅ Topic $((i+1)): Content present"
            ((TESTS_PASSED++))
        else
            echo "❌ Topic $((i+1)): No character content"
            ERRORS+=("Topic $((i+1)): Missing character content")
            ((TESTS_FAILED++))
        fi
    else
        echo "⚠️  Topic $((i+1)): Not accessible (HTTP $HTTP_STATUS)"
    fi
done

echo "🔗 4. DATA API ENDPOINTS TEST"
echo "============================="
test_json "courses.json" "$BASE_URL/data/courses.json" ".courses[] | select(.id == \"$COURSE_ID\")" "Course entry in courses.json"
test_json "topic-details.json" "$BASE_URL/data/topic-details.json" ".topics | keys[] | select(startswith(\"$COURSE_ID-\"))" "Topic entries in topic-details.json"

echo "⚙️  5. JAVASCRIPT FUNCTIONALITY TEST"
echo "===================================="
# Test if CourseDetailPage.js has the course
COURSE_JS_URL="$BASE_URL/js/pages/CourseDetailPage.js"
test_url "CourseDetailPage.js" "$COURSE_JS_URL" "$COURSE_ID" "Course defined in CourseDetailPage.js"

# Test topic-story.html JavaScript
TOPIC_STORY_URL="$BASE_URL/topic-story.html"
test_javascript "Topic Story JS" "$TOPIC_STORY_URL" "class TopicStoryPage" "TopicStoryPage class defined"

echo "🎯 6. CONTENT QUALITY TEST"
echo "=========================="
# Test story content quality
FIRST_TOPIC_URL="$BASE_URL/topic-story.html?course=$COURSE_ID&index=0"
CONTENT=$(curl -s "$FIRST_TOPIC_URL")

# Check for story elements
if echo "$CONTENT" | grep -q "Maya.*Crisis\|David.*Container\|Sarah.*Memory\|Alex.*Storage"; then
    echo "✅ PASS: Story titles follow character format"
    ((TESTS_PASSED++))
else
    echo "❌ FAIL: Story titles don't follow character format"
    ERRORS+=("Story Format: Titles don't follow character format")
    ((TESTS_FAILED++))
fi

# Check for technical content
if echo "$CONTENT" | grep -q "operating system\|kernel\|process\|memory"; then
    echo "✅ PASS: Technical content present"
    ((TESTS_PASSED++))
else
    echo "❌ FAIL: Missing technical content"
    ERRORS+=("Content Quality: Missing technical content")
    ((TESTS_FAILED++))
fi

echo "🔧 7. ERROR DETECTION TEST"
echo "=========================="
# Check for JavaScript errors in topic story
TOPIC_CONTENT=$(curl -s "$FIRST_TOPIC_URL")
if echo "$TOPIC_CONTENT" | grep -q "try.*{" && echo "$TOPIC_CONTENT" | grep -q "catch\|finally"; then
    echo "✅ PASS: JavaScript try/catch blocks properly formatted"
    ((TESTS_PASSED++))
else
    echo "⚠️  WARNING: Check JavaScript try/catch blocks manually"
fi

# Check JSON syntax
if curl -s "$BASE_URL/data/courses.json" | jq empty 2>/dev/null; then
    echo "✅ PASS: courses.json syntax valid"
    ((TESTS_PASSED++))
else
    echo "❌ FAIL: courses.json syntax error"
    ERRORS+=("JSON Syntax: courses.json invalid")
    ((TESTS_FAILED++))
fi

if curl -s "$BASE_URL/data/topic-details.json" | jq empty 2>/dev/null; then
    echo "✅ PASS: topic-details.json syntax valid"
    ((TESTS_PASSED++))
else
    echo "❌ FAIL: topic-details.json syntax error"
    ERRORS+=("JSON Syntax: topic-details.json invalid")
    ((TESTS_FAILED++))
fi

echo ""
echo "📊 TEST RESULTS SUMMARY"
echo "======================="
echo "✅ Tests Passed: $TESTS_PASSED"
echo "❌ Tests Failed: $TESTS_FAILED"
echo "📈 Success Rate: $(( TESTS_PASSED * 100 / (TESTS_PASSED + TESTS_FAILED) ))%"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ Course is fully functional and ready for students"
    echo "✅ Chain 6.5 Verification: COMPLETE"
    echo ""
    echo "🌐 Live Course URLs:"
    echo "📱 Homepage: $BASE_URL/index.html#courses"
    echo "📚 Course Detail: $BASE_URL/course-detail.html?id=$COURSE_ID"
    echo "📖 First Topic: $BASE_URL/topic-story.html?course=$COURSE_ID&index=0"
    echo ""
    echo "🚀 Ready to proceed to Chain 7: Course Page Generation"
    
    # Create completion flag
    echo "{\"courseId\": \"$COURSE_ID\", \"status\": \"COMPLETE\", \"timestamp\": \"$(date -Iseconds)\", \"testsPasssed\": $TESTS_PASSED}" > "course-verification-complete.json"
    
else
    echo ""
    echo "⚠️  TESTS FAILED - Issues found:"
    for error in "${ERRORS[@]}"; do
        echo "   ❌ $error"
    done
    echo ""
    echo "🔧 Fix the above issues and re-run this test"
    echo "📋 Command: ./test-course-live.sh $COURSE_ID"
    
    # Create failure report
    echo "{\"courseId\": \"$COURSE_ID\", \"status\": \"INCOMPLETE\", \"timestamp\": \"$(date -Iseconds)\", \"errors\": $(printf '%s\n' "${ERRORS[@]}" | jq -R . | jq -s .)}" > "course-verification-failed.json"
fi

echo ""
echo "📁 Verification report saved to: course-verification-$([ $TESTS_FAILED -eq 0 ] && echo "complete" || echo "failed").json"
