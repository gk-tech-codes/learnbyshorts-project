/**
 * Main Application Entry Point
 * Initializes the LearnByShorts application with proper error handling
 */

class App {
    constructor() {
        this.currentPage = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Set up global error handling
            this.setupErrorHandling();
            
            // Initialize based on current page
            await this.initializePage();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('LearnByShorts application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showGlobalError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize the appropriate page controller
     */
    async initializePage() {
        const path = window.location.pathname;
        const page = this.getPageFromPath(path);
        
        switch (page) {
            case 'home':
                // HomePage is already initialized in its own file
                break;
            case 'category':
                // CategoryPage is already initialized in its own file
                break;
            case 'course-detail':
                // CourseDetailPage will be initialized in its own file
                break;
            case 'course-player':
                // Course player initialization
                this.initializeCoursePlayer();
                break;
            default:
                console.log('Unknown page, using default initialization');
                this.initializeDefaultPage();
        }
    }

    /**
     * Get page type from URL path
     */
    getPageFromPath(path) {
        if (path === '/' || path.includes('index.html')) {
            return 'home';
        } else if (path.includes('category.html')) {
            return 'category';
        } else if (path.includes('course-detail.html')) {
            return 'course-detail';
        } else if (path.includes('course-player.html') || path.includes('timeline.html')) {
            return 'course-player';
        }
        return 'unknown';
    }

    /**
     * Initialize course player
     */
    initializeCoursePlayer() {
        // Course player specific initialization
        console.log('Initializing course player');
        
        // Set up course player controls if they exist
        const playButton = document.getElementById('play-pause');
        if (playButton) {
            playButton.addEventListener('click', this.togglePlayback.bind(this));
        }
    }

    /**
     * Initialize default page
     */
    initializeDefaultPage() {
        // Default page initialization
        console.log('Initializing default page');
        
        // Set up common elements
        this.setupNavigation();
        this.setupMobileMenu();
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }

    /**
     * Handle global errors
     */
    handleGlobalError(error) {
        // Don't show error notifications for every error, just log them
        console.error('Application error:', error);
        
        // Only show user-facing errors for critical issues
        if (error.message && error.message.includes('Failed to fetch')) {
            this.showGlobalError('Network connection issue. Please check your internet connection.');
        }
    }

    /**
     * Show global error message
     */
    showGlobalError(message) {
        // Create or update global error notification
        let errorNotification = document.getElementById('global-error-notification');
        
        if (!errorNotification) {
            errorNotification = document.createElement('div');
            errorNotification.id = 'global-error-notification';
            errorNotification.className = 'global-error-notification';
            document.body.appendChild(errorNotification);
        }
        
        errorNotification.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        errorNotification.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorNotification && errorNotification.parentNode) {
                errorNotification.remove();
            }
        }, 5000);
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Handle navigation
        this.setupNavigation();
        
        // Handle mobile menu
        this.setupMobileMenu();
        
        // Handle back button
        window.addEventListener('popstate', this.handlePopState.bind(this));
        
        // Handle online/offline status
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    /**
     * Setup navigation
     */
    setupNavigation() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Handle external links
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            link.addEventListener('click', (e) => {
                // Add analytics tracking for external links
                this.trackExternalLink(link.href);
            });
        });
    }

    /**
     * Setup mobile menu
     */
    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        }
    }

    /**
     * Handle browser back/forward buttons
     */
    handlePopState(event) {
        console.log('Navigation state changed');
        // Handle page state changes if needed
    }

    /**
     * Handle online status
     */
    handleOnline() {
        console.log('Application is online');
        this.hideOfflineNotification();
    }

    /**
     * Handle offline status
     */
    handleOffline() {
        console.log('Application is offline');
        this.showOfflineNotification();
    }

    /**
     * Show offline notification
     */
    showOfflineNotification() {
        let notification = document.getElementById('offline-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'offline-notification';
            notification.className = 'offline-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">📡</span>
                    <span class="notification-message">You're currently offline. Some features may not work.</span>
                </div>
            `;
            document.body.appendChild(notification);
        }
        
        notification.style.display = 'block';
    }

    /**
     * Hide offline notification
     */
    hideOfflineNotification() {
        const notification = document.getElementById('offline-notification');
        if (notification) {
            notification.remove();
        }
    }

    /**
     * Toggle playback for course player
     */
    togglePlayback() {
        const playButton = document.getElementById('play-pause');
        if (!playButton) return;
        
        const isPlaying = playButton.textContent === '⏸️';
        
        if (isPlaying) {
            playButton.textContent = '▶️';
            this.pausePlayback();
        } else {
            playButton.textContent = '⏸️';
            this.startPlayback();
        }
    }

    /**
     * Start playback
     */
    startPlayback() {
        console.log('Starting playback');
        // Implement playback logic
    }

    /**
     * Pause playback
     */
    pausePlayback() {
        console.log('Pausing playback');
        // Implement pause logic
    }

    /**
     * Track external link clicks
     */
    trackExternalLink(url) {
        console.log('External link clicked:', url);
        // Implement analytics tracking
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            currentPage: this.currentPage,
            online: navigator.onLine,
            dataService: window.dataService ? window.dataService.getCacheStats() : null
        };
    }
}

// Global utility functions
window.utils = {
    /**
     * Debounce function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Format number with commas
     */
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /**
     * Get URL parameters
     */
    getUrlParams: () => {
        return new URLSearchParams(window.location.search);
    },

    /**
     * Scroll to element
     */
    scrollToElement: (element, offset = 0) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }
};

// Initialize the application
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new App();
        window.app = app;
    });
} else {
    app = new App();
    window.app = app;
}

// Add global CSS for notifications
const globalStyles = `
    .global-error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fee2e2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        display: none;
    }
    
    .error-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .error-icon {
        font-size: 1.25rem;
    }
    
    .error-message {
        flex: 1;
        color: #991b1b;
        font-weight: 500;
    }
    
    .error-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #991b1b;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .offline-notification {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #fbbf24;
        color: #92400e;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        display: none;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-icon {
        font-size: 1.25rem;
    }
    
    .notification-message {
        font-weight: 500;
    }
    
    body.menu-open {
        overflow: hidden;
    }
    
    @media (max-width: 768px) {
        .global-error-notification,
        .offline-notification {
            left: 10px;
            right: 10px;
            max-width: none;
        }
    }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);
