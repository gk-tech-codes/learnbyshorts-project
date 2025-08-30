/**
 * Homepage Service - Manages homepage configuration and data
 * Follows the Service pattern for data management
 */

class HomepageService {
    constructor() {
        this.config = null;
        this.isLoaded = false;
    }

    /**
     * Load homepage configuration
     */
    async loadConfig() {
        try {
            const response = await fetch('data/homepage.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.config = await response.json();
            this.isLoaded = true;
            return this.config;
        } catch (error) {
            console.error('Failed to load homepage config:', error);
            throw error;
        }
    }

    /**
     * Get homepage configuration
     */
    async getConfig() {
        if (!this.isLoaded) {
            await this.loadConfig();
        }
        return this.config;
    }

    /**
     * Get hero section configuration
     */
    async getHeroConfig() {
        const config = await this.getConfig();
        return config.hero;
    }

    /**
     * Get sections configuration
     */
    async getSectionsConfig() {
        const config = await this.getConfig();
        return config.sections;
    }

    /**
     * Get demo configuration
     */
    async getDemoConfig() {
        const config = await this.getConfig();
        return config.demo;
    }

    /**
     * Update configuration (for future admin panel)
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // In a real application, this would save to backend
        console.log('Configuration updated:', this.config);
    }

    /**
     * Get visible stats for hero section
     */
    async getVisibleStats() {
        const heroConfig = await this.getHeroConfig();
        const stats = [];
        
        Object.entries(heroConfig.stats).forEach(([key, stat]) => {
            if (stat.visible) {
                stats.push({
                    key,
                    number: stat.number,
                    label: stat.label
                });
            }
        });
        
        return stats;
    }

    /**
     * Get visible buttons for hero section
     */
    async getVisibleButtons() {
        const heroConfig = await this.getHeroConfig();
        const buttons = [];
        
        Object.entries(heroConfig.buttons).forEach(([key, button]) => {
            if (button.visible) {
                buttons.push({
                    key,
                    text: button.text,
                    action: button.action,
                    type: key
                });
            }
        });
        
        return buttons;
    }

    /**
     * Get visible sections
     */
    async getVisibleSections() {
        const sectionsConfig = await this.getSectionsConfig();
        const visibleSections = {};
        
        Object.entries(sectionsConfig).forEach(([key, section]) => {
            if (section.visible) {
                visibleSections[key] = section;
            }
        });
        
        return visibleSections;
    }

    /**
     * Format number for display (e.g., 1000 -> 1K)
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
     * Get formatted stats for display
     */
    async getFormattedStats() {
        const stats = await this.getVisibleStats();
        return stats.map(stat => ({
            ...stat,
            displayNumber: this.formatNumber(stat.number)
        }));
    }
}

// Create singleton instance
const homepageService = new HomepageService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomepageService;
}
