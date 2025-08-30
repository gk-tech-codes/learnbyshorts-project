// Google Analytics 4 Configuration
// GA4 Measurement ID: G-5413RZXDET

// Initialize Google Analytics 4
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// Configure GA4 with your measurement ID
gtag('config', 'G-5413RZXDET', {
    // Enhanced measurement settings
    send_page_view: true,
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
    
    // Custom dimensions
    custom_map: {
        'custom_parameter_1': 'user_type',
        'custom_parameter_2': 'content_category'
    }
});

// Custom event tracking functions
const Analytics = {
    // Track page views
    trackPageView: function(pageName, pageTitle) {
        gtag('event', 'page_view', {
            page_title: pageTitle,
            page_location: window.location.href,
            page_name: pageName
        });
    },

    // Track design pattern views
    trackPatternView: function(patternName, difficulty) {
        gtag('event', 'pattern_view', {
            event_category: 'Design Patterns',
            event_label: patternName,
            custom_parameter_2: 'design_patterns',
            pattern_difficulty: difficulty,
            value: 1
        });
    },

    // Track story chapter completion
    trackChapterComplete: function(patternName, chapterNumber) {
        gtag('event', 'chapter_complete', {
            event_category: 'Learning Progress',
            event_label: `${patternName} - Chapter ${chapterNumber}`,
            chapter_number: chapterNumber,
            pattern_name: patternName,
            value: chapterNumber
        });
    },

    // Track contact form submissions
    trackContactSubmission: function(formType) {
        gtag('event', 'form_submit', {
            event_category: 'Contact',
            event_label: formType,
            value: 1
        });
    },

    // Track external link clicks
    trackExternalLink: function(linkUrl, linkText) {
        gtag('event', 'click', {
            event_category: 'External Links',
            event_label: linkUrl,
            link_text: linkText,
            value: 1
        });
    },

    // Track search queries (if you add search)
    trackSearch: function(searchTerm, resultsCount) {
        gtag('event', 'search', {
            search_term: searchTerm,
            results_count: resultsCount
        });
    },

    // Track user engagement time
    trackEngagement: function(contentType, timeSpent) {
        gtag('event', 'user_engagement', {
            event_category: 'Engagement',
            event_label: contentType,
            engagement_time_msec: timeSpent,
            value: Math.round(timeSpent / 1000) // Convert to seconds
        });
    },

    // Track downloads (if you add downloadable content)
    trackDownload: function(fileName, fileType) {
        gtag('event', 'file_download', {
            event_category: 'Downloads',
            event_label: fileName,
            file_extension: fileType,
            value: 1
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
