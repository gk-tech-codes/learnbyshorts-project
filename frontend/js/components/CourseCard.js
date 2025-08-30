/**
 * CourseCard Component - Factory Pattern Implementation
 * Creates course cards with consistent structure and behavior
 */

class CourseCard {
    constructor(course) {
        this.course = course;
        this.element = null;
    }

    /**
     * Create the course card element
     */
    createElement() {
        const card = document.createElement('div');
        card.className = `course-card ${this.course.published ? '' : 'coming-soon'}`;
        card.setAttribute('data-course-id', this.course.id);
        
        // Determine status badge
        const statusBadge = this.getStatusBadge();
        
        // Format duration
        const duration = this.formatDuration(this.course.duration);
        
        card.innerHTML = `
            <div class="course-thumbnail">
                <div class="course-placeholder">
                    <div class="placeholder-icon">${this.getIcon()}</div>
                    <div class="placeholder-text">${this.course.title}</div>
                </div>
                <div class="course-duration">${duration}</div>
                ${statusBadge}
            </div>
            <div class="course-info">
                <h3>${this.course.title}</h3>
                <p>${this.course.description || this.course.shortDescription}</p>
                <div class="course-meta">
                    <span class="difficulty ${this.course.difficulty.toLowerCase()}">${this.course.difficulty}</span>
                    <span class="rating">⭐ ${this.course.rating}</span>
                    <span class="students">${this.formatStudentCount(this.course.studentsEnrolled)} students</span>
                </div>
                <div class="course-tags">
                    ${this.renderTags()}
                </div>
                <button class="btn-course" ${!this.course.published ? 'disabled' : ''}>
                    ${this.course.published ? 'Start Course' : 'Coming Soon'}
                </button>
            </div>
        `;

        // Add click event listener
        if (this.course.published) {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-course')) {
                    this.handleClick();
                }
            });
            
            const button = card.querySelector('.btn-course');
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleButtonClick();
            });
        }
        
        // Add hover effects
        this.addHoverEffects(card);
        
        this.element = card;
        return card;
    }

    /**
     * Get course icon
     */
    getIcon() {
        // Use course-specific icon or category default
        return this.course.icon || '📚';
    }

    /**
     * Get status badge HTML
     */
    getStatusBadge() {
        if (!this.course.published) {
            return '<div class="status-badge coming-soon">Coming Soon</div>';
        }
        if (this.course.featured) {
            return '<div class="status-badge featured">Featured</div>';
        }
        return '';
    }

    /**
     * Format duration for display
     */
    formatDuration(duration) {
        if (typeof duration === 'string') {
            return duration;
        }
        if (typeof duration === 'number') {
            if (duration < 60) {
                return `${duration} min`;
            } else {
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
            }
        }
        return 'N/A';
    }

    /**
     * Format student count for display
     */
    formatStudentCount(count) {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
    }

    /**
     * Render course tags
     */
    renderTags() {
        if (!this.course.tags || this.course.tags.length === 0) {
            return '';
        }
        
        return this.course.tags.slice(0, 3).map(tag => 
            `<span class="course-tag">${tag}</span>`
        ).join('');
    }

    /**
     * Add hover effects to the card
     */
    addHoverEffects(card) {
        if (!this.course.published) return;
        
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
        dataService.notify(EVENTS.COURSE_SELECTED, this.course);
        
        // Navigate to course detail page
        setTimeout(() => {
            window.location.href = `${ROUTES.COURSE_DETAIL}?id=${this.course.id}`;
        }, UI_CONFIG.ANIMATION_DURATION);
    }

    /**
     * Handle button click
     */
    handleButtonClick() {
        if (!this.course.published) return;
        
        // Add loading state
        this.setLoadingState(true);
        
        // Navigate to course player
        setTimeout(() => {
            if (this.course.storyUrl) {
                window.location.href = this.course.storyUrl;
            } else {
                window.location.href = `${ROUTES.COURSE_PLAYER}?id=${this.course.id}`;
            }
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
     * Update course data
     */
    updateCourse(newCourse) {
        this.course = { ...this.course, ...newCourse };
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
 * CourseCardFactory - Factory Pattern Implementation
 * Creates different types of course cards
 */
class CourseCardFactory {
    /**
     * Create a course card
     */
    static createCard(course, type = 'default') {
        switch (type) {
            case 'featured':
                return new FeaturedCourseCard(course);
            case 'compact':
                return new CompactCourseCard(course);
            case 'list':
                return new ListCourseCard(course);
            default:
                return new CourseCard(course);
        }
    }

    /**
     * Create multiple cards
     */
    static createCards(courses, type = 'default') {
        return courses.map(course => this.createCard(course, type));
    }
}

/**
 * FeaturedCourseCard - Extended course card for featured items
 */
class FeaturedCourseCard extends CourseCard {
    createElement() {
        const card = super.createElement();
        card.classList.add('featured-card');
        
        // Add special styling for featured cards
        const gradient = this.getGradientForDifficulty(this.course.difficulty);
        card.style.background = gradient;
        
        return card;
    }

    getGradientForDifficulty(difficulty) {
        switch (difficulty.toLowerCase()) {
            case 'beginner':
                return 'linear-gradient(135deg, #10b98115, #10b98105)';
            case 'intermediate':
                return 'linear-gradient(135deg, #f59e0b15, #f59e0b05)';
            case 'advanced':
                return 'linear-gradient(135deg, #ef444415, #ef444405)';
            default:
                return 'linear-gradient(135deg, #6366f115, #6366f105)';
        }
    }
}

/**
 * CompactCourseCard - Smaller version for sidebars or lists
 */
class CompactCourseCard extends CourseCard {
    createElement() {
        const card = document.createElement('div');
        card.className = `course-card compact ${this.course.published ? '' : 'coming-soon'}`;
        card.setAttribute('data-course-id', this.course.id);

        card.innerHTML = `
            <div class="course-header">
                <div class="course-icon small">${this.getIcon()}</div>
                <div class="course-info">
                    <h4 class="course-title">${this.course.title}</h4>
                    <div class="course-meta">
                        <span class="difficulty ${this.course.difficulty.toLowerCase()}">${this.course.difficulty}</span>
                        <span class="duration">${this.formatDuration(this.course.duration)}</span>
                    </div>
                </div>
            </div>
        `;

        if (this.course.published) {
            card.addEventListener('click', () => this.handleClick());
        }
        
        this.element = card;
        return card;
    }
}

/**
 * ListCourseCard - Horizontal layout for list view
 */
class ListCourseCard extends CourseCard {
    createElement() {
        const card = super.createElement();
        card.classList.add('list-view');
        
        // Modify structure for horizontal layout
        const thumbnail = card.querySelector('.course-thumbnail');
        const info = card.querySelector('.course-info');
        
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        thumbnail.style.width = '120px';
        thumbnail.style.height = '80px';
        thumbnail.style.marginRight = '1.5rem';
        thumbnail.style.flexShrink = '0';
        info.style.flex = '1';
        
        return card;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CourseCard, CourseCardFactory };
}
