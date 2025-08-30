/**
 * Section Component
 * Generic section component that can render different section types
 */
class Section extends Component {
    /**
     * Create a new section component
     * @param {Object} config - Section configuration
     * @param {HTMLElement|string} container - Container element or selector
     */
    constructor(config = {}, container = null) {
        super(config, container);
        
        // Get dataService instance
        this.dataService = window.dataService || null;
        
        this.init();
    }

    /**
     * Initialize the component
     * @returns {Section} - The component instance for chaining
     */
    init() {
        // Default configuration
        this.config = {
            id: 'section',
            type: 'generic',
            enabled: true,
            title: 'Section Title',
            subtitle: '',
            layout: 'default',
            background: {
                type: 'color',
                value: '#ffffff'
            },
            items: [],
            ...this.config
        };
        
        return this;
    }

    /**
     * Render the section
     * @returns {HTMLElement} - The rendered element
     */
    render() {
        const { id, type, title, subtitle, layout, background } = this.config;
        
        // Create section container with background
        const sectionElement = document.createElement('section');
        sectionElement.id = id;
        sectionElement.className = `section section-${type} layout-${layout}`;
        
        // Add background styling
        if (background) {
            if (background.type === 'color') {
                sectionElement.style.backgroundColor = background.value;
            } else if (background.type === 'gradient') {
                sectionElement.style.background = background.value;
            } else if (background.type === 'image') {
                sectionElement.style.backgroundImage = `url(${background.value})`;
                sectionElement.style.backgroundSize = 'cover';
                sectionElement.style.backgroundPosition = 'center';
            }
        }
        
        // Create section header if title exists
        if (title) {
            const headerElement = document.createElement('div');
            headerElement.className = 'section-header';
            
            const titleElement = document.createElement('h2');
            titleElement.className = 'section-title';
            titleElement.textContent = title;
            headerElement.appendChild(titleElement);
            
            if (subtitle) {
                const subtitleElement = document.createElement('p');
                subtitleElement.className = 'section-subtitle';
                subtitleElement.textContent = subtitle;
                headerElement.appendChild(subtitleElement);
            }
            
            sectionElement.appendChild(headerElement);
        }
        
        // Create section content container
        const contentElement = document.createElement('div');
        contentElement.className = 'section-content';
        
        // Render section content based on type
        switch (type) {
            case 'categories':
                contentElement.appendChild(this.renderCategoriesSection());
                break;
            case 'features':
                contentElement.appendChild(this.renderFeaturesSection());
                break;
            case 'steps':
                contentElement.appendChild(this.renderStepsSection());
                break;
            case 'testimonials':
                contentElement.appendChild(this.renderTestimonialsSection());
                break;
            case 'cta':
                contentElement.appendChild(this.renderCtaSection());
                break;
            default:
                contentElement.appendChild(this.renderGenericSection());
        }
        
        sectionElement.appendChild(contentElement);
        
        this.element = sectionElement;
        return sectionElement;
    }
    
    /**
     * Render a categories section
     * @returns {HTMLElement} - The rendered element
     */
    async renderCategoriesSection() {
        const container = document.createElement('div');
        container.className = 'categories-grid';
        
        try {
            let categories = [];
            
            // Try to get categories from data service
            if (this.dataService) {
                try {
                    categories = await this.dataService.getCategories();
                } catch (error) {
                    console.warn('Failed to get categories from dataService:', error);
                }
            }
            
            // If no categories from dataService, use hardcoded default categories
            if (!categories || categories.length === 0) {
                console.log('Using hardcoded default categories');
                categories = [
                    {
                        id: "design-patterns",
                        title: "Design Patterns",
                        description: "Learn software design patterns through visual stories",
                        icon: "🏛️",
                        color: "#6366f1",
                        difficulty: "Intermediate",
                        estimatedTime: "4-6 weeks",
                        featured: true
                    },
                    {
                        id: "algorithms",
                        title: "Algorithms",
                        description: "Master algorithmic thinking with visual explanations",
                        icon: "🧩",
                        color: "#10b981",
                        difficulty: "All Levels",
                        estimatedTime: "6-8 weeks",
                        featured: true
                    },
                    {
                        id: "javascript",
                        title: "JavaScript",
                        description: "Modern JavaScript concepts explained visually",
                        icon: "📜",
                        color: "#f59e0b",
                        difficulty: "Beginner",
                        estimatedTime: "4 weeks",
                        featured: true
                    },
                    {
                        id: "react",
                        title: "React",
                        description: "Learn React concepts through visual stories",
                        icon: "⚛️",
                        color: "#3b82f6",
                        difficulty: "Intermediate",
                        estimatedTime: "5 weeks",
                        featured: true
                    }
                ];
            }
            
            if (categories && categories.length > 0) {
                categories.forEach(category => {
                    const card = this.createCategoryCard(category);
                    container.appendChild(card);
                });
            } else {
                const message = document.createElement('p');
                message.className = 'no-data-message';
                message.textContent = 'No categories available.';
                container.appendChild(message);
            }
        } catch (error) {
            console.error('Failed to render categories section:', error);
            const errorMessage = document.createElement('p');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Failed to load categories. Please try again later.';
            container.appendChild(errorMessage);
        }
        
        return container;
    }
    
    /**
     * Create a category card
     * @param {Object} category - Category data
     * @returns {HTMLElement} - The category card element
     */
    createCategoryCard(category) {
        const { id, title, description, icon, color, difficulty, estimatedTime, featured } = category;
        
        const card = document.createElement('div');
        card.className = `category-card${featured ? ' featured' : ''}`;
        card.dataset.categoryId = id;
        
        // Icon
        const iconElement = document.createElement('div');
        iconElement.className = 'category-icon';
        iconElement.style.backgroundColor = color || 'var(--primary-color)';
        iconElement.textContent = icon || '📚';
        card.appendChild(iconElement);
        
        // Title
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        card.appendChild(titleElement);
        
        // Description
        const descElement = document.createElement('p');
        descElement.textContent = description;
        card.appendChild(descElement);
        
        // Meta information
        const metaElement = document.createElement('div');
        metaElement.className = 'category-meta';
        
        if (difficulty) {
            const difficultyElement = document.createElement('span');
            difficultyElement.className = 'difficulty';
            difficultyElement.textContent = difficulty;
            metaElement.appendChild(difficultyElement);
        }
        
        if (estimatedTime) {
            const timeElement = document.createElement('span');
            timeElement.className = 'time';
            timeElement.textContent = estimatedTime;
            metaElement.appendChild(timeElement);
        }
        
        card.appendChild(metaElement);
        
        // Action button
        const buttonElement = document.createElement('a');
        buttonElement.className = 'btn-category';
        buttonElement.href = `category.html?id=${id}`;
        buttonElement.textContent = 'Explore';
        card.appendChild(buttonElement);
        
        // Add click event
        card.addEventListener('click', (e) => {
            // Prevent click if the button was clicked
            if (e.target === buttonElement) return;
            
            window.location.href = `category.html?id=${id}`;
        });
        
        return card;
    }
    
    /**
     * Render a features section
     * @returns {HTMLElement} - The rendered element
     */
    renderFeaturesSection() {
        const { items } = this.config;
        
        const container = document.createElement('div');
        container.className = 'features-grid';
        
        if (items && items.length > 0) {
            items.forEach(feature => {
                const featureCard = document.createElement('div');
                featureCard.className = 'feature-card';
                
                const iconElement = document.createElement('div');
                iconElement.className = 'feature-icon';
                iconElement.textContent = feature.icon || '✨';
                featureCard.appendChild(iconElement);
                
                const titleElement = document.createElement('h3');
                titleElement.textContent = feature.title;
                featureCard.appendChild(titleElement);
                
                const descElement = document.createElement('p');
                descElement.textContent = feature.description;
                featureCard.appendChild(descElement);
                
                container.appendChild(featureCard);
            });
        } else {
            const message = document.createElement('p');
            message.className = 'no-data-message';
            message.textContent = 'No features available.';
            container.appendChild(message);
        }
        
        return container;
    }
    
    /**
     * Render a steps section
     * @returns {HTMLElement} - The rendered element
     */
    renderStepsSection() {
        const { items, layout = 'timeline' } = this.config;
        
        const container = document.createElement('div');
        container.className = `steps-container layout-${layout}`;
        
        if (items && items.length > 0) {
            items.forEach(step => {
                const stepElement = document.createElement('div');
                stepElement.className = 'step';
                
                const numberElement = document.createElement('div');
                numberElement.className = 'step-number';
                numberElement.textContent = step.number || '';
                stepElement.appendChild(numberElement);
                
                const titleElement = document.createElement('h3');
                titleElement.textContent = step.title;
                stepElement.appendChild(titleElement);
                
                const descElement = document.createElement('p');
                descElement.textContent = step.description;
                stepElement.appendChild(descElement);
                
                container.appendChild(stepElement);
            });
        } else {
            const message = document.createElement('p');
            message.className = 'no-data-message';
            message.textContent = 'No steps available.';
            container.appendChild(message);
        }
        
        return container;
    }
    
    /**
     * Render a testimonials section
     * @returns {HTMLElement} - The rendered element
     */
    renderTestimonialsSection() {
        const { items } = this.config;
        
        const container = document.createElement('div');
        container.className = 'testimonials-container';
        
        if (items && items.length > 0) {
            // Create testimonial carousel
            const testimonialCard = document.createElement('div');
            testimonialCard.className = 'testimonial-card';
            
            // Use the first testimonial as default
            const testimonial = items[0];
            
            const quoteElement = document.createElement('div');
            quoteElement.className = 'testimonial-quote';
            quoteElement.textContent = testimonial.quote;
            testimonialCard.appendChild(quoteElement);
            
            const authorElement = document.createElement('div');
            authorElement.className = 'testimonial-author';
            
            if (testimonial.avatar) {
                const avatarElement = document.createElement('img');
                avatarElement.className = 'author-avatar';
                avatarElement.src = testimonial.avatar;
                avatarElement.alt = testimonial.name;
                authorElement.appendChild(avatarElement);
            }
            
            const authorInfoElement = document.createElement('div');
            authorInfoElement.className = 'author-info';
            
            const nameElement = document.createElement('div');
            nameElement.className = 'author-name';
            nameElement.textContent = testimonial.name;
            authorInfoElement.appendChild(nameElement);
            
            if (testimonial.role) {
                const roleElement = document.createElement('div');
                roleElement.className = 'author-role';
                roleElement.textContent = testimonial.role;
                authorInfoElement.appendChild(roleElement);
            }
            
            authorElement.appendChild(authorInfoElement);
            testimonialCard.appendChild(authorElement);
            
            container.appendChild(testimonialCard);
            
            // Add carousel controls if there are multiple testimonials
            if (items.length > 1) {
                const controlsElement = document.createElement('div');
                controlsElement.className = 'carousel-controls';
                
                const prevButton = document.createElement('button');
                prevButton.className = 'carousel-prev';
                prevButton.innerHTML = '&larr;';
                prevButton.setAttribute('aria-label', 'Previous testimonial');
                controlsElement.appendChild(prevButton);
                
                const dotsElement = document.createElement('div');
                dotsElement.className = 'carousel-dots';
                
                for (let i = 0; i < items.length; i++) {
                    const dotButton = document.createElement('button');
                    dotButton.className = `carousel-dot${i === 0 ? ' active' : ''}`;
                    dotButton.setAttribute('aria-label', `Testimonial ${i + 1}`);
                    dotsElement.appendChild(dotButton);
                }
                
                controlsElement.appendChild(dotsElement);
                
                const nextButton = document.createElement('button');
                nextButton.className = 'carousel-next';
                nextButton.innerHTML = '&rarr;';
                nextButton.setAttribute('aria-label', 'Next testimonial');
                controlsElement.appendChild(nextButton);
                
                container.appendChild(controlsElement);
            }
        } else {
            const message = document.createElement('p');
            message.className = 'no-data-message';
            message.textContent = 'No testimonials available.';
            container.appendChild(message);
        }
        
        return container;
    }
    
    /**
     * Render a CTA section
     * @returns {HTMLElement} - The rendered element
     */
    renderCtaSection() {
        const { title, subtitle, buttons } = this.config;
        
        const container = document.createElement('div');
        container.className = 'cta-container';
        
        if (title) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'cta-title';
            titleElement.textContent = title;
            container.appendChild(titleElement);
        }
        
        if (subtitle) {
            const subtitleElement = document.createElement('p');
            subtitleElement.className = 'cta-subtitle';
            subtitleElement.textContent = subtitle;
            container.appendChild(subtitleElement);
        }
        
        if (buttons && buttons.length > 0) {
            const buttonsElement = document.createElement('div');
            buttonsElement.className = 'cta-buttons';
            
            buttons.forEach(button => {
                const buttonElement = document.createElement('a');
                buttonElement.className = button.class || 'btn-cta-primary';
                buttonElement.href = button.url || '#';
                buttonElement.textContent = button.text;
                
                if (button.action) {
                    buttonElement.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (typeof window[button.action] === 'function') {
                            window[button.action]();
                        }
                    });
                }
                
                buttonsElement.appendChild(buttonElement);
            });
            
            container.appendChild(buttonsElement);
        }
        
        return container;
    }
    
    /**
     * Render a generic section
     * @returns {HTMLElement} - The rendered element
     */
    renderGenericSection() {
        const { items } = this.config;
        
        const container = document.createElement('div');
        container.className = 'generic-content';
        
        if (items && items.length > 0) {
            const itemsList = document.createElement('div');
            itemsList.className = 'generic-items';
            
            items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'generic-item';
                
                if (item.title) {
                    const titleElement = document.createElement('h3');
                    titleElement.textContent = item.title;
                    itemElement.appendChild(titleElement);
                }
                
                if (item.description) {
                    const descElement = document.createElement('p');
                    descElement.textContent = item.description;
                    itemElement.appendChild(descElement);
                }
                
                itemsList.appendChild(itemElement);
            });
            
            container.appendChild(itemsList);
        } else {
            const placeholderElement = document.createElement('p');
            placeholderElement.textContent = 'No content available for this section.';
            placeholderElement.style.textAlign = 'center';
            placeholderElement.style.color = 'var(--text-muted)';
            container.appendChild(placeholderElement);
        }
        
        return container;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add event listeners based on section type
        const { type } = this.config;
        
        switch (type) {
            case 'categories':
                this.setupCategoriesEventListeners();
                break;
            case 'testimonials':
                this.setupTestimonialsEventListeners();
                break;
        }
    }
    
    /**
     * Setup event listeners for categories section
     */
    setupCategoriesEventListeners() {
        if (!this.element) return;
        
        const categoryCards = this.element.querySelectorAll('.category-card');
        
        categoryCards.forEach(card => {
            this.addEventListener(card, 'click', (e) => {
                // Only handle clicks on the card itself, not on the button
                if (e.target.closest('.btn-category')) return;
                
                const categoryId = card.dataset.categoryId;
                window.location.href = `category.html?id=${categoryId}`;
            });
        });
    }
    
    /**
     * Setup event listeners for testimonials section
     */
    setupTestimonialsEventListeners() {
        if (!this.element) return;
        
        const prevButton = this.element.querySelector('.carousel-prev');
        const nextButton = this.element.querySelector('.carousel-next');
        const dots = this.element.querySelectorAll('.carousel-dot');
        
        if (prevButton) {
            this.addEventListener(prevButton, 'click', () => {
                this.showPreviousTestimonial();
            });
        }
        
        if (nextButton) {
            this.addEventListener(nextButton, 'click', () => {
                this.showNextTestimonial();
            });
        }
        
        dots.forEach((dot, index) => {
            this.addEventListener(dot, 'click', () => {
                this.showTestimonial(index);
            });
        });
    }
    
    /**
     * Show previous testimonial
     */
    showPreviousTestimonial() {
        const dots = this.element.querySelectorAll('.carousel-dot');
        const activeDotIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'));
        
        const newIndex = activeDotIndex > 0 ? activeDotIndex - 1 : dots.length - 1;
        this.showTestimonial(newIndex);
    }
    
    /**
     * Show next testimonial
     */
    showNextTestimonial() {
        const dots = this.element.querySelectorAll('.carousel-dot');
        const activeDotIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'));
        
        const newIndex = activeDotIndex < dots.length - 1 ? activeDotIndex + 1 : 0;
        this.showTestimonial(newIndex);
    }
    
    /**
     * Show testimonial by index
     * @param {number} index - Testimonial index
     */
    showTestimonial(index) {
        const { items } = this.config;
        if (!items || index >= items.length) return;
        
        const testimonial = items[index];
        const testimonialCard = this.element.querySelector('.testimonial-card');
        const dots = this.element.querySelectorAll('.carousel-dot');
        
        if (testimonialCard) {
            const quoteElement = testimonialCard.querySelector('.testimonial-quote');
            const nameElement = testimonialCard.querySelector('.author-name');
            const roleElement = testimonialCard.querySelector('.author-role');
            const avatarElement = testimonialCard.querySelector('.author-avatar');
            
            if (quoteElement) quoteElement.textContent = testimonial.quote;
            if (nameElement) nameElement.textContent = testimonial.name;
            if (roleElement) roleElement.textContent = testimonial.role || '';
            if (avatarElement && testimonial.avatar) avatarElement.src = testimonial.avatar;
            
            // Update active dot
            dots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Section;
}
