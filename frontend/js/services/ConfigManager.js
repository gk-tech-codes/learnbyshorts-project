/**
 * ConfigManager - Configuration Management Service
 * Handles loading, merging, and accessing configuration data
 */
class ConfigManager {
    constructor() {
        if (ConfigManager.instance) {
            return ConfigManager.instance;
        }
        
        this.configs = new Map();
        this.defaultConfigs = new Map();
        this.isInitialized = false;
        
        // Set default configurations
        this.setDefaultConfig('app', {
            name: "LearnByShorts",
            version: "1.0.0",
            description: "Educational platform for learning through short image sequences",
            theme: "light",
            features: {
                darkMode: true,
                offlineAccess: false,
                notifications: true
            },
            api: {
                baseUrl: "/api",
                timeout: 10000
            },
            ui: {
                animations: true,
                transitionSpeed: 300,
                itemsPerPage: 12
            }
        });
        
        this.setDefaultConfig('homepage', {
            header: {
                logo: {
                    text: "LearnByShorts",
                    tagline: "Master Programming Through Stories"
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
                title: "Learn Programming Through <span class=\"highlight\">Visual Stories</span>",
                description: "Discover a new way to master programming concepts. Our bite-sized visual narratives transform complex technical ideas into engaging, memorable learning experiences that stick.",
                stats: {
                    courses: {
                        number: 0,
                        label: "Courses",
                        visible: false
                    },
                    categories: {
                        number: 8,
                        label: "Learning Paths",
                        visible: true
                    },
                    learners: {
                        number: 0,
                        label: "Learners",
                        visible: false
                    }
                },
                buttons: {
                    primary: {
                        text: "Start Learning",
                        action: "scrollToCategories",
                        visible: true
                    },
                    secondary: {
                        text: "View Shorts",
                        action: "viewShorts",
                        visible: true
                    }
                }
            },
            sections: {
                categories: {
                    title: "Choose Your Learning Path",
                    subtitle: "Select a programming topic and start your journey",
                    visible: true
                },
                features: {
                    title: "Why Choose LearnByShorts?",
                    visible: true,
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
                },
                howItWorks: {
                    title: "How It Works",
                    visible: true,
                    steps: [
                        {
                            number: 1,
                            title: "Choose Your Path",
                            description: "Select from our curated programming topics"
                        },
                        {
                            number: 2,
                            title: "Watch & Learn",
                            description: "Follow visual stories that explain concepts step-by-step"
                        },
                        {
                            number: 3,
                            title: "Practice & Apply",
                            description: "Reinforce your learning with hands-on exercises"
                        },
                        {
                            number: 4,
                            title: "Track Progress",
                            description: "Monitor your learning journey and achievements"
                        }
                    ]
                }
            },
            demo: {
                visible: false,
                images: [
                    "assets/demo/concept1.jpg",
                    "assets/demo/concept2.jpg",
                    "assets/demo/concept3.jpg"
                ]
            }
        });
        
        this.setDefaultConfig('theme', {
            colors: {
                primary: "#6366f1",
                primaryDark: "#4338ca",
                primaryLight: "#818cf8",
                secondary: "#10b981",
                secondaryDark: "#059669",
                secondaryLight: "#34d399",
                accent: "#f59e0b",
                textDark: "#1e293b",
                textLight: "#f8fafc",
                textMuted: "#64748b",
                backgroundLight: "#f8fafc",
                backgroundDark: "#1e293b",
                borderColor: "#e2e8f0",
                errorColor: "#ef4444",
                successColor: "#10b981",
                warningColor: "#f59e0b",
                infoColor: "#3b82f6"
            },
            fonts: {
                primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
                heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
                code: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            },
            spacing: {
                xs: "0.25rem",
                sm: "0.5rem",
                md: "1rem",
                lg: "2rem",
                xl: "4rem"
            },
            borderRadius: {
                sm: "0.25rem",
                md: "0.5rem",
                lg: "1rem",
                full: "9999px"
            },
            shadows: {
                sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
                md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            },
            breakpoints: {
                sm: "640px",
                md: "768px",
                lg: "1024px",
                xl: "1280px",
                xxl: "1536px"
            }
        });
        
        ConfigManager.instance = this;
    }

    /**
     * Initialize the configuration manager
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('ConfigManager init started');
            console.log('Default configs available:', Array.from(this.defaultConfigs.keys()));
            
            // Try to load core configurations
            try {
                console.log('Attempting to load configurations from files');
                await Promise.all([
                    this.loadConfig('app', 'data/config/app.json'),
                    this.loadConfig('homepage', 'data/config/homepage.json'),
                    this.loadConfig('theme', 'data/config/theme.json')
                ]);
                console.log('Configurations loaded from files successfully');
            } catch (error) {
                console.warn('Failed to load configurations from files, using defaults:', error);
                
                // Use default configurations if loading fails
                this.configs.set('app', this.defaultConfigs.get('app'));
                this.configs.set('homepage', this.defaultConfigs.get('homepage'));
                this.configs.set('theme', this.defaultConfigs.get('theme'));
                
                console.log('Default configurations set:', Array.from(this.configs.keys()));
            }
            
            // Log the homepage config specifically
            console.log('Homepage config:', this.configs.get('homepage'));
            
            this.isInitialized = true;
            console.log('ConfigManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ConfigManager:', error);
            throw error;
        }
    }

    /**
     * Set default configuration
     * @param {string} key - Configuration key
     * @param {Object} config - Default configuration object
     */
    setDefaultConfig(key, config) {
        this.defaultConfigs.set(key, config);
    }

    /**
     * Load configuration from file
     * @param {string} key - Configuration key
     * @param {string} path - Path to configuration file
     * @returns {Promise<Object>} - Loaded configuration
     */
    async loadConfig(key, path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const config = await response.json();
            this.configs.set(key, config);
            return config;
        } catch (error) {
            console.error(`Failed to load ${key} configuration:`, error);
            
            // Use default configuration if available
            if (this.defaultConfigs.has(key)) {
                const defaultConfig = this.defaultConfigs.get(key);
                this.configs.set(key, defaultConfig);
                return defaultConfig;
            }
            
            throw error;
        }
    }

    /**
     * Get configuration by key
     * @param {string} key - Configuration key
     * @returns {Object|null} - Configuration object or null if not found
     */
    getConfig(key) {
        return this.configs.get(key) || null;
    }

    /**
     * Get configuration value by path
     * @param {string} key - Configuration key
     * @param {string} path - Dot notation path (e.g., 'hero.title')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} - Configuration value or default value
     */
    getValue(key, path, defaultValue = null) {
        const config = this.getConfig(key);
        if (!config) return defaultValue;
        
        return this.getValueByPath(config, path, defaultValue);
    }

    /**
     * Get value from object by dot notation path
     * @param {Object} obj - Object to search in
     * @param {string} path - Dot notation path
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} - Found value or default value
     */
    getValueByPath(obj, path, defaultValue = null) {
        if (!obj || !path) return defaultValue;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultValue;
            }
            
            current = current[key];
            
            if (current === undefined) {
                return defaultValue;
            }
        }
        
        return current !== undefined ? current : defaultValue;
    }

    /**
     * Update configuration
     * @param {string} key - Configuration key
     * @param {Object} newConfig - New configuration object
     * @param {boolean} merge - Whether to merge with existing config
     */
    updateConfig(key, newConfig, merge = true) {
        if (!merge) {
            this.configs.set(key, newConfig);
            return;
        }
        
        const currentConfig = this.getConfig(key) || {};
        this.configs.set(key, this.deepMerge(currentConfig, newConfig));
    }

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} - Merged object
     */
    deepMerge(target, source) {
        const output = { ...target };
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }
        
        return output;
    }

    /**
     * Check if value is an object
     * @param {*} item - Value to check
     * @returns {boolean} - True if object
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Reset configuration to default
     * @param {string} key - Configuration key
     */
    resetConfig(key) {
        if (this.defaultConfigs.has(key)) {
            this.configs.set(key, this.defaultConfigs.get(key));
        } else {
            this.configs.delete(key);
        }
    }

    /**
     * Reset all configurations to defaults
     */
    resetAllConfigs() {
        this.defaultConfigs.forEach((config, key) => {
            this.configs.set(key, config);
        });
    }
}

// Create singleton instance
const configManager = new ConfigManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}
