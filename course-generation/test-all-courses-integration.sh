#!/bin/bash

# LearnByShorts Course Content Integration Test Suite
# Verifies all courses and topics render correctly before merge

BASE_URL="http://localhost:3000"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="integration-test-report-$TIMESTAMP.json"
DETAILED_LOG="integration-test-detailed-$TIMESTAMP.log"

echo "🧪 LearnByShorts Course Content Integration Test Suite" | tee $DETAILED_LOG
echo "=====================================================" | tee -a $DETAILED_LOG
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
TOPIC_RESULTS=()

# Extract all courses from CourseDetailPage.js
echo "📋 1. DISCOVERING ALL COURSES" | tee -a $DETAILED_LOG
echo "=============================" | tee -a $DETAILED_LOG

COURSE_JS_CONTENT=$(curl -s "$BASE_URL/js/pages/CourseDetailPage.js")
COURSE_IDS=$(echo "$COURSE_JS_CONTENT" | grep -o "'[^']*':" | sed "s/'//g" | sed "s/://g" | sort | uniq)

echo "📊 Discovered courses:" | tee -a $DETAILED_LOG
echo "$COURSE_IDS" | while read course_id; do
    echo "  - $course_id" | tee -a $DETAILED_LOG
    ((TOTAL_COURSES++))
done

TOTAL_COURSES=$(echo "$COURSE_IDS" | wc -l | tr -d ' ')
echo "📈 Total courses to test: $TOTAL_COURSES" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

# Function to test course homepage presence
test_course_homepage() {
    local course_id="$1"
    local course_title="$2"
    
    echo "  🏠 Testing homepage presence..." >> $DETAILED_LOG
    
    HOMEPAGE_CONTENT=$(curl -s "$BASE_URL/index.html")
    if echo "$HOMEPAGE_CONTENT" | grep -q "$course_id\|$course_title"; then
        echo "    ✅ Found on homepage" >> $DETAILED_LOG
        return 0
    else
        echo "    ❌ Not found on homepage" >> $DETAILED_LOG
        return 1
    fi
}

# Function to test course detail page
test_course_detail() {
    local course_id="$1"
    
    echo "  📚 Testing course detail page..." >> $DETAILED_LOG
    
    DETAIL_URL="$BASE_URL/course-detail.html?id=$course_id"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DETAIL_URL")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        DETAIL_CONTENT=$(curl -s "$DETAIL_URL")
        if echo "$DETAIL_CONTENT" | grep -q "course-detail\|Course Detail"; then
            echo "    ✅ Course detail page loads" >> $DETAILED_LOG
            return 0
        else
            echo "    ❌ Course detail page malformed" >> $DETAILED_LOG
            return 1
        fi
    else
        echo "    ❌ Course detail page HTTP $HTTP_STATUS" >> $DETAILED_LOG
        return 1
    fi
}

# Function to test topic story content
test_topic_content() {
    local course_id="$1"
    local topic_index="$2"
    local expected_title="$3"
    
    echo "    🔍 Testing topic $((topic_index + 1)): $expected_title" >> $DETAILED_LOG
    
    TOPIC_URL="$BASE_URL/topic-story.html?course=$course_id&index=$topic_index"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TOPIC_URL")
    
    if [ "$HTTP_STATUS" != "200" ]; then
        echo "      ❌ HTTP $HTTP_STATUS" >> $DETAILED_LOG
        return 1
    fi
    
    TOPIC_CONTENT=$(curl -s "$TOPIC_URL")
    
    # Check for loading state (indicates content not rendering)
    if echo "$TOPIC_CONTENT" | grep -q "Loading\.\.\.\|Loading story"; then
        echo "      ❌ Content stuck in loading state" >> $DETAILED_LOG
        return 1
    fi
    
    # Check for actual story content
    HAS_STORY_CONTENT=0
    if echo "$TOPIC_CONTENT" | grep -qi "sharma\|maya\|david\|sarah\|alex\|elena\|marcus\|priya\|james"; then
        HAS_STORY_CONTENT=1
    fi
    
    # Check for technical content
    HAS_TECHNICAL_CONTENT=0
    if echo "$TOPIC_CONTENT" | grep -qi "pattern\|algorithm\|system\|network\|code\|function\|class"; then
        HAS_TECHNICAL_CONTENT=1
    fi
    
    # Check for story structure
    HAS_STORY_STRUCTURE=0
    if echo "$TOPIC_CONTENT" | grep -qi "chapter\|story\|problem\|solution"; then
        HAS_STORY_STRUCTURE=1
    fi
    
    # Scoring
    SCORE=0
    if [ $HAS_STORY_CONTENT -eq 1 ]; then ((SCORE++)); fi
    if [ $HAS_TECHNICAL_CONTENT -eq 1 ]; then ((SCORE++)); fi
    if [ $HAS_STORY_STRUCTURE -eq 1 ]; then ((SCORE++)); fi
    
    if [ $SCORE -ge 2 ]; then
        echo "      ✅ Content renders properly (score: $SCORE/3)" >> $DETAILED_LOG
        return 0
    else
        echo "      ❌ Content quality insufficient (score: $SCORE/3)" >> $DETAILED_LOG
        echo "        - Story characters: $HAS_STORY_CONTENT" >> $DETAILED_LOG
        echo "        - Technical content: $HAS_TECHNICAL_CONTENT" >> $DETAILED_LOG
        echo "        - Story structure: $HAS_STORY_STRUCTURE" >> $DETAILED_LOG
        return 1
    fi
}

# Main testing loop
echo "🧪 2. TESTING ALL COURSES" | tee -a $DETAILED_LOG
echo "==========================" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

for course_id in $COURSE_IDS; do
    if [ -n "$course_id" ]; then
        echo "🔍 Testing Course: $course_id" | tee -a $DETAILED_LOG
        echo "$(printf '=%.0s' {1..50})" >> $DETAILED_LOG
        
        # Get course title from courses.json
        COURSE_TITLE=$(curl -s "$BASE_URL/data/courses.json" | jq -r ".courses[] | select(.id == \"$course_id\") | .title" 2>/dev/null || echo "Unknown")
        
        # Test components
        HOMEPAGE_PASS=0
        DETAIL_PASS=0
        TOPICS_PASS=0
        
        if test_course_homepage "$course_id" "$COURSE_TITLE"; then
            HOMEPAGE_PASS=1
        fi
        
        if test_course_detail "$course_id"; then
            DETAIL_PASS=1
        fi
        
        # Test topics and count them
        echo "  📖 Testing course topics..." >> $DETAILED_LOG
        COURSE_TOPICS=$(echo "$COURSE_JS_CONTENT" | sed -n "/'$course_id':/,/]/p" | grep "title:" | sed "s/.*title: *['\"]\\([^'\"]*\\)['\"].*/\\1/")
        
        if [ -n "$COURSE_TOPICS" ]; then
            local_topic_index=0
            local_topic_passed=0
            local_topic_total=0
            
            for topic_title in $COURSE_TOPICS; do
                if [ -n "$topic_title" ]; then
                    ((local_topic_total++))
                    ((TOTAL_TOPICS++))
                    
                    if test_topic_content "$course_id" "$local_topic_index" "$topic_title"; then
                        ((local_topic_passed++))
                        ((PASSED_TOPICS++))
                    else
                        ((FAILED_TOPICS++))
                    fi
                    
                    ((local_topic_index++))
                fi
            done
            
            # Topics pass if at least 70% work
            local_success_threshold=$((local_topic_total * 7 / 10))
            if [ $local_topic_passed -ge $local_success_threshold ]; then
                TOPICS_PASS=1
                echo "    ✅ Topics test passed ($local_topic_passed/$local_topic_total)" >> $DETAILED_LOG
            else
                echo "    ❌ Topics test failed ($local_topic_passed/$local_topic_total)" >> $DETAILED_LOG
            fi
        else
            echo "    ❌ No topics found in CourseDetailPage.js" >> $DETAILED_LOG
        fi
        
        # Overall course result
        COURSE_SCORE=$((HOMEPAGE_PASS + DETAIL_PASS + TOPICS_PASS))
        
        if [ $COURSE_SCORE -ge 2 ]; then
            echo "  ✅ COURSE PASSED (score: $COURSE_SCORE/3)" | tee -a $DETAILED_LOG
            ((PASSED_COURSES++))
        else
            echo "  ❌ COURSE FAILED (score: $COURSE_SCORE/3)" | tee -a $DETAILED_LOG
            ((FAILED_COURSES++))
        fi
        
        echo "" | tee -a $DETAILED_LOG
    fi
done

# Generate final report
echo "📊 3. INTEGRATION TEST RESULTS" | tee -a $DETAILED_LOG
echo "===============================" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

COURSE_SUCCESS_RATE=0
TOPIC_SUCCESS_RATE=0

if [ $TOTAL_COURSES -gt 0 ]; then
    COURSE_SUCCESS_RATE=$((PASSED_COURSES * 100 / TOTAL_COURSES))
fi

if [ $TOTAL_TOPICS -gt 0 ]; then
    TOPIC_SUCCESS_RATE=$((PASSED_TOPICS * 100 / TOTAL_TOPICS))
fi

echo "📈 SUMMARY STATISTICS:" | tee -a $DETAILED_LOG
echo "  Courses: $PASSED_COURSES/$TOTAL_COURSES passed ($COURSE_SUCCESS_RATE%)" | tee -a $DETAILED_LOG
echo "  Topics: $PASSED_TOPICS/$TOTAL_TOPICS passed ($TOPIC_SUCCESS_RATE%)" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

# Determine overall result
OVERALL_STATUS="FAIL"
if [ $COURSE_SUCCESS_RATE -ge 80 ] && [ $TOPIC_SUCCESS_RATE -ge 70 ]; then
    OVERALL_STATUS="PASS"
    echo "🎉 INTEGRATION TEST SUITE: PASSED" | tee -a $DETAILED_LOG
    echo "✅ Ready for merge - all critical functionality working" | tee -a $DETAILED_LOG
elif [ $COURSE_SUCCESS_RATE -ge 60 ] && [ $TOPIC_SUCCESS_RATE -ge 50 ]; then
    OVERALL_STATUS="WARNING"
    echo "⚠️  INTEGRATION TEST SUITE: WARNING" | tee -a $DETAILED_LOG
    echo "🔧 Some issues found - review before merge" | tee -a $DETAILED_LOG
else
    echo "❌ INTEGRATION TEST SUITE: FAILED" | tee -a $DETAILED_LOG
    echo "🚫 Critical issues found - DO NOT MERGE" | tee -a $DETAILED_LOG
fi

echo "" | tee -a $DETAILED_LOG
echo "🕐 Completed: $(date)" | tee -a $DETAILED_LOG

# Generate JSON report
cat > "$REPORT_FILE" << EOF
{
  "testSuite": "LearnByShorts Course Content Integration Test",
  "timestamp": "$(date -Iseconds)",
  "baseUrl": "$BASE_URL",
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
$(printf '%s\n' "${COURSE_RESULTS[@]}" | sed 's/\(.*\):\(.*\):\(.*\)/    {"courseId": "\1", "status": "\2", "score": \3},/' | sed '$s/,$//')
  ],
  "topicResults": [
$(printf '%s\n' "${TOPIC_RESULTS[@]}" | sed 's/\(.*\):\(.*\):\(.*\):\(.*\)/    {"courseId": "\1", "topicIndex": \2, "status": "\3", "title": "\4"},/' | sed '$s/,$//')
  ],
  "recommendations": [
$(if [ "$OVERALL_STATUS" = "PASS" ]; then
    echo '    "All systems operational - safe to merge",'
    echo '    "Continue monitoring course content quality",'
    echo '    "Consider adding automated testing to CI/CD pipeline"'
elif [ "$OVERALL_STATUS" = "WARNING" ]; then
    echo '    "Review failed courses and topics before merge",'
    echo '    "Fix content loading issues in failing topics",'
    echo '    "Verify homepage integration for missing courses"'
else
    echo '    "DO NOT MERGE - critical functionality broken",'
    echo '    "Fix topic content loading issues immediately",'
    echo '    "Verify CourseDetailPage.js configuration",'
    echo '    "Check story-content.json and topic-details.json integrity"'
fi)
  ]
}
EOF

echo "" | tee -a $DETAILED_LOG
echo "📁 REPORTS GENERATED:" | tee -a $DETAILED_LOG
echo "  📊 JSON Report: $REPORT_FILE" | tee -a $DETAILED_LOG
echo "  📝 Detailed Log: $DETAILED_LOG" | tee -a $DETAILED_LOG
echo "" | tee -a $DETAILED_LOG

# Exit with appropriate code
if [ "$OVERALL_STATUS" = "PASS" ]; then
    exit 0
elif [ "$OVERALL_STATUS" = "WARNING" ]; then
    exit 1
else
    exit 2
fi
