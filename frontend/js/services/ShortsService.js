/**
 * Shorts Service - Manages shorts data and interactions
 * Handles loading, navigation, and state management for shorts
 */

class ShortsService {
    constructor() {
        this.shorts = [];
        this.currentIndex = 0;
        this.isLoaded = false;
        this.observers = {};
    }

    /**
     * Load shorts data from JSON file
     */
    async loadShorts() {
        try {
            const response = await fetch('data/shorts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.shorts = data.shorts;
            this.isLoaded = true;
            this.notifyObservers('shortsLoaded', this.shorts);
            return this.shorts;
        } catch (error) {
            console.error('Failed to load shorts:', error);
            this.notifyObservers('error', { message: 'Failed to load shorts' });
            throw error;
        }
    }

    /**
     * Get all shorts
     */
    async getShorts() {
        if (!this.isLoaded) {
            await this.loadShorts();
        }
        return this.shorts;
    }

    /**
     * Get current short
     */
    getCurrentShort() {
        return this.shorts[this.currentIndex] || null;
    }

    /**
     * Get short by ID
     */
    getShortById(id) {
        return this.shorts.find(short => short.id === id) || null;
    }

    /**
     * Navigate to next short
     */
    nextShort() {
        if (this.currentIndex < this.shorts.length - 1) {
            this.currentIndex++;
            this.notifyObservers('shortChanged', {
                current: this.getCurrentShort(),
                index: this.currentIndex,
                direction: 'next'
            });
            return true;
        }
        return false;
    }

    /**
     * Navigate to previous short
     */
    previousShort() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.notifyObservers('shortChanged', {
                current: this.getCurrentShort(),
                index: this.currentIndex,
                direction: 'previous'
            });
            return true;
        }
        return false;
    }

    /**
     * Navigate to specific short by index
     */
    goToShort(index) {
        if (index >= 0 && index < this.shorts.length) {
            const oldIndex = this.currentIndex;
            this.currentIndex = index;
            this.notifyObservers('shortChanged', {
                current: this.getCurrentShort(),
                index: this.currentIndex,
                direction: index > oldIndex ? 'next' : 'previous'
            });
            return true;
        }
        return false;
    }

    /**
     * Get shorts by category
     */
    getShortsByCategory(category) {
        return this.shorts.filter(short => short.category === category);
    }

    /**
     * Search shorts by title or tags
     */
    searchShorts(query) {
        const searchTerm = query.toLowerCase();
        return this.shorts.filter(short => 
            short.title.toLowerCase().includes(searchTerm) ||
            short.description.toLowerCase().includes(searchTerm) ||
            short.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    /**
     * Get total shorts count
     */
    getTotalCount() {
        return this.shorts.length;
    }

    /**
     * Get current index
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * Check if there's a next short
     */
    hasNext() {
        return this.currentIndex < this.shorts.length - 1;
    }

    /**
     * Check if there's a previous short
     */
    hasPrevious() {
        return this.currentIndex > 0;
    }

    /**
     * Get navigation info
     */
    getNavigationInfo() {
        return {
            current: this.currentIndex,
            total: this.shorts.length,
            hasNext: this.hasNext(),
            hasPrevious: this.hasPrevious(),
            progress: ((this.currentIndex + 1) / this.shorts.length) * 100
        };
    }

    /**
     * Subscribe to events
     */
    subscribe(event, callback) {
        if (!this.observers[event]) {
            this.observers[event] = [];
        }
        this.observers[event].push(callback);
    }

    /**
     * Unsubscribe from events
     */
    unsubscribe(event, callback) {
        if (this.observers[event]) {
            this.observers[event] = this.observers[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Notify observers
     */
    notifyObservers(event, data) {
        if (this.observers[event]) {
            this.observers[event].forEach(callback => callback(data));
        }
    }

    /**
     * Track analytics for short interaction
     */
    trackShortView(shortId) {
        // Analytics implementation
        console.log('Short viewed:', shortId);
        this.notifyObservers('shortViewed', { shortId, timestamp: Date.now() });
    }

    /**
     * Track analytics for detail page navigation
     */
    trackDetailNavigation(shortId) {
        // Analytics implementation
        console.log('Detail page accessed:', shortId);
        this.notifyObservers('detailAccessed', { shortId, timestamp: Date.now() });
    }

    /**
     * Get recommended shorts based on current short
     */
    getRecommendedShorts(currentShortId, limit = 3) {
        const currentShort = this.getShortById(currentShortId);
        if (!currentShort) return [];

        // Simple recommendation based on same category and tags
        const recommendations = this.shorts
            .filter(short => short.id !== currentShortId)
            .map(short => {
                let score = 0;
                
                // Same category gets higher score
                if (short.category === currentShort.category) {
                    score += 3;
                }
                
                // Common tags increase score
                const commonTags = short.tags.filter(tag => 
                    currentShort.tags.includes(tag)
                ).length;
                score += commonTags;
                
                // Same difficulty level
                if (short.difficulty === currentShort.difficulty) {
                    score += 1;
                }
                
                return { ...short, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return recommendations;
    }

    /**
     * Reset to first short
     */
    reset() {
        this.currentIndex = 0;
        this.notifyObservers('shortChanged', {
            current: this.getCurrentShort(),
            index: this.currentIndex,
            direction: 'reset'
        });
    }

    /**
     * Shuffle shorts order
     */
    shuffle() {
        for (let i = this.shorts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shorts[i], this.shorts[j]] = [this.shorts[j], this.shorts[i]];
        }
        this.reset();
        this.notifyObservers('shortsShuffled', this.shorts);
    }

    /**
     * Get shorts statistics
     */
    getStatistics() {
        const categories = {};
        const difficulties = {};
        
        this.shorts.forEach(short => {
            categories[short.category] = (categories[short.category] || 0) + 1;
            difficulties[short.difficulty] = (difficulties[short.difficulty] || 0) + 1;
        });

        return {
            total: this.shorts.length,
            categories,
            difficulties,
            averageDuration: this.calculateAverageDuration()
        };
    }

    /**
     * Calculate average reading duration
     */
    calculateAverageDuration() {
        const durations = this.shorts.map(short => {
            const match = short.duration.match(/(\d+)/);
            return match ? parseInt(match[1]) : 3;
        });
        
        const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
        return Math.round(average);
    }
}

// Create singleton instance
const shortsService = new ShortsService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShortsService;
}
