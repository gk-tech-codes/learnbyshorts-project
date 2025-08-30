/**
 * ShortCard Component - Renders individual short cards
 * Handles display and interactions for each programming concept short
 */

class ShortCard {
    constructor(shortData) {
        this.data = shortData;
        this.element = null;
        this.isVisible = false;
    }

    /**
     * Create the short card element
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'short-card';
        this.element.style.backgroundColor = this.data.backgroundColor;
        
        // Set background image if available
        if (this.data.backgroundImage) {
            this.element.style.backgroundImage = `url('${this.data.backgroundImage}')`;
        }

        this.element.innerHTML = this.getCardHTML();
        this.attachEventListeners();
        
        return this.element;
    }

    /**
     * Generate HTML content for the card
     */
    getCardHTML() {
        return `
            <div class="short-content">
                <div class="short-header">
                    <div class="short-category">${this.getCategoryDisplayName()}</div>
                    <h1 class="short-title">${this.data.title}</h1>
                    <p class="short-subtitle">${this.data.subtitle}</p>
                </div>
                
                <div class="short-story">
                    <div class="story-character">
                        <div class="character-avatar">
                            ${this.getCharacterEmoji()}
                        </div>
                        <div class="character-info">
                            <h3>${this.data.story.character}</h3>
                            <p>${this.data.story.setting}</p>
                        </div>
                    </div>
                    
                    <p class="story-description">${this.data.description}</p>
                    
                    <div class="story-tags">
                        ${this.data.tags.map(tag => `<span class="story-tag">${tag}</span>`).join('')}
                    </div>
                    
                    <div class="story-meta">
                        <span class="story-duration">📖 ${this.data.duration}</span>
                        <span class="story-difficulty">⭐ ${this.data.difficulty}</span>
                    </div>
                </div>
                
                <div class="short-actions">
                    <button class="btn-learn-more" data-action="learn-more">
                        Learn More
                    </button>
                    <button class="btn-next" data-action="next">
                        Next Concept
                    </button>
                </div>
            </div>
            
            <div class="swipe-indicator">
                Swipe up for next concept
            </div>
        `;
    }

    /**
     * Get display name for category
     */
    getCategoryDisplayName() {
        const categoryMap = {
            'design-patterns': 'Design Patterns',
            'algorithms': 'Algorithms',
            'data-structures': 'Data Structures',
            'system-design': 'System Design',
            'web-development': 'Web Development'
        };
        return categoryMap[this.data.category] || this.data.category;
    }

    /**
     * Get character emoji based on story character
     */
    getCharacterEmoji() {
        const characterMap = {
            'Government Office': '🏛️',
            'Patel Uncle': '👨‍💼',
            'WhatsApp Admin': '📱',
            'Sharma Ji': '👨‍💻',
            'Tea Vendor': '☕',
            'Railway Station': '🚂'
        };
        return characterMap[this.data.story.character] || '👨‍💻';
    }

    /**
     * Attach event listeners to the card
     */
    attachEventListeners() {
        if (!this.element) return;

        // Button click handlers
        const learnMoreBtn = this.element.querySelector('[data-action="learn-more"]');
        const nextBtn = this.element.querySelector('[data-action="next"]');

        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleLearnMore();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleNext();
            });
        }

        // Touch/swipe handlers for mobile
        this.attachSwipeHandlers();
    }

    /**
     * Attach swipe gesture handlers
     */
    attachSwipeHandlers() {
        let startY = 0;
        let startTime = 0;
        let isScrolling = false;

        this.element.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isScrolling = false;
        }, { passive: true });

        this.element.addEventListener('touchmove', (e) => {
            if (!isScrolling) {
                const currentY = e.touches[0].clientY;
                const deltaY = Math.abs(currentY - startY);
                
                if (deltaY > 10) {
                    isScrolling = true;
                }
            }
        }, { passive: true });

        this.element.addEventListener('touchend', (e) => {
            if (!isScrolling) return;

            const endY = e.changedTouches[0].clientY;
            const deltaY = startY - endY;
            const deltaTime = Date.now() - startTime;

            // Swipe up to go to next
            if (deltaY > 50 && deltaTime < 300) {
                this.handleNext();
            }
            // Swipe down to go to previous
            else if (deltaY < -50 && deltaTime < 300) {
                this.handlePrevious();
            }
        }, { passive: true });
    }

    /**
     * Handle learn more button click
     */
    handleLearnMore() {
        // Track analytics
        shortsService.trackDetailNavigation(this.data.id);
        
        // Navigate to detail page
        const detailUrl = `concept-detail.html?id=${this.data.detailPageId}`;
        window.location.href = detailUrl;
    }

    /**
     * Handle next button click
     */
    handleNext() {
        shortsService.nextShort();
    }

    /**
     * Handle previous navigation
     */
    handlePrevious() {
        shortsService.previousShort();
    }

    /**
     * Show the card with animation
     */
    show() {
        if (this.element) {
            this.element.classList.add('active');
            this.isVisible = true;
            
            // Track view
            shortsService.trackShortView(this.data.id);
            
            // Trigger entrance animations
            this.animateIn();
        }
    }

    /**
     * Hide the card
     */
    hide() {
        if (this.element) {
            this.element.classList.remove('active');
            this.isVisible = false;
        }
    }

    /**
     * Animate card entrance
     */
    animateIn() {
        const content = this.element.querySelector('.short-content');
        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                content.style.transition = 'all 0.6s ease-out';
                content.style.opacity = '1';
                content.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    /**
     * Update card data
     */
    updateData(newData) {
        this.data = { ...this.data, ...newData };
        if (this.element) {
            this.element.innerHTML = this.getCardHTML();
            this.attachEventListeners();
        }
    }

    /**
     * Get card data
     */
    getData() {
        return this.data;
    }

    /**
     * Check if card is currently visible
     */
    isCardVisible() {
        return this.isVisible;
    }

    /**
     * Destroy the card and clean up
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        this.isVisible = false;
    }

    /**
     * Get element reference
     */
    getElement() {
        return this.element;
    }

    /**
     * Set custom background
     */
    setBackground(imageUrl, color) {
        if (this.element) {
            if (imageUrl) {
                this.element.style.backgroundImage = `url('${imageUrl}')`;
            }
            if (color) {
                this.element.style.backgroundColor = color;
            }
        }
    }

    /**
     * Add custom CSS class
     */
    addClass(className) {
        if (this.element) {
            this.element.classList.add(className);
        }
    }

    /**
     * Remove custom CSS class
     */
    removeClass(className) {
        if (this.element) {
            this.element.classList.remove(className);
        }
    }

    /**
     * Toggle custom CSS class
     */
    toggleClass(className) {
        if (this.element) {
            this.element.classList.toggle(className);
        }
    }
}

/**
 * ShortCard Factory - Creates different types of short cards
 */
class ShortCardFactory {
    /**
     * Create a short card based on type
     */
    static createCard(shortData, type = 'default') {
        switch (type) {
            case 'featured':
                return new FeaturedShortCard(shortData);
            case 'interactive':
                return new InteractiveShortCard(shortData);
            default:
                return new ShortCard(shortData);
        }
    }
}

/**
 * Featured Short Card - Enhanced version with special styling
 */
class FeaturedShortCard extends ShortCard {
    createElement() {
        const element = super.createElement();
        element.classList.add('featured-short');
        return element;
    }

    getCardHTML() {
        const baseHTML = super.getCardHTML();
        return baseHTML.replace(
            '<div class="short-category">',
            '<div class="short-category featured">⭐ FEATURED - '
        );
    }
}

/**
 * Interactive Short Card - With additional interactive elements
 */
class InteractiveShortCard extends ShortCard {
    createElement() {
        const element = super.createElement();
        element.classList.add('interactive-short');
        return element;
    }

    getCardHTML() {
        const baseHTML = super.getCardHTML();
        // Add interactive elements like progress bars, mini-quizzes, etc.
        return baseHTML.replace(
            '</div>',
            '<div class="interactive-elements"><div class="progress-indicator"></div></div></div>'
        );
    }
}
