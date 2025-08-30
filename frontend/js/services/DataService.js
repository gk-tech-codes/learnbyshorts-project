/**
 * DataService - Singleton Pattern Implementation
 * Handles all data operations with caching and error handling
 */

class DataService {
    constructor() {
        if (DataService.instance) {
            return DataService.instance;
        }
        
        this.cache = new Map();
        this.observers = new Map();
        this.isLoading = false;
        
        // Default data for when API requests fail
        this.defaultData = {
            categories: [
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
                },
                {
                    id: "python",
                    title: "Python",
                    description: "Python programming through visual narratives",
                    icon: "🐍",
                    color: "#8b5cf6",
                    difficulty: "Beginner",
                    estimatedTime: "4 weeks",
                    featured: false
                },
                {
                    id: "data-structures",
                    title: "Data Structures",
                    description: "Visualize and understand complex data structures",
                    icon: "🏗️",
                    color: "#ec4899",
                    difficulty: "Intermediate",
                    estimatedTime: "6 weeks",
                    featured: false
                },
                {
                    id: "system-design",
                    title: "System Design",
                    description: "Learn to design scalable systems through visual stories",
                    icon: "🏢",
                    color: "#14b8a6",
                    difficulty: "Advanced",
                    estimatedTime: "8 weeks",
                    featured: false
                },
                {
                    id: "web-security",
                    title: "Web Security",
                    description: "Understand web security concepts visually",
                    icon: "🔒",
                    color: "#f43f5e",
                    difficulty: "Intermediate",
                    estimatedTime: "4 weeks",
                    featured: false
                }
            ],
            courses: [
                {
                    id: "singleton-pattern",
                    title: "Singleton Pattern",
                    description: "Learn the Singleton design pattern through a visual story about a kingdom with one ruler.",
                    categoryId: "design-patterns",
                    difficulty: "Beginner",
                    duration: "15 minutes",
                    author: "Design Patterns Team",
                    tags: ["design patterns", "singleton", "creational pattern"]
                },
                {
                    id: "factory-method",
                    title: "Factory Method Pattern",
                    description: "Understand the Factory Method pattern through a story about a magical toy workshop.",
                    categoryId: "design-patterns",
                    difficulty: "Intermediate",
                    duration: "20 minutes",
                    author: "Design Patterns Team",
                    tags: ["design patterns", "factory method", "creational pattern"]
                },
                {
                    id: "binary-search",
                    title: "Binary Search Algorithm",
                    description: "Master the binary search algorithm through a story about finding a book in a magical library.",
                    categoryId: "algorithms",
                    difficulty: "Beginner",
                    duration: "15 minutes",
                    author: "Algorithm Masters",
                    tags: ["algorithms", "binary search", "searching"]
                },
                {
                    id: "quicksort",
                    title: "Quicksort Algorithm",
                    description: "Learn the quicksort algorithm through a story about organizing a chaotic art gallery.",
                    categoryId: "algorithms",
                    difficulty: "Intermediate",
                    duration: "25 minutes",
                    author: "Algorithm Masters",
                    tags: ["algorithms", "quicksort", "sorting"]
                }
            ]
        };
        
        DataService.instance = this;
    }

    /**
     * Subscribe to data changes (Observer Pattern)
     */
    subscribe(event, callback) {
        if (!this.observers.has(event)) {
            this.observers.set(event, []);
        }
        this.observers.get(event).push(callback);
    }

    /**
     * Unsubscribe from data changes
     */
    unsubscribe(event, callback) {
        if (this.observers.has(event)) {
            const callbacks = this.observers.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Notify observers (Observer Pattern)
     */
    notify(event, data) {
        if (this.observers.has(event)) {
            this.observers.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Observer callback error:', error);
                }
            });
        }
    }

    /**
     * Check if data is cached and not expired
     */
    isCacheValid(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        
        const now = Date.now();
        return (now - cached.timestamp) < CACHE_CONFIG.EXPIRY_TIME;
    }

    /**
     * Get data from cache
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        return cached ? cached.data : null;
    }

    /**
     * Set data in cache
     */
    setCache(key, data) {
        // Implement LRU cache eviction if needed
        if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Generic fetch method with error handling and caching
     */
    async fetchData(url, cacheKey = null) {
        try {
            // Check cache first
            if (cacheKey && this.isCacheValid(cacheKey)) {
                return this.getFromCache(cacheKey);
            }

            this.notify(EVENTS.LOADING_START, { url });
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the data
            if (cacheKey) {
                this.setCache(cacheKey, data);
            }

            this.notify(EVENTS.LOADING_END, { url, success: true });
            return data;

        } catch (error) {
            this.notify(EVENTS.LOADING_END, { url, success: false });
            this.notify(EVENTS.ERROR_OCCURRED, {
                message: this.getErrorMessage(error),
                url,
                error
            });
            throw error;
        }
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        if (error.name === 'AbortError') {
            return 'Request timed out. Please try again.';
        }
        if (error.message.includes('Failed to fetch')) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }
        return ERROR_MESSAGES.DATA_LOAD_ERROR;
    }

    /**
     * Get all categories
     */
    async getCategories() {
        try {
            const data = await this.fetchData(API_CONFIG.ENDPOINTS.CATEGORIES, 'categories');
            this.notify(EVENTS.DATA_LOADED, { type: 'categories', data: data.categories });
            return data.categories;
        } catch (error) {
            console.warn('Failed to fetch categories, using default data:', error);
            const defaultCategories = this.defaultData.categories;
            this.notify(EVENTS.DATA_LOADED, { type: 'categories', data: defaultCategories });
            return defaultCategories;
        }
    }

    /**
     * Get category by ID
     */
    async getCategoryById(categoryId) {
        try {
            const categories = await this.getCategories();
            const category = categories.find(cat => cat.id === categoryId);
            
            if (!category) {
                throw new Error(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
            }
            
            return category;
        } catch (error) {
            console.error('Failed to fetch category:', error);
            throw error;
        }
    }

    /**
     * Get all courses
     */
    async getCourses() {
        try {
            const data = await this.fetchData(API_CONFIG.ENDPOINTS.COURSES, 'courses');
            this.notify(EVENTS.DATA_LOADED, { type: 'courses', data: data.courses });
            return data.courses;
        } catch (error) {
            console.warn('Failed to fetch courses, using default data:', error);
            const defaultCourses = this.defaultData.courses;
            this.notify(EVENTS.DATA_LOADED, { type: 'courses', data: defaultCourses });
            return defaultCourses;
        }
    }

    /**
     * Get courses by category
     */
    async getCoursesByCategory(categoryId) {
        try {
            const courses = await this.getCourses();
            return courses.filter(course => course.categoryId === categoryId);
        } catch (error) {
            console.error('Failed to fetch courses by category:', error);
            throw error;
        }
    }

    /**
     * Get course by ID
     */
    async getCourseById(courseId) {
        try {
            const courses = await this.getCourses();
            const course = courses.find(course => course.id === courseId);
            
            if (!course) {
                throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
            }
            
            return course;
        } catch (error) {
            console.error('Failed to fetch course:', error);
            throw error;
        }
    }

    /**
     * Search courses
     */
    async searchCourses(query, categoryId = null) {
        try {
            let courses = await this.getCourses();
            
            if (categoryId) {
                courses = courses.filter(course => course.categoryId === categoryId);
            }
            
            const searchTerm = query.toLowerCase();
            return courses.filter(course => 
                course.title.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm) ||
                course.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        } catch (error) {
            console.error('Failed to search courses:', error);
            throw error;
        }
    }

    /**
     * Get featured categories
     */
    async getFeaturedCategories() {
        try {
            const categories = await this.getCategories();
            return categories.filter(category => category.featured);
        } catch (error) {
            console.error('Failed to fetch featured categories:', error);
            throw error;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    /**
     * Load story content for a specific course
     * @param {string} courseId - The course ID to load story content for
     * @returns {Promise<Array>} Array of story chapters
     */
    async loadStoryContent(courseId) {
        const cacheKey = `story-content-${courseId}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await fetch('data/story-content.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const allStoryContent = await response.json();
            const courseStoryContent = allStoryContent[courseId] || [];
            
            this.cache.set(cacheKey, courseStoryContent);
            return courseStoryContent;
            
        } catch (error) {
            console.error(`Error loading story content for ${courseId}:`, error);
            return [];
        }
    }

    /**
     * Load course stories data
     * @returns {Promise<Object>} Course stories data
     */
    async loadCourseStories() {
        const cacheKey = 'course-stories';
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await fetch('data/course-stories.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
            
        } catch (error) {
            console.error('Error loading course stories:', error);
            return { stories: {} };
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: CACHE_CONFIG.MAX_SIZE,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
const dataService = new DataService();

// Make it available globally for debugging and use in components
window.dataService = dataService;
