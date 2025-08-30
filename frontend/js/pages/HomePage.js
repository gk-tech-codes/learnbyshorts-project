/**
 * HomePage Controller - Component-Based Implementation
 * Manages the homepage using reusable components
 */

class HomePage {
    constructor() {
        this.components = new Map();
        this.config = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the homepage
     */
    async init() {
        try {
            console.log('HomePage init started');
            
            // Skip config manager for now - use default config
            this.config = {
                courses: {
                    featured: ['singleton-pattern', 'factory-method-pattern'],
                    categories: ['design-patterns']
                }
            };
            console.log('Homepage config loaded:', this.config);
            
            if (!this.config) {
                console.error('Homepage configuration not found');
                this.config = this.getDefaultConfig();
                console.log('Using default config:', this.config);
            }
            
            // Render the page
            await this.renderPage();
            
            // Setup global event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('Homepage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize homepage:', error);
            this.showError('Failed to initialize the page. Please refresh and try again.');
        }
    }

    /**
     * Get default configuration as fallback
     */
    getDefaultConfig() {
        return {
            meta: {
                title: 'LearnByShorts - Master Programming Through Visual Stories',
                description: 'Transform your software development skills with engaging narratives.'
            },
            header: {
                logo: {
                    text: 'LearnByShorts',
                    tagline: 'Master Programming Through Stories'
                },
                navigation: [
                    { id: 'home', text: 'Home', url: 'index.html', active: true },
                    { id: 'shorts', text: 'Shorts', url: 'shorts.html' },
                    { id: 'categories', text: 'Categories', url: '#categories' }
                ],
                buttons: [
                    { id: 'login', text: 'Login', class: 'btn-login', action: 'login' }
                ]
            },
            hero: {
                enabled: true,
                content: {
                    title: 'Master Programming Through Visual Stories',
                    description: 'Transform your software development skills with engaging narratives.'
                },
                buttons: [
                    { id: 'primary', text: 'Start Learning', class: 'btn-primary', action: 'scrollToCategories', visible: true }
                ]
            },
            sections: [
                {
                    id: 'categories',
                    type: 'categories',
                    enabled: true,
                    title: 'Learning Categories',
                    subtitle: 'Choose your path to mastery',
                    dataSource: 'categories'
                }
            ],
            footer: {
                logo: {
                    text: 'LearnByShorts',
                    tagline: 'Revolutionizing programming education through visual storytelling'
                },
                copyright: '&copy; 2024 LearnByShorts. All rights reserved.'
            }
        };
    }

    /**
     * Render the entire page
     */
    async renderPage() {
        console.log('Starting to render page...');
        
        try {
            // Set page metadata
            this.setPageMetadata();
            console.log('Page metadata set');
            
            // Render header
            await this.renderHeader();
            console.log('Header rendered');
            
            // Render hero section
            await this.renderHero();
            console.log('Hero section rendered');
            
            // Render content sections
            await this.renderSections();
            console.log('Content sections rendered');
            
            // Render footer
            await this.renderFooter();
            console.log('Footer rendered');
            
            // Add a visible element to confirm rendering
            const debugElement = document.createElement('div');
            debugElement.style.position = 'fixed';
            debugElement.style.bottom = '10px';
            debugElement.style.right = '10px';
            debugElement.style.padding = '10px';
            debugElement.style.background = 'rgba(0,0,0,0.7)';
            debugElement.style.color = 'white';
            debugElement.style.borderRadius = '5px';
            debugElement.style.zIndex = '9999';
            debugElement.textContent = 'Page rendered successfully';
            document.body.appendChild(debugElement);
            
            console.log('Page rendering complete');
        } catch (error) {
            console.error('Error during page rendering:', error);
            
            // Add error message to the page
            const errorElement = document.createElement('div');
            errorElement.style.maxWidth = '800px';
            errorElement.style.margin = '50px auto';
            errorElement.style.padding = '20px';
            errorElement.style.backgroundColor = '#fee2e2';
            errorElement.style.color = '#ef4444';
            errorElement.style.borderRadius = '8px';
            errorElement.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            errorElement.innerHTML = `
                <h2>Error Rendering Page</h2>
                <p>${error.message}</p>
                <pre>${error.stack}</pre>
            `;
            document.body.appendChild(errorElement);
        }
    }

    /**
     * Set page metadata
     */
    setPageMetadata() {
        const { meta } = this.config;
        
        if (meta) {
            // Set page title
            if (meta.title) {
                document.title = meta.title;
            }
            
            // Set meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription && meta.description) {
                metaDescription.setAttribute('content', meta.description);
            } else if (meta.description) {
                const newMetaDescription = document.createElement('meta');
                newMetaDescription.name = 'description';
                newMetaDescription.content = meta.description;
                document.head.appendChild(newMetaDescription);
            }
            
            // Set meta keywords
            if (meta.keywords) {
                const metaKeywords = document.querySelector('meta[name="keywords"]');
                if (metaKeywords) {
                    metaKeywords.setAttribute('content', meta.keywords);
                } else {
                    const newMetaKeywords = document.createElement('meta');
                    newMetaKeywords.name = 'keywords';
                    newMetaKeywords.content = meta.keywords;
                    document.head.appendChild(newMetaKeywords);
                }
            }
        }
    }

    /**
     * Render header component
     */
    async renderHeader() {
        console.log('Rendering header...');
        // Header is already in HTML, no need to render dynamically
        console.log('Header already exists in HTML');
        return Promise.resolve();
    }

    /**
     * Render hero section
     */
    async renderHero() {
        console.log('Rendering hero section...');
        // Hero section already exists in HTML, no need to render dynamically
        console.log('Hero section already exists in HTML');
        return Promise.resolve();
    }

    /**
     * Render content sections
     */
    async renderSections() {
        console.log('Rendering content sections...');
        
        // Default sections config
        const defaultSectionsConfig = [
            {
                id: 'categories',
                type: 'categories',
                enabled: true,
                title: 'Choose Your Learning Path',
                subtitle: 'Select a programming topic and start your journey',
                dataSource: 'categories'
            },
            {
                id: 'features',
                type: 'features',
                enabled: true,
                title: 'Why Choose LearnByShorts?',
                items: [
                    {
                        icon: "🎯",
                        title: "Focused Learning",
                        description: "Each concept broken into digestible 2-10 second visual stories"
                    },
                    {
                        icon: "📚",
                        title: "Story-Based",
                        description: "Complex programming concepts explained through engaging narratives"
                    },
                    {
                        icon: "⚡",
                        title: "Quick Progress",
                        description: "Learn faster with our scientifically designed micro-learning approach"
                    },
                    {
                        icon: "🎨",
                        title: "Visual Learning",
                        description: "Rich visuals and animations make abstract concepts concrete"
                    }
                ]
            }
        ];
        
        // Use sections config from this.config if available, otherwise use default
        const sections = (this.config && this.config.sections) ? 
            Object.values(this.config.sections) : defaultSectionsConfig;
        
        if (!this.config || !this.config.sections) {
            console.warn('No sections configuration found in config, using default');
            console.log('Using default sections config:', defaultSectionsConfig);
        } else {
            console.log('Using sections config from config:', sections);
        }
        
        // Get main content container or create one
        let mainContent = document.querySelector('main.main-content');
        if (!mainContent) {
            console.log('Creating main content container');
            mainContent = document.createElement('main');
            mainContent.className = 'main-content';
            
            const hero = document.querySelector('section.hero');
            if (hero && hero.nextSibling) {
                document.body.insertBefore(mainContent, hero.nextSibling);
            } else {
                const header = document.querySelector('header.header');
                if (header && header.nextSibling) {
                    document.body.insertBefore(mainContent, header.nextSibling);
                } else {
                    document.body.appendChild(mainContent);
                }
            }
        } else {
            console.log('Found existing main content container');
        }
        
        // Clear existing content
        mainContent.innerHTML = '';
        
        // Render each section
        for (const sectionConfig of sections) {
            if (sectionConfig && (sectionConfig.enabled !== false)) {
                console.log('Rendering section:', sectionConfig.id || 'unnamed section');
                const section = new Section(sectionConfig);
                this.components.set(`section-${sectionConfig.id || 'unnamed'}`, section);
                section.mount(mainContent);
                console.log('Section mounted:', sectionConfig.id || 'unnamed section');
            }
        }
    }

    /**
     * Render footer component
     */
    async renderFooter() {
        console.log('Rendering footer...');
        
        // Default footer config
        const defaultFooterConfig = {
            logo: {
                text: 'LearnByShorts',
                tagline: 'Revolutionizing programming education through visual storytelling'
            },
            copyright: '&copy; 2024 LearnByShorts. All rights reserved.'
        };
        
        // Use footer config from this.config if available, otherwise use default
        const footerConfig = this.config && this.config.footer ? this.config.footer : defaultFooterConfig;
        
        if (!this.config || !this.config.footer) {
            console.warn('No footer configuration found in config, using default');
            console.log('Using default footer config:', defaultFooterConfig);
        } else {
            console.log('Using footer config from config:', footerConfig);
        }
        
        const footer = new Footer(footerConfig);
        this.components.set('footer', footer);
        
        // Find or create footer container
        let footerContainer = document.querySelector('footer.footer');
        if (!footerContainer) {
            console.log('Creating footer container');
            footerContainer = document.createElement('footer');
            footerContainer.className = 'footer';
            document.body.appendChild(footerContainer);
        } else {
            console.log('Found existing footer container');
        }
        
        console.log('Mounting footer component');
        footer.mount(footerContainer);
        console.log('Footer component mounted');
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, UI_CONFIG.DEBOUNCE_DELAY));
        
        // Scroll animations
        this.setupScrollAnimations();
        
        // Global action handlers
        window.scrollToCategories = () => this.scrollToElement('#categories');
        window.viewShorts = () => window.location.href = 'shorts.html';
    }

    /**
     * Setup scroll animations
     */
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, {
            threshold: 0.1
        });
        
        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Recalculate layouts if needed
        const width = window.innerWidth;
        
        if (width <= UI_CONFIG.BREAKPOINTS.MOBILE) {
            document.body.classList.add('mobile-view');
            document.body.classList.remove('tablet-view', 'desktop-view');
        } else if (width <= UI_CONFIG.BREAKPOINTS.TABLET) {
            document.body.classList.add('tablet-view');
            document.body.classList.remove('mobile-view', 'desktop-view');
        } else {
            document.body.classList.add('desktop-view');
            document.body.classList.remove('mobile-view', 'tablet-view');
        }
    }

    /**
     * Scroll to element
     * @param {string} selector - Element selector
     */
    scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="btn-retry" onclick="location.reload()">Refresh Page</button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    }

    /**
     * Debounce utility function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
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
    destroy() {
        // Destroy all components
        this.components.forEach(component => {
            component.destroy();
        });
        
        this.components.clear();
        
        // Remove global handlers
        window.scrollToCategories = null;
        window.viewShorts = null;
    }
}

// Initialize homepage when script loads
let homePage;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        homePage = new HomePage();
        window.homePage = homePage;
    });
} else {
    homePage = new HomePage();
    window.homePage = homePage;
}
