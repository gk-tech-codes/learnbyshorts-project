/**
 * CategoryCard Component - Factory Pattern Implementation
 * Creates category cards with consistent structure and behavior
 */

class CategoryCard {
    constructor(category) {
        this.category = category;
        this.element = null;
    }

    /**
     * Create the category card element
     */
    createElement() {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.setProperty('--category-color', this.category.color);
        card.setAttribute('data-category-id', this.category.id);
        
        // Add featured badge if applicable
        const featuredBadge = this.category.featured ? 
            '<div class="featured-badge">Featured</div>' : '';

        card.innerHTML = `
            ${featuredBadge}
            <div class="category-header">
                <div class="category-icon">${this.category.icon}</div>
                <h3 class="category-title">${this.category.title}</h3>
            </div>
            <p class="category-description">${this.category.description}</p>
            <div class="category-meta">
                <div class="meta-item">
                    <span class="course-count">${this.category.courseCount} courses</span>
                </div>
                <div class="meta-item">
                    <span class="difficulty-badge">${this.category.difficulty}</span>
                </div>
            </div>
            <div class="estimated-time">
                <small>⏱️ ${this.category.estimatedTime}</small>
            </div>
        `;

        // Add click event listener
        card.addEventListener('click', () => this.handleClick());
        
        // Add hover effects
        this.addHoverEffects(card);
        
        this.element = card;
        return card;
    }

    /**
     * Add hover effects to the card
     */
    addHoverEffects(card) {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    }

    /**
     * Handle card click
     */
    handleClick() {
        // Add loading state
        this.setLoadingState(true);
        
        // Notify observers
        dataService.notify(EVENTS.CATEGORY_SELECTED, this.category);
        
        // Navigate to category page
        setTimeout(() => {
            window.location.href = `${ROUTES.CATEGORY}?id=${this.category.id}`;
        }, UI_CONFIG.ANIMATION_DURATION);
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        if (!this.element) return;
        
        if (isLoading) {
            this.element.classList.add('loading');
        } else {
            this.element.classList.remove('loading');
        }
    }

    /**
     * Update category data
     */
    updateCategory(newCategory) {
        this.category = { ...this.category, ...newCategory };
        if (this.element) {
            // Re-render the card with new data
            const newElement = this.createElement();
            this.element.parentNode.replaceChild(newElement, this.element);
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}

/**
 * CategoryCardFactory - Factory Pattern Implementation
 * Creates different types of category cards
 */
class CategoryCardFactory {
    /**
     * Create a category card
     */
    static createCard(category, type = 'default') {
        switch (type) {
            case 'featured':
                return new FeaturedCategoryCard(category);
            case 'compact':
                return new CompactCategoryCard(category);
            case 'detailed':
                return new DetailedCategoryCard(category);
            default:
                return new CategoryCard(category);
        }
    }

    /**
     * Create multiple cards
     */
    static createCards(categories, type = 'default') {
        return categories.map(category => this.createCard(category, type));
    }
}

/**
 * FeaturedCategoryCard - Extended category card for featured items
 */
class FeaturedCategoryCard extends CategoryCard {
    createElement() {
        const card = super.createElement();
        card.classList.add('featured-card');
        
        // Add special styling for featured cards
        card.style.background = `linear-gradient(135deg, ${this.category.color}15, ${this.category.color}05)`;
        
        return card;
    }
}

/**
 * CompactCategoryCard - Smaller version for sidebars or lists
 */
class CompactCategoryCard extends CategoryCard {
    createElement() {
        const card = document.createElement('div');
        card.className = 'category-card compact';
        card.style.setProperty('--category-color', this.category.color);
        card.setAttribute('data-category-id', this.category.id);

        card.innerHTML = `
            <div class="category-header">
                <div class="category-icon small">${this.category.icon}</div>
                <div class="category-info">
                    <h4 class="category-title">${this.category.title}</h4>
                    <span class="course-count">${this.category.courseCount} courses</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.handleClick());
        this.element = card;
        return card;
    }
}

/**
 * DetailedCategoryCard - Extended version with more information
 */
class DetailedCategoryCard extends CategoryCard {
    createElement() {
        const card = super.createElement();
        card.classList.add('detailed-card');
        
        // Add additional details
        const additionalInfo = document.createElement('div');
        additionalInfo.className = 'additional-info';
        additionalInfo.innerHTML = `
            <div class="stats">
                <div class="stat">
                    <span class="stat-label">Difficulty</span>
                    <span class="stat-value">${this.category.difficulty}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Time</span>
                    <span class="stat-value">${this.category.estimatedTime}</span>
                </div>
            </div>
        `;
        
        card.appendChild(additionalInfo);
        return card;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CategoryCard, CategoryCardFactory };
}
