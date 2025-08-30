/**
 * ShortsPage Controller - Manages the shorts interface
 * Handles navigation, gestures, and user interactions
 */

class ShortsPage {
    constructor() {
        this.container = null;
        this.wrapper = null;
        this.navigation = null;
        this.shortCards = [];
        this.currentIndex = 0;
        this.isLoading = false;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        
        this.init();
    }

    /**
     * Initialize the shorts page
     */
    async init() {
        try {
            this.setupEventListeners();
            this.setupObservers();
            await this.loadShorts();
            this.setupGestureHandlers();
            this.setupKeyboardHandlers();
        } catch (error) {
            console.error('Failed to initialize shorts page:', error);
            this.showError('Failed to load programming concepts');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }

        // Window events
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Setup observers for shorts service
     */
    setupObservers() {
        shortsService.subscribe('shortsLoaded', (shorts) => {
            this.renderShorts(shorts);
        });

        shortsService.subscribe('shortChanged', (data) => {
            this.navigateToShort(data.index, data.direction);
        });

        shortsService.subscribe('error', (data) => {
            this.showError(data.message);
        });

        shortsService.subscribe('shortViewed', (data) => {
            this.updateAnalytics(data);
        });
    }

    /**
     * Handle DOM ready
     */
    onDOMReady() {
        this.container = document.getElementById('shortsContainer');
        this.wrapper = document.getElementById('shortsWrapper');
        this.navigation = document.getElementById('shortsNavigation');
        
        if (!this.container || !this.wrapper) {
            console.error('Shorts container elements not found');
            return;
        }

        // Hide loading spinner initially
        this.hideLoadingSpinner();
    }

    /**
     * Load shorts data
     */
    async loadShorts() {
        try {
            this.showLoadingSpinner();
            const shorts = await shortsService.getShorts();
            console.log('Loaded shorts:', shorts);
        } catch (error) {
            console.error('Failed to load shorts:', error);
            this.showError('Failed to load programming concepts');
        } finally {
            this.hideLoadingSpinner();
        }
    }

    /**
     * Render shorts cards
     */
    renderShorts(shorts) {
        if (!this.wrapper) return;

        // Clear existing content
        this.wrapper.innerHTML = '';
        this.shortCards = [];

        // Create short cards
        shorts.forEach((shortData, index) => {
            const shortCard = ShortCardFactory.createCard(shortData, shortData.featured ? 'featured' : 'default');
            const cardElement = shortCard.createElement();
            
            this.wrapper.appendChild(cardElement);
            this.shortCards.push(shortCard);
        });

        // Setup navigation dots
        this.setupNavigationDots(shorts.length);

        // Show first short
        if (this.shortCards.length > 0) {
            this.showShort(0);
        }

        // Update container height for proper scrolling
        this.updateContainerHeight();
    }

    /**
     * Setup navigation dots
     */
    setupNavigationDots(count) {
        if (!this.navigation) return;

        this.navigation.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            if (i === 0) dot.classList.add('active');
            
            dot.addEventListener('click', () => {
                this.goToShort(i);
            });
            
            this.navigation.appendChild(dot);
        }
    }

    /**
     * Update container height for proper display
     */
    updateContainerHeight() {
        if (this.wrapper && this.shortCards.length > 0) {
            const totalHeight = this.shortCards.length * window.innerHeight;
            this.wrapper.style.height = `${totalHeight}px`;
        }
    }

    /**
     * Show specific short
     */
    showShort(index) {
        if (index < 0 || index >= this.shortCards.length) return;

        // Hide all shorts
        this.shortCards.forEach(card => card.hide());

        // Show current short
        this.shortCards[index].show();
        this.currentIndex = index;

        // Update navigation
        this.updateNavigationDots(index);

        // Update wrapper position
        this.updateWrapperPosition(index);
    }

    /**
     * Navigate to short with animation
     */
    navigateToShort(index, direction = 'next') {
        if (index === this.currentIndex) return;

        const oldIndex = this.currentIndex;
        this.showShort(index);

        // Add transition animation
        this.animateTransition(oldIndex, index, direction);
    }

    /**
     * Animate transition between shorts
     */
    animateTransition(fromIndex, toIndex, direction) {
        if (!this.wrapper) return;

        const translateY = -toIndex * 100;
        this.wrapper.style.transform = `translateY(${translateY}vh)`;

        // Add animation class
        this.wrapper.classList.add('transitioning');
        
        setTimeout(() => {
            this.wrapper.classList.remove('transitioning');
        }, 300);
    }

    /**
     * Update wrapper position
     */
    updateWrapperPosition(index) {
        if (!this.wrapper) return;
        
        const translateY = -index * 100;
        this.wrapper.style.transform = `translateY(${translateY}vh)`;
    }

    /**
     * Update navigation dots
     */
    updateNavigationDots(activeIndex) {
        if (!this.navigation) return;

        const dots = this.navigation.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            if (index === activeIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    /**
     * Go to specific short
     */
    goToShort(index) {
        shortsService.goToShort(index);
    }

    /**
     * Go to next short
     */
    nextShort() {
        shortsService.nextShort();
    }

    /**
     * Go to previous short
     */
    previousShort() {
        shortsService.previousShort();
    }

    /**
     * Setup gesture handlers for touch devices
     */
    setupGestureHandlers() {
        if (!this.container) return;

        let startY = 0;
        let startTime = 0;
        let isScrolling = false;

        this.container.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isScrolling = false;
            this.container.classList.add('swiping');
        }, { passive: true });

        this.container.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const deltaY = Math.abs(currentY - startY);
            
            if (deltaY > 10) {
                isScrolling = true;
            }
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
            this.container.classList.remove('swiping');
            
            if (!isScrolling) return;

            const endY = e.changedTouches[0].clientY;
            const deltaY = startY - endY;
            const deltaTime = Date.now() - startTime;

            // Minimum swipe distance and maximum time
            if (Math.abs(deltaY) > 50 && deltaTime < 500) {
                if (deltaY > 0) {
                    // Swipe up - next short
                    this.nextShort();
                } else {
                    // Swipe down - previous short
                    this.previousShort();
                }
            }
        }, { passive: true });
    }

    /**
     * Setup keyboard handlers
     */
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousShort();
                    break;
                case 'ArrowDown':
                case 'ArrowRight':
                case ' ': // Spacebar
                    e.preventDefault();
                    this.nextShort();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToShort(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToShort(this.shortCards.length - 1);
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.exitShorts();
                    break;
            }
        });
    }

    /**
     * Exit shorts and return to homepage
     */
    exitShorts() {
        window.location.href = 'index.html';
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.updateContainerHeight();
        this.updateWrapperPosition(this.currentIndex);
    }

    /**
     * Show loading spinner
     */
    showLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'block';
        }
    }

    /**
     * Hide loading spinner
     */
    hideLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (!this.wrapper) return;

        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h2>Oops! Something went wrong</h2>
                <p>${message}</p>
                <button class="btn-retry" onclick="location.reload()">Try Again</button>
                <button class="btn-home" onclick="location.href='index.html'">Go Home</button>
            </div>
        `;

        this.wrapper.innerHTML = '';
        this.wrapper.appendChild(errorElement);
    }

    /**
     * Update analytics
     */
    updateAnalytics(data) {
        // Analytics implementation
        console.log('Analytics updated:', data);
    }

    /**
     * Get current short info
     */
    getCurrentShortInfo() {
        return {
            index: this.currentIndex,
            total: this.shortCards.length,
            current: this.shortCards[this.currentIndex]?.getData() || null
        };
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Cleanup method
     */
    cleanup() {
        // Clean up event listeners
        this.shortCards.forEach(card => card.destroy());
        this.shortCards = [];

        // Unsubscribe from service events
        shortsService.unsubscribe('shortsLoaded');
        shortsService.unsubscribe('shortChanged');
        shortsService.unsubscribe('error');
        shortsService.unsubscribe('shortViewed');
    }

    /**
     * Destroy the shorts page
     */
    destroy() {
        this.cleanup();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Initialize shorts page when script loads
let shortsPage;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        shortsPage = new ShortsPage();
        window.shortsPage = shortsPage;
    });
} else {
    shortsPage = new ShortsPage();
    window.shortsPage = shortsPage;
}
