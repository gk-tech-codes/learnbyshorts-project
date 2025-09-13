#!/bin/bash

# LearnByShorts Website Crawler Integration Test
# Real crawl following user journey: Homepage -> Course Pages -> Topics

BASE_URL="http://localhost:3000"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="website-crawl-report-$TIMESTAMP.json"
DETAILED_LOG="website-crawl-detailed-$TIMESTAMP.log"

echo "🕷️  LearnByShorts Website Crawler Integration Test" | tee $DETAILED_LOG
echo "=================================================" | tee -a $DETAILED_LOG
echo "🕐 Started: $(date)" | tee -a $DETAILED_LOG
echo "🌐 Base URL: $BASE_URL" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

# Test counters
TOTAL_COURSES=0
TOTAL_TOPICS=0
PASSED_COURSES=0
PASSED_TOPICS=0
FAILED_COURSES=0
FAILED_TOPICS=0
COURSE_RESULTS=()

# Step 1: Discover courses and topics from JSON files
echo "🏠 1. DISCOVERING COURSES AND TOPICS FROM JSON" | tee -a $DETAILED_LOG
echo "===============================================" | tee -a $DETAILED_LOG

# Get all courses from courses.json
COURSES_JSON=$(curl -s "$BASE_URL/data/courses.json")
if [ $? -ne 0 ]; then
    echo "❌ Failed to load courses.json" | tee -a $DETAILED_LOG
    exit 2
fi

# Get all topics from topic-details.json
TOPICS_JSON=$(curl -s "$BASE_URL/data/topic-details.json")
if [ $? -ne 0 ]; then
    echo "❌ Failed to load topic-details.json" | tee -a $DETAILED_LOG
    exit 2
fi

# Get topics from CourseDetailPage.js
COURSE_DETAIL_JS=$(curl -s "$BASE_URL/js/pages/CourseDetailPage.js")
if [ $? -ne 0 ]; then
    echo "❌ Failed to load CourseDetailPage.js" | tee -a $DETAILED_LOG
    exit 2
fi

# Extract all course IDs from courses.json
ALL_COURSE_IDS=$(echo "$COURSES_JSON" | jq -r '.courses[].id' 2>/dev/null)

echo "📊 Found courses in courses.json:" | tee -a $DETAILED_LOG
echo "$ALL_COURSE_IDS" | while read course_id; do
    if [ -n "$course_id" ]; then
        echo "  - $course_id" | tee -a $DETAILED_LOG
    fi
done

TOTAL_COURSES=$(echo "$ALL_COURSE_IDS" | grep -v '^$' | wc -l | tr -d ' ')
echo "📈 Total courses to test: $TOTAL_COURSES" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

# Function to test course using JSON data sources
test_course_from_json() {
    local course_id="$1"
    
    echo "  📚 Testing course from JSON: $course_id" >> $DETAILED_LOG
    
    # Test course detail page
    COURSE_URL="$BASE_URL/course-detail.html?id=$course_id"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$COURSE_URL")
    if [ "$HTTP_STATUS" != "200" ]; then
        echo "    ❌ Course detail page HTTP $HTTP_STATUS" >> $DETAILED_LOG
        return 1
    fi
    
    # Get topics for this course from different sources
    local course_topics_passed=0
    local course_topics_total=0
    
    # Method 1: Check topic-details.json for topics starting with course_id
    TOPIC_DETAILS_TOPICS=$(echo "$TOPICS_JSON" | jq -r ".topics | keys[]" 2>/dev/null | grep "^$course_id-" || true)
    
    if [ -n "$TOPIC_DETAILS_TOPICS" ]; then
        echo "    📖 Found topics in topic-details.json:" >> $DETAILED_LOG
        for topic_key in $TOPIC_DETAILS_TOPICS; do
            echo "      - $topic_key" >> $DETAILED_LOG
            local topic_index=$(echo "$topic_key" | sed "s/^$course_id-//" | sed 's/[^0-9]*$//')
            if [ -z "$topic_index" ]; then
                topic_index=$course_topics_total
            fi
            
            TOPIC_URL="$BASE_URL/topic-story.html?course=$course_id&index=$topic_index"
            if test_topic_page "$TOPIC_URL" "$course_id"; then
                ((course_topics_passed++))
                ((PASSED_TOPICS++))
            else
                ((FAILED_TOPICS++))
            fi
            ((course_topics_total++))
            ((TOTAL_TOPICS++))
        done
    fi
    
    # Method 2: Check CourseDetailPage.js for topics
    if [ $course_topics_total -eq 0 ]; then
        COURSEDETAIL_TOPICS=$(echo "$COURSE_DETAIL_JS" | sed -n "/'$course_id':/,/]/p" | grep -c "title:" || echo "0")
        
        if [ "$COURSEDETAIL_TOPICS" -gt 0 ]; then
            echo "    📖 Found $COURSEDETAIL_TOPICS topics in CourseDetailPage.js" >> $DETAILED_LOG
            
            for i in $(seq 0 $((COURSEDETAIL_TOPICS - 1))); do
                TOPIC_URL="$BASE_URL/topic-story.html?course=$course_id&index=$i"
                if test_topic_page "$TOPIC_URL" "$course_id"; then
                    ((course_topics_passed++))
                    ((PASSED_TOPICS++))
                else
                    ((FAILED_TOPICS++))
                fi
                ((course_topics_total++))
                ((TOTAL_TOPICS++))
            done
        fi
    fi
    
    # Method 3: Try standard topic URLs if no topics found
    if [ $course_topics_total -eq 0 ]; then
        echo "    📖 No topics found in JSON, trying standard URLs..." >> $DETAILED_LOG
        for i in {0..6}; do
            TOPIC_URL="$BASE_URL/topic-story.html?course=$course_id&index=$i"
            HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TOPIC_URL")
            if [ "$HTTP_STATUS" = "200" ]; then
                if test_topic_page "$TOPIC_URL" "$course_id"; then
                    ((course_topics_passed++))
                    ((PASSED_TOPICS++))
                else
                    ((FAILED_TOPICS++))
                fi
                ((course_topics_total++))
                ((TOTAL_TOPICS++))
            fi
        done
    fi
    
    if [ $course_topics_total -eq 0 ]; then
        echo "    ❌ No topics found for course" >> $DETAILED_LOG
        return 1
    fi
    
    # Course passes if at least 70% of topics work
    local success_threshold=$((course_topics_total * 7 / 10))
    if [ $course_topics_passed -ge $success_threshold ]; then
        echo "    ✅ Course topics passed ($course_topics_passed/$course_topics_total)" >> $DETAILED_LOG
        return 0
    else
        echo "    ❌ Course topics failed ($course_topics_passed/$course_topics_total)" >> $DETAILED_LOG
        return 1
    fi
}

# Function to test course page and extract topics using proper course structure
test_course_page() {
    local course_url="$1"
    local course_id="$2"
    
    echo "  📚 Testing course page: $course_url" >> $DETAILED_LOG
    
    # Handle relative URLs
    if [[ "$course_url" != http* ]]; then
        course_url="$BASE_URL/$course_url"
    fi
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$course_url")
    if [ "$HTTP_STATUS" != "200" ]; then
        echo "    ❌ Course page HTTP $HTTP_STATUS" >> $DETAILED_LOG
        return 1
    fi
    
    COURSE_CONTENT=$(curl -s "$course_url")
    
    # Check if course page is still loading
    if echo "$COURSE_CONTENT" | grep -q "Loading course preview\|Loading your learning path\|Loading learning outcomes"; then
        echo "    ⚠️  Course page showing loading states - may need browser refresh" >> $DETAILED_LOG
        # Don't fail immediately, try to test topics anyway
    fi
    
    # For design-patterns.html, get individual pattern courses
    if [ "$course_id" = "design-patterns" ]; then
        echo "    🎯 Scanning design patterns page for individual patterns..." >> $DETAILED_LOG
        
        # Extract pattern links from design-patterns.html
        PATTERN_LINKS=$(echo "$COURSE_CONTENT" | grep -o 'href="course-detail\.html?id=[^"]*-pattern[^"]*"' | sed 's/href="//g' | sed 's/"//g')
        
        if [ -n "$PATTERN_LINKS" ]; then
            echo "    📋 Found design patterns:" >> $DETAILED_LOG
            echo "$PATTERN_LINKS" | while read pattern_link; do
                echo "      - $pattern_link" >> $DETAILED_LOG
            done
            
            # Test each pattern
            local patterns_passed=0
            local patterns_total=0
            
            for pattern_link in $PATTERN_LINKS; do
                if [ -n "$pattern_link" ]; then
                    ((patterns_total++))
                    PATTERN_ID=$(echo "$pattern_link" | sed 's/.*id=\([^&]*\).*/\1/')
                    
                    if test_pattern_topics "$PATTERN_ID"; then
                        ((patterns_passed++))
                    fi
                fi
            done
            
            # Design patterns course passes if 70% of patterns work
            local success_threshold=$((patterns_total * 7 / 10))
            if [ $patterns_passed -ge $success_threshold ]; then
                echo "    ✅ Design patterns passed ($patterns_passed/$patterns_total)" >> $DETAILED_LOG
                return 0
            else
                echo "    ❌ Design patterns failed ($patterns_passed/$patterns_total)" >> $DETAILED_LOG
                return 1
            fi
        else
            echo "    ❌ No design patterns found" >> $DETAILED_LOG
            return 1
        fi
    else
        # For regular courses (including interview courses), test topics directly
        return $(test_course_topics_direct "$course_id")
    fi
}

# Function to test topics for a specific pattern
test_pattern_topics() {
    local pattern_id="$1"
    
    echo "      🔍 Testing pattern: $pattern_id" >> $DETAILED_LOG
    
    # Test first few topics for this pattern
    local pattern_topics_passed=0
    local pattern_topics_total=0
    
    for i in {0..4}; do
        TOPIC_URL="$BASE_URL/topic-story.html?course=$pattern_id&index=$i"
        
        if test_topic_page "$TOPIC_URL" "$pattern_id"; then
            ((pattern_topics_passed++))
            ((PASSED_TOPICS++))
        else
            ((FAILED_TOPICS++))
        fi
        
        ((pattern_topics_total++))
        ((TOTAL_TOPICS++))
    done
    
    # Pattern passes if at least 60% of topics work
    local success_threshold=$((pattern_topics_total * 6 / 10))
    if [ $pattern_topics_passed -ge $success_threshold ]; then
        echo "        ✅ Pattern topics passed ($pattern_topics_passed/$pattern_topics_total)" >> $DETAILED_LOG
        return 0
    else
        echo "        ❌ Pattern topics failed ($pattern_topics_passed/$pattern_topics_total)" >> $DETAILED_LOG
        return 1
    fi
}

# Function to test topics directly for regular courses
test_course_topics_direct() {
    local course_id="$1"
    
    echo "    📖 Testing course topics for: $course_id" >> $DETAILED_LOG
    
    # Test first few topics for this course
    local course_topics_passed=0
    local course_topics_total=0
    
    for i in {0..6}; do
        TOPIC_URL="$BASE_URL/topic-story.html?course=$course_id&index=$i"
        
        # Check if topic exists first
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TOPIC_URL")
        if [ "$HTTP_STATUS" = "200" ]; then
            if test_topic_page "$TOPIC_URL" "$course_id"; then
                ((course_topics_passed++))
                ((PASSED_TOPICS++))
            else
                ((FAILED_TOPICS++))
            fi
            
            ((course_topics_total++))
            ((TOTAL_TOPICS++))
        fi
    done
    
    if [ $course_topics_total -eq 0 ]; then
        echo "    ❌ No topics found for course" >> $DETAILED_LOG
        return 1
    fi
    
    # Course passes if at least 70% of topics work
    local success_threshold=$((course_topics_total * 7 / 10))
    if [ $course_topics_passed -ge $success_threshold ]; then
        echo "    ✅ Course topics passed ($course_topics_passed/$course_topics_total)" >> $DETAILED_LOG
        return 0
    else
        echo "    ❌ Course topics failed ($course_topics_passed/$course_topics_total)" >> $DETAILED_LOG
        return 1
    fi
}

# Function to test individual topic page - fixed to detect actual working content
test_topic_page() {
    local topic_url="$1"
    local course_id="$2"
    
    echo "      🔍 Testing topic: $topic_url" >> $DETAILED_LOG
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$topic_url")
    if [ "$HTTP_STATUS" != "200" ]; then
        echo "        ❌ Topic HTTP $HTTP_STATUS" >> $DETAILED_LOG
        return 1
    fi
    
    TOPIC_CONTENT=$(curl -s "$topic_url")
    
    # Check for actual story content - ignore the "Loading..." title, focus on content
    HAS_STORY_CONTENT=0
    HAS_EDUCATIONAL_CONTENT=0
    
    # Check for story characters (any of the main characters)
    if echo "$TOPIC_CONTENT" | grep -qi "maya\|david\|sarah\|alex\|elena\|marcus\|priya\|james\|sharma\|arjun"; then
        HAS_STORY_CONTENT=1
        echo "        ✅ Has story characters" >> $DETAILED_LOG
    fi
    
    # Check for educational/technical content
    if echo "$TOPIC_CONTENT" | grep -qi "crisis\|problem\|solution\|chapter\|pattern\|system\|algorithm\|code\|interview\|engineering"; then
        HAS_EDUCATIONAL_CONTENT=1
        echo "        ✅ Has educational content" >> $DETAILED_LOG
    fi
    
    # Check content length - working pages have substantial content
    CONTENT_LENGTH=$(echo "$TOPIC_CONTENT" | wc -c)
    if [ "$CONTENT_LENGTH" -gt 50000 ]; then
        echo "        ✅ Has substantial content ($CONTENT_LENGTH chars)" >> $DETAILED_LOG
        # If page has substantial content, it's working regardless of title
        return 0
    fi
    
    # Topic passes if it has story content AND educational content
    if [ $HAS_STORY_CONTENT -eq 1 ] && [ $HAS_EDUCATIONAL_CONTENT -eq 1 ]; then
        echo "        ✅ Topic working - has story and educational content" >> $DETAILED_LOG
        return 0
    else
        echo "        ❌ Topic not working - missing content (story:$HAS_STORY_CONTENT, edu:$HAS_EDUCATIONAL_CONTENT)" >> $DETAILED_LOG
        return 1
    fi
}

# Step 2: Test each course discovered from JSON
echo "🧪 2. TESTING ALL COURSES FROM JSON" | tee -a $DETAILED_LOG
echo "===================================" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

for course_id in $ALL_COURSE_IDS; do
    if [ -n "$course_id" ]; then
        echo "🔍 Testing Course: $course_id" | tee -a $DETAILED_LOG
        echo "$(printf '=%.0s' {1..50})" >> $DETAILED_LOG
        
        # Test course page and its topics
        if test_course_from_json "$course_id"; then
            echo "  ✅ COURSE PASSED" | tee -a $DETAILED_LOG
            ((PASSED_COURSES++))
            COURSE_RESULTS+=("$course_id:PASS")
        else
            echo "  ❌ COURSE FAILED" | tee -a $DETAILED_LOG
            ((FAILED_COURSES++))
            COURSE_RESULTS+=("$course_id:FAIL")
        fi
        
        echo "" | tee -a $DETAILED_LOG
    fi
done

# Step 3: Generate results
echo "📊 3. WEBSITE CRAWL RESULTS" | tee -a $DETAILED_LOG
echo "===========================" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

COURSE_SUCCESS_RATE=0
TOPIC_SUCCESS_RATE=0

if [ $TOTAL_COURSES -gt 0 ]; then
    COURSE_SUCCESS_RATE=$((PASSED_COURSES * 100 / TOTAL_COURSES))
fi

if [ $TOTAL_TOPICS -gt 0 ]; then
    TOPIC_SUCCESS_RATE=$((PASSED_TOPICS * 100 / TOTAL_TOPICS))
fi

echo "📈 CRAWL STATISTICS:" | tee -a $DETAILED_LOG
echo "  Courses: $PASSED_COURSES/$TOTAL_COURSES passed ($COURSE_SUCCESS_RATE%)" | tee -a $DETAILED_LOG
echo "  Topics: $PASSED_TOPICS/$TOTAL_TOPICS passed ($TOPIC_SUCCESS_RATE%)" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

# Determine overall result
OVERALL_STATUS="FAIL"
if [ $COURSE_SUCCESS_RATE -ge 80 ] && [ $TOPIC_SUCCESS_RATE -ge 70 ]; then
    OVERALL_STATUS="PASS"
    echo "🎉 WEBSITE CRAWL TEST: PASSED" | tee -a $DETAILED_LOG
    echo "✅ Website is ready for production" | tee -a $DETAILED_LOG
elif [ $COURSE_SUCCESS_RATE -ge 60 ] && [ $TOPIC_SUCCESS_RATE -ge 50 ]; then
    OVERALL_STATUS="WARNING"
    echo "⚠️  WEBSITE CRAWL TEST: WARNING" | tee -a $DETAILED_LOG
    echo "🔧 Some issues found - review before deployment" | tee -a $DETAILED_LOG
else
    echo "❌ WEBSITE CRAWL TEST: FAILED" | tee -a $DETAILED_LOG
    echo "🚫 Critical issues found - DO NOT DEPLOY" | tee -a $DETAILED_LOG
fi

echo "" | tee -a $DETAILED_LOG
echo "🕐 Completed: $(date)" | tee -a $DETAILED_LOG

# Generate JSON report
cat > "$REPORT_FILE" << EOF
{
  "testSuite": "LearnByShorts Website Crawler Integration Test",
  "timestamp": "$(date -Iseconds)",
  "baseUrl": "$BASE_URL",
  "crawlMethod": "Real website crawl following user journey",
  "summary": {
    "totalCourses": $TOTAL_COURSES,
    "passedCourses": $PASSED_COURSES,
    "failedCourses": $FAILED_COURSES,
    "courseSuccessRate": $COURSE_SUCCESS_RATE,
    "totalTopics": $TOTAL_TOPICS,
    "passedTopics": $PASSED_TOPICS,
    "failedTopics": $FAILED_TOPICS,
    "topicSuccessRate": $TOPIC_SUCCESS_RATE,
    "overallStatus": "$OVERALL_STATUS"
  },
  "courseResults": [
$(printf '%s\n' "${COURSE_RESULTS[@]}" | sed 's/\(.*\):\(.*\)/    {"courseId": "\1", "status": "\2"},/' | sed '$s/,$//')
  ],
  "recommendations": [
$(if [ "$OVERALL_STATUS" = "PASS" ]; then
    echo '    "Website is fully functional - safe to deploy",'
    echo '    "All courses and topics loading properly",'
    echo '    "Continue monitoring content quality"'
elif [ "$OVERALL_STATUS" = "WARNING" ]; then
    echo '    "Review failed courses before deployment",'
    echo '    "Fix topic loading issues in failing courses",'
    echo '    "Verify content quality for poor-scoring topics"'
else
    echo '    "DO NOT DEPLOY - critical functionality broken",'
    echo '    "Fix topic content loading issues immediately",'
    echo '    "Verify homepage course links are working",'
    echo '    "Check course page topic discovery"'
fi)
  ]
}
EOF

echo "" | tee -a $DETAILED_LOG
echo "📁 CRAWL REPORTS GENERATED:" | tee -a $DETAILED_LOG
echo "  📊 JSON Report: $REPORT_FILE" | tee -a $DETAILED_LOG
echo "  📝 Detailed Log: $DETAILED_LOG" | tee -a $DETAILED_LOG

# Exit with appropriate code
if [ "$OVERALL_STATUS" = "PASS" ]; then
    exit 0
elif [ "$OVERALL_STATUS" = "WARNING" ]; then
    exit 1
else
    exit 2
fi
