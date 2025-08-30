/**
 * Application Constants
 * Centralized configuration for the LearnByShorts application
 */

// API Configuration
const API_CONFIG = {
    BASE_URL: './',
    ENDPOINTS: {
        CATEGORIES: './data/categories.json',
        COURSES: './data/courses.json',
        COURSE_DETAIL: './data/courses/{id}.json'
    },
    TIMEOUT: 10000
};

// Application Routes
const ROUTES = {
    HOME: 'index.html',
    CATEGORY: 'category.html',
    COURSE_DETAIL: 'course-detail.html',
    COURSE_PLAYER: 'course-player.html'
};

// UI Constants
const UI_CONFIG = {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    ITEMS_PER_PAGE: 12,
    BREAKPOINTS: {
        MOBILE: 768,
        TABLET: 1024,
        DESKTOP: 1200
    }
};

// Error Messages
const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
    DATA_LOAD_ERROR: 'Failed to load data. Please try again.',
    CATEGORY_NOT_FOUND: 'Category not found.',
    COURSE_NOT_FOUND: 'Course not found.',
    GENERIC_ERROR: 'Something went wrong. Please try again.'
};

// Success Messages
const SUCCESS_MESSAGES = {
    DATA_LOADED: 'Data loaded successfully',
    COURSE_STARTED: 'Course started successfully'
};

// Local Storage Keys
const STORAGE_KEYS = {
    USER_PROGRESS: 'learnbyshorts_progress',
    USER_PREFERENCES: 'learnbyshorts_preferences',
    CACHE_TIMESTAMP: 'learnbyshorts_cache_timestamp'
};

// Cache Configuration
const CACHE_CONFIG = {
    EXPIRY_TIME: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 50 // Maximum number of cached items
};

// Event Names
const EVENTS = {
    CATEGORY_SELECTED: 'categorySelected',
    COURSE_SELECTED: 'courseSelected',
    DATA_LOADED: 'dataLoaded',
    ERROR_OCCURRED: 'errorOccurred',
    LOADING_START: 'loadingStart',
    LOADING_END: 'loadingEnd'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        ROUTES,
        UI_CONFIG,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        STORAGE_KEYS,
        CACHE_CONFIG,
        EVENTS
    };
}
