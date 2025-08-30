/**
 * Base Component Class
 * Foundation for all UI components with lifecycle methods
 */
class Component {
    /**
     * Create a new component
     * @param {Object} config - Component configuration
     * @param {HTMLElement|string} container - Container element or selector
     */
    constructor(config = {}, container = null) {
        this.config = config;
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        this.element = null;
        this.children = [];
        this.eventListeners = [];
        this.isRendered = false;
    }

    /**
     * Initialize the component
     * @returns {Component} - The component instance for chaining
     */
    init() {
        // Override in subclasses
        return this;
    }

    /**
     * Render the component
     * @returns {HTMLElement} - The rendered element
     */
    render() {
        // Override in subclasses
        return this.element;
    }

    /**
     * Update the component with new data
     * @param {Object} newConfig - New configuration data
     * @returns {Component} - The component instance for chaining
     */
    update(newConfig = {}) {
        this.config = { ...this.config, ...newConfig };
        if (this.isRendered) {
            this.refresh();
        }
        return this;
    }

    /**
     * Refresh the component's DOM
     * @returns {Component} - The component instance for chaining
     */
    refresh() {
        if (this.element && this.element.parentNode) {
            const newElement = this.render();
            this.element.parentNode.replaceChild(newElement, this.element);
            this.element = newElement;
            this.setupEventListeners();
        }
        return this;
    }

    /**
     * Create an HTML element from HTML string
     * @param {string} html - HTML string
     * @returns {HTMLElement} - Created element
     */
    createElementFromHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    }

    /**
     * Add a child component
     * @param {Component} component - Child component to add
     * @param {string} selector - Selector for where to append the child
     * @returns {Component} - The component instance for chaining
     */
    addChild(component, selector = null) {
        this.children.push({ component, selector });
        
        if (this.isRendered && component) {
            const target = selector ? this.element.querySelector(selector) : this.element;
            if (target) {
                const childElement = component.render();
                if (childElement) {
                    target.appendChild(childElement);
                }
            }
        }
        
        return this;
    }

    /**
     * Add event listener with automatic cleanup
     * @param {HTMLElement} element - Element to attach listener to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) return;
        
        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Override in subclasses
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            if (element) {
                element.removeEventListener(event, handler, options);
            }
        });
        this.eventListeners = [];
    }

    /**
     * Mount component to container
     * @param {HTMLElement|string} container - Container element or selector
     * @returns {Component} - The component instance for chaining
     */
    mount(container = null) {
        if (container) {
            this.container = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;
        }
        
        if (!this.container) {
            console.error('No container provided for component');
            return this;
        }
        
        if (!this.element) {
            this.element = this.render();
        }
        
        if (this.element) {
            this.container.appendChild(this.element);
            this.isRendered = true;
            this.setupEventListeners();
            
            // Mount children
            this.children.forEach(({ component, selector }) => {
                const target = selector ? this.element.querySelector(selector) : this.element;
                if (target && component) {
                    component.mount(target);
                }
            });
        }
        
        return this;
    }

    /**
     * Unmount component from DOM
     */
    unmount() {
        // Unmount children first
        this.children.forEach(({ component }) => {
            if (component) {
                component.unmount();
            }
        });
        
        this.removeEventListeners();
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.isRendered = false;
    }

    /**
     * Destroy component and clean up resources
     */
    destroy() {
        this.unmount();
        this.children = [];
        this.config = null;
        this.container = null;
        this.element = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Component;
}
