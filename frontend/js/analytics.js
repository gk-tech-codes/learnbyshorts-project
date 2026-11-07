// Google Analytics 4 Configuration
// GA4 Measurement ID: G-5413RZXDET

// Respect browser-level privacy signals. Analytics is used only for aggregate
// product improvement; the learning engine never sends lesson answers or PII.
const analyticsPrivacyOptOut =
    navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1';

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
if (!analyticsPrivacyOptOut) {
    gtag('js', new Date());
    gtag('config', 'G-5413RZXDET', {
        send_page_view: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
    });
}

function sendEvent(name, parameters = {}) {
    if (!analyticsPrivacyOptOut) {
        gtag('event', name, parameters);
    }
}

// Custom event tracking functions
const Analytics = {
    // Track page views
    trackPageView: function(pageName, pageTitle) {
        sendEvent('page_view', {
            page_title: pageTitle,
            page_location: window.location.href,
            page_name: pageName
        });
    },

    // Track design pattern views
    trackPatternView: function(patternName, difficulty) {
        sendEvent('pattern_view', {
            event_category: 'Design Patterns',
            event_label: patternName,
            custom_parameter_2: 'design_patterns',
            pattern_difficulty: difficulty,
            value: 1
        });
    },

    // Track story chapter completion
    trackChapterComplete: function(patternName, chapterNumber) {
        sendEvent('chapter_complete', {
            event_category: 'Learning Progress',
            event_label: `${patternName} - Chapter ${chapterNumber}`,
            chapter_number: chapterNumber,
            pattern_name: patternName,
            value: chapterNumber
        });
    },

    // Track contact form submissions
    trackContactSubmission: function(formType) {
        sendEvent('form_submit', {
            event_category: 'Contact',
            event_label: formType,
            value: 1
        });
    },

    // Track external link clicks
    trackExternalLink: function(linkUrl, linkText) {
        sendEvent('click', {
            event_category: 'External Links',
            event_label: linkUrl,
            link_text: linkText,
            value: 1
        });
    },

    // Track search queries (if you add search)
    trackSearch: function(searchTerm, resultsCount) {
        sendEvent('search', {
            search_term: searchTerm,
            results_count: resultsCount
        });
    },

    // Track user engagement time
    trackEngagement: function(contentType, timeSpent) {
        sendEvent('user_engagement', {
            event_category: 'Engagement',
            event_label: contentType,
            engagement_time_msec: timeSpent,
            value: Math.round(timeSpent / 1000) // Convert to seconds
        });
    },

    // Track downloads (if you add downloadable content)
    trackDownload: function(fileName, fileType) {
        sendEvent('file_download', {
            event_category: 'Downloads',
            event_label: fileName,
            file_extension: fileType,
            value: 1
        });
    },

    trackLessonStart: function(courseId, returningLearner) {
        sendEvent('lesson_start', {
            course_id: courseId,
            learner_state: returningLearner ? 'returning' : 'new'
        });
    },

    trackLearningStep: function(courseId, blockType, stepNumber, totalSteps) {
        sendEvent('learning_step_complete', {
            course_id: courseId,
            block_type: blockType,
            step_number: stepNumber,
            total_steps: totalSteps
        });
    },

    trackLessonComplete: function(courseId, totalSteps, xp, level) {
        sendEvent('lesson_complete', {
            course_id: courseId,
            total_steps: totalSteps,
            xp,
            level
        });
    },

    trackFoundingInterest: function(location) {
        sendEvent('founding_access_interest', { location });
    },

    trackResumePrompt: function(courseId, progressPercent, dueReviews) {
        sendEvent('resume_prompt_view', {
            course_id: courseId,
            progress_percent: progressPercent,
            due_reviews: dueReviews
        });
    },

    trackResumeClick: function(courseId, progressPercent, dueReviews) {
        sendEvent('resume_prompt_click', {
            course_id: courseId,
            progress_percent: progressPercent,
            due_reviews: dueReviews
        });
    },

    trackHomepageDemo: function(correct) {
        sendEvent('homepage_demo_answer', {
            answer_result: correct ? 'correct' : 'incorrect'
        });
    },

    trackInterviewDiagnostic: function(primarySkill, totalScore) {
        sendEvent('interview_diagnostic_complete', {
            primary_skill: primarySkill,
            total_score: totalScore
        });
    },

    trackAiLevel: function(level, completed, practicedCount) {
        sendEvent('ai_fluency_level_update', {
            level,
            completion_state: completed ? 'practiced' : 'reset',
            practiced_count: practicedCount
        });
    },

    trackAiTrack: function(track) {
        sendEvent('ai_fluency_track_select', {
            track
        });
    },

    trackSkillStudioPreset: function(preset) {
        sendEvent('ai_skill_studio_start', {
            preset
        });
    },

    trackAiVerification: function(gatesCompleted) {
        sendEvent('ai_coding_gate_update', {
            gates_completed: gatesCompleted,
            gate_state: gatesCompleted === 5 ? 'ready' : 'incomplete'
        });
    },

    trackLearningOsMission: function(goal, minutes) {
        sendEvent('learning_os_mission_view', {
            learning_goal: goal,
            planned_minutes: minutes
        });
    },

    trackLearningOsStep: function(step, completedSteps, missionComplete) {
        sendEvent('learning_os_step_update', {
            mission_step: step,
            completed_steps: completedSteps,
            mission_state: missionComplete ? 'complete' : 'in_progress'
        });
    },

    trackLearningOsCalibration: function(questionId, confidence, correct) {
        sendEvent('learning_os_calibration', {
            question_id: questionId,
            confidence_band: confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
            answer_result: correct ? 'correct' : 'incorrect'
        });
    },

    trackLearningOsProof: function(focusId, rubricScore) {
        sendEvent('learning_os_proof_saved', {
            focus_id: focusId,
            rubric_score: rubricScore
        });
    },

    trackLearningOsExport: function(proofCount) {
        sendEvent('learning_os_proof_export', {
            proof_count: proofCount
        });
    },

    trackModernCourseOpen: function(trackId, completedMissions) {
        sendEvent('modern_course_open', {
            track_id: trackId,
            completed_missions: completedMissions
        });
    },

    trackModernCourseStep: function(trackId, completedMissions) {
        sendEvent('modern_course_step', {
            track_id: trackId,
            completed_missions: completedMissions
        });
    },

    trackCuratedVideoOpen: function(videoId, category) {
        sendEvent('curated_video_open', {
            video_id: videoId,
            video_category: category
        });
    },

    trackCompanyInterviewOpen: function(companyId, completedSteps) {
        sendEvent('company_interview_open', {
            company_id: companyId,
            completed_steps: completedSteps
        });
    },

    trackCompanyInterviewStep: function(companyId, completedSteps) {
        sendEvent('company_interview_step', {
            company_id: companyId,
            completed_steps: completedSteps
        });
    },

    trackJobPlanGenerate: function(roleId, weeks, inputMode, coverageBand) {
        sendEvent('job_plan_generate', {
            role_id: roleId,
            plan_weeks: weeks,
            input_mode: inputMode,
            coverage_band: coverageBand
        });
    },

    trackJobPlanStep: function(roleId, weeks, completedSteps) {
        sendEvent('job_plan_step', {
            role_id: roleId,
            plan_weeks: weeks,
            completed_steps: completedSteps
        });
    },

    trackJobPromptCopy: function(roleId, promptId) {
        sendEvent('job_prompt_copy', {
            role_id: roleId,
            prompt_id: promptId
        });
    }
};

// Auto-track external links
document.addEventListener('DOMContentLoaded', function() {
    // Track external links automatically
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.addEventListener('click', function() {
                Analytics.trackExternalLink(this.href, this.textContent);
            });
        }
    });

    document.querySelectorAll('[data-analytics-event]').forEach(element => {
        element.addEventListener('click', function() {
            sendEvent(this.dataset.analyticsEvent, {
                location: this.dataset.analyticsLocation || window.location.pathname
            });
        });
    });

    // Track time spent on page
    let startTime = Date.now();
    let isActive = true;
    
    // Track when user becomes inactive
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (isActive) {
                const timeSpent = Date.now() - startTime;
                Analytics.trackEngagement(document.title, timeSpent);
                isActive = false;
            }
        } else {
            startTime = Date.now();
            isActive = true;
        }
    });

    // Track before page unload
    window.addEventListener('beforeunload', function() {
        if (isActive) {
            const timeSpent = Date.now() - startTime;
            Analytics.trackEngagement(document.title, timeSpent);
        }
    });
});

// Export for use in other scripts
window.Analytics = Analytics;
