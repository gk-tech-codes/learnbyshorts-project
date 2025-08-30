/**
 * Footer Component
 * Renders the site footer
 */
class Footer extends Component {
    /**
     * Create a new footer component
     * @param {Object} config - Footer configuration
     * @param {HTMLElement|string} container - Container element or selector
     */
    constructor(config = {}, container = null) {
        super(config, container);
        this.init();
    }

    /**
     * Initialize the component
     * @returns {Footer} - The component instance for chaining
     */
    init() {
        // Default configuration
        this.config = {
            logo: {
                text: 'LearnByShorts',
                tagline: 'Revolutionizing programming education through visual storytelling'
            },
            sections: [],
            social: [],
            copyright: '&copy; 2024 LearnByShorts. All rights reserved.',
            ...this.config
        };
        
        return this;
    }

    /**
     * Render the footer
     * @returns {HTMLElement} - The rendered element
     */
    render() {
        const { logo, sections, social, copyright } = this.config;
        
        // Create footer element
        const footerElement = document.createElement('footer');
        footerElement.className = 'footer';
        
        // Create container
        const container = document.createElement('div');
        container.className = 'container';
        
        // Footer content
        const footerContent = document.createElement('div');
        footerContent.className = 'footer-content';
        
        // Logo section
        const logoSection = document.createElement('div');
        logoSection.className = 'footer-section';
        
        const logoTitle = document.createElement('h3');
        logoTitle.textContent = logo.text;
        logoSection.appendChild(logoTitle);
        
        if (logo.tagline) {
            const tagline = document.createElement('p');
            tagline.textContent = logo.tagline;
            logoSection.appendChild(tagline);
        }
        
        footerContent.appendChild(logoSection);
        
        // Footer sections
        if (sections && sections.length > 0) {
            sections.forEach(section => {
                const sectionElement = document.createElement('div');
                sectionElement.className = 'footer-section';
                
                const sectionTitle = document.createElement('h4');
                sectionTitle.textContent = section.title;
                sectionElement.appendChild(sectionTitle);
                
                if (section.links && section.links.length > 0) {
                    const linksList = document.createElement('ul');
                    
                    section.links.forEach(link => {
                        const listItem = document.createElement('li');
                        const linkElement = document.createElement('a');
                        linkElement.href = link.url;
                        linkElement.textContent = link.text;
                        listItem.appendChild(linkElement);
                        linksList.appendChild(listItem);
                    });
                    
                    sectionElement.appendChild(linksList);
                }
                
                footerContent.appendChild(sectionElement);
            });
        }
        
        container.appendChild(footerContent);
        
        // Social media links
        if (social && social.length > 0) {
            const socialSection = document.createElement('div');
            socialSection.className = 'footer-social';
            
            social.forEach(item => {
                const socialLink = document.createElement('a');
                socialLink.href = item.url;
                socialLink.className = `social-icon ${item.platform}`;
                socialLink.setAttribute('aria-label', item.platform);
                socialLink.innerHTML = `<i class="icon-${item.icon || item.platform}"></i>`;
                socialSection.appendChild(socialLink);
            });
            
            container.appendChild(socialSection);
        }
        
        // Copyright
        const footerBottom = document.createElement('div');
        footerBottom.className = 'footer-bottom';
        
        const copyrightText = document.createElement('p');
        copyrightText.innerHTML = copyright;
        footerBottom.appendChild(copyrightText);
        
        container.appendChild(footerBottom);
        footerElement.appendChild(container);
        
        this.element = footerElement;
        return this.element;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // No specific event listeners for footer
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Footer;
}
