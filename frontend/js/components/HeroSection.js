/**
 * HeroSection Component
 * Renders the hero section of the homepage
 */
class HeroSection extends Component {
    /**
     * Create a new hero section component
     * @param {Object} config - Hero section configuration
     * @param {HTMLElement|string} container - Container element or selector
     */
    constructor(config = {}, container = null) {
        super(config, container);
        this.init();
    }

    /**
     * Initialize the component
     * @returns {HeroSection} - The component instance for chaining
     */
    init() {
        // Default configuration
        this.config = {
            layout: 'split',
            background: {
                type: 'gradient',
                value: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
            },
            content: {
                title: 'Welcome to LearnByShorts',
                description: 'Learn programming through visual stories',
                alignment: 'left'
            },
            stats: [],
            buttons: [],
            visual: {
                type: 'image',
                source: '',
                alt: '',
                visible: false
            },
            ...this.config
        };
        
        return this;
    }

    /**
     * Render the hero section
     * @returns {HTMLElement} - The rendered element
     */
    render() {
        const { layout, background, content, stats, buttons, visual } = this.config;
        
        // Create hero container with background
        const heroElement = document.createElement('section');
        heroElement.className = `hero hero-${layout}`;
        
        if (background) {
            if (background.type === 'gradient' || background.type === 'color') {
                heroElement.style.background = background.value;
            } else if (background.type === 'image') {
                heroElement.style.backgroundImage = `url(${background.value})`;
                heroElement.style.backgroundSize = 'cover';
                heroElement.style.backgroundPosition = 'center';
            }
        }
        
        // Create hero content
        const heroContainer = document.createElement('div');
        heroContainer.className = 'hero-container';
        
        // Content section
        const heroContent = document.createElement('div');
        heroContent.className = `hero-content align-${content.alignment || 'left'}`;
        
        // Title
        const heroTitle = document.createElement('h1');
        heroTitle.className = 'hero-title';
        heroTitle.innerHTML = content.title;
        
        // Description
        const heroDescription = document.createElement('p');
        heroDescription.className = 'hero-description';
        heroDescription.innerHTML = content.description;
        
        // Add title and description to content
        heroContent.appendChild(heroTitle);
        heroContent.appendChild(heroDescription);
        
        // Stats section if available
        if (stats && stats.length > 0) {
            const heroStats = document.createElement('div');
            heroStats.className = 'hero-stats';
            
            stats.forEach(stat => {
                if (stat.visible) {
                    const statElement = document.createElement('div');
                    statElement.className = 'stat';
                    statElement.innerHTML = `
                        <span class="stat-number">${this.formatNumber(stat.number)}</span>
                        <span class="stat-label">${stat.label}</span>
                    `;
                    heroStats.appendChild(statElement);
                }
            });
            
            heroContent.appendChild(heroStats);
        }
        
        // Buttons section if available
        if (buttons && buttons.length > 0) {
            const heroButtons = document.createElement('div');
            heroButtons.className = 'hero-buttons';
            
            buttons.forEach(button => {
                if (button.visible) {
                    const buttonElement = document.createElement('button');
                    buttonElement.className = button.class || 'btn-primary';
                    buttonElement.textContent = button.text;
                    buttonElement.dataset.action = button.action;
                    
                    heroButtons.appendChild(buttonElement);
                }
            });
            
            heroContent.appendChild(heroButtons);
        }
        
        // Add content to container
        heroContainer.appendChild(heroContent);
        
        // Visual section if enabled
        if (visual && visual.visible) {
            const heroVisual = document.createElement('div');
            heroVisual.className = 'hero-visual';
            
            if (visual.type === 'image' && visual.source) {
                const image = document.createElement('img');
                image.src = visual.source;
                image.alt = visual.alt || 'Hero visual';
                heroVisual.appendChild(image);
            } else if (visual.type === 'video' && visual.source) {
                const video = document.createElement('video');
                video.src = visual.source;
                video.controls = false;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                heroVisual.appendChild(video);
            }
            
            heroContainer.appendChild(heroVisual);
        }
        
        // Add container to hero
        heroElement.appendChild(heroContainer);
        
        this.element = heroElement;
        return this.element;
    }

    /**
     * Format number for display (e.g., 1000 -> 1K)
     * @param {number} num - Number to format
     * @returns {string} - Formatted number
     */
    formatNumber(num) {
        if (num === 0) return '0';
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num.toString();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.element) return;
        
        // Add click handlers for buttons
        const buttons = this.element.querySelectorAll('.hero-buttons button');
        buttons.forEach(button => {
            this.addEventListener(button, 'click', (e) => {
                const action = button.dataset.action;
                if (action) {
                    this.handleButtonClick(action);
                }
            });
        });
    }

    /**
     * Handle button clicks
     * @param {string} action - Button action
     */
    handleButtonClick(action) {
        switch (action) {
            case 'scrollToCategories':
                this.scrollToElement('#categories');
                break;
            case 'viewShorts':
                window.location.href = 'shorts.html';
                break;
            case 'signup':
                // Handle signup action
                break;
            case 'login':
                // Handle login action
                break;
            default:
                console.log('Unknown action:', action);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroSection;
}
