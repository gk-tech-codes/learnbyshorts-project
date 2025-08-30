/**
 * CategoryPage Controller - MVC Pattern Implementation
 * Manages the category page logic and interactions
 */

class CategoryPage {
    constructor() {
        this.categoryId = null;
        this.category = null;
        this.courses = [];
        this.filteredCourses = [];
        this.courseCards = [];
        this.currentView = 'grid';
        this.currentPage = 1;
        this.itemsPerPage = UI_CONFIG.ITEMS_PER_PAGE;
        this.filters = {
            search: '',
            difficulty: '',
            sortBy: 'title'
        };
        
        this.init();
    }

    /**
     * Initialize the category page
     */
    async init() {
        try {
            this.getCategoryIdFromURL();
            this.setupEventListeners();
            this.setupObservers();
            await this.loadCategoryData();
            await this.loadCourses();
            this.setupFilters();
        } catch (error) {
            console.error('Failed to initialize category page:', error);
            this.showError(ERROR_MESSAGES.GENERIC_ERROR);
        }
    }

    /**
     * Get category ID from URL parameters
     */
    getCategoryIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.categoryId = urlParams.get('id');
        
        if (!this.categoryId) {
            console.error('No category ID provided');
            window.location.href = ROUTES.HOME;
            return;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // DOM Content Loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, UI_CONFIG.DEBOUNCE_DELAY));
    }

    /**
     * Setup observers for data service
     */
    setupObservers() {
        dataService.subscribe(EVENTS.LOADING_START, () => {
            this.setLoadingState(true);
        });

        dataService.subscribe(EVENTS.LOADING_END, () => {
            this.setLoadingState(false);
        });

        dataService.subscribe(EVENTS.ERROR_OCCURRED, (data) => {
            this.showError(data.message);
        });

        dataService.subscribe(EVENTS.COURSE_SELECTED, (course) => {
            this.onCourseSelected(course);
        });
    }

    /**
     * Handle DOM ready
     */
    onDOMReady() {
        this.coursesContainer = document.getElementById('coursesGrid');
        this.emptyState = document.getElementById('emptyState');
        this.loadMoreContainer = document.getElementById('loadMoreContainer');
        
        if (!this.coursesContainer) {
            console.error('Courses container not found');
            return;
        }

        // Setup view toggle
        this.setupViewToggle();
        
        // Setup mobile menu
        this.setupMobileMenu();
    }

    /**
     * Load category data
     */
    async loadCategoryData() {
        try {
            this.category = await dataService.getCategoryById(this.categoryId);
            this.updateCategoryUI();
            this.updateBreadcrumb();
        } catch (error) {
            console.error('Failed to load category:', error);
            this.showError(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }
    }

    /**
     * Load courses for the category
     */
    async loadCourses() {
        try {
            this.courses = await dataService.getCoursesByCategory(this.categoryId);
            this.filteredCourses = [...this.courses];
            this.renderCourses();
            this.loadRelatedCategories();
        } catch (error) {
            console.error('Failed to load courses:', error);
            this.showError(ERROR_MESSAGES.DATA_LOAD_ERROR);
        }
    }

    /**
     * Update category UI elements
     */
    updateCategoryUI() {
        if (!this.category) return;

        // Update hero section
        const elements = {
            categoryIcon: document.getElementById('categoryIcon'),
            categoryTitle: document.getElementById('categoryTitle'),
            categoryDescription: document.getElementById('categoryDescription'),
            courseCount: document.getElementById('courseCount'),
            categoryDifficulty: document.getElementById('categoryDifficulty'),
            estimatedTime: document.getElementById('estimatedTime')
        };

        if (elements.categoryIcon) elements.categoryIcon.textContent = this.category.icon;
        if (elements.categoryTitle) elements.categoryTitle.textContent = this.category.title;
        if (elements.categoryDescription) elements.categoryDescription.textContent = this.category.description;
        if (elements.courseCount) elements.courseCount.textContent = this.category.courseCount;
        if (elements.categoryDifficulty) elements.categoryDifficulty.textContent = this.category.difficulty;
        if (elements.estimatedTime) elements.estimatedTime.textContent = this.category.estimatedTime;

        // Update page title
        document.title = `${this.category.title} - LearnByShorts`;

        // Update hero background color
        const hero = document.querySelector('.category-hero');
        if (hero && this.category.color) {
            hero.style.background = `linear-gradient(135deg, ${this.category.color} 0%, ${this.category.color}dd 100%)`;
        }
    }

    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb() {
        const categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
        if (categoryBreadcrumb && this.category) {
            categoryBreadcrumb.textContent = this.category.title;
            categoryBreadcrumb.href = `${ROUTES.CATEGORY}?id=${this.categoryId}`;
        }
    }

    /**
     * Setup filters and search
     */
    setupFilters() {
        const searchInput = document.getElementById('searchInput');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const sortBy = document.getElementById('sortBy');

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            }, UI_CONFIG.DEBOUNCE_DELAY));
        }

        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', (e) => {
                this.filters.difficulty = e.target.value;
                this.applyFilters();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Search button
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
    }

    /**
     * Setup view toggle functionality
     */
    setupViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.switchView(view);
            });
        });
    }

    /**
     * Switch between grid and list view
     */
    switchView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Update courses container
        if (this.coursesContainer) {
            this.coursesContainer.className = `courses-grid ${view === 'list' ? 'list-view' : ''}`;
        }
        
        // Re-render courses with appropriate card type
        this.renderCourses();
    }

    /**
     * Apply filters to courses
     */
    applyFilters() {
        let filtered = [...this.courses];

        // Search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(course => 
                course.title.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm) ||
                course.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Difficulty filter
        if (this.filters.difficulty) {
            filtered = filtered.filter(course => 
                course.difficulty === this.filters.difficulty
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (this.filters.sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'difficulty':
                    const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                case 'duration':
                    return (a.duration || 0) - (b.duration || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                default:
                    return 0;
            }
        });

        this.filteredCourses = filtered;
        this.currentPage = 1;
        this.renderCourses();
    }

    /**
     * Render courses using factory pattern
     */
    renderCourses() {
        if (!this.coursesContainer) return;

        // Clear existing content
        this.coursesContainer.innerHTML = '';
        this.courseCards = [];

        // Check if we have courses to display
        if (this.filteredCourses.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const coursesToShow = this.filteredCourses.slice(0, endIndex);

        // Create course cards
        coursesToShow.forEach((course, index) => {
            const cardType = this.currentView === 'list' ? 'list' : 'default';
            const courseCard = CourseCardFactory.createCard(course, cardType);
            const cardElement = courseCard.createElement();
            
            // Add animation delay
            cardElement.style.animationDelay = `${(index % this.itemsPerPage) * 0.1}s`;
            cardElement.classList.add('fade-in');
            
            this.coursesContainer.appendChild(cardElement);
            this.courseCards.push(courseCard);
        });

        // Update load more button
        this.updateLoadMoreButton();
        
        // Trigger animations
        this.triggerAnimations();
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'block';
        }
        if (this.loadMoreContainer) {
            this.loadMoreContainer.style.display = 'none';
        }
    }

    /**
     * Hide empty state
     */
    hideEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'none';
        }
    }

    /**
     * Update load more button visibility
     */
    updateLoadMoreButton() {
        if (!this.loadMoreContainer) return;

        const totalShown = this.currentPage * this.itemsPerPage;
        const hasMore = totalShown < this.filteredCourses.length;

        if (hasMore) {
            this.loadMoreContainer.style.display = 'block';
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.onclick = () => this.loadMoreCourses();
            }
        } else {
            this.loadMoreContainer.style.display = 'none';
        }
    }

    /**
     * Load more courses
     */
    loadMoreCourses() {
        this.currentPage++;
        this.renderCourses();
    }

    /**
     * Load related categories
     */
    async loadRelatedCategories() {
        try {
            const allCategories = await dataService.getCategories();
            const related = allCategories
                .filter(cat => cat.id !== this.categoryId)
                .slice(0, 4);
            
            this.renderRelatedCategories(related);
        } catch (error) {
            console.error('Failed to load related categories:', error);
        }
    }

    /**
     * Render related categories
     */
    renderRelatedCategories(categories) {
        const relatedGrid = document.getElementById('relatedGrid');
        if (!relatedGrid) return;

        relatedGrid.innerHTML = '';
        
        categories.forEach(category => {
            const categoryCard = CategoryCardFactory.createCard(category, 'compact');
            const cardElement = categoryCard.createElement();
            relatedGrid.appendChild(cardElement);
        });
    }

    /**
     * Trigger entrance animations
     */
    triggerAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, {
            threshold: 0.1
        });

        this.courseCards.forEach(card => {
            if (card.element) {
                observer.observe(card.element);
            }
        });
    }

    /**
     * Handle course selection
     */
    onCourseSelected(course) {
        console.log('Course selected:', course);
        this.trackCourseSelection(course);
    }

    /**
     * Setup mobile menu
     */
    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const width = window.innerWidth;
        
        if (width <= UI_CONFIG.BREAKPOINTS.MOBILE) {
            this.handleMobileLayout();
        } else if (width <= UI_CONFIG.BREAKPOINTS.TABLET) {
            this.handleTabletLayout();
        } else {
            this.handleDesktopLayout();
        }
    }

    /**
     * Handle mobile layout
     */
    handleMobileLayout() {
        // Force grid view on mobile
        if (this.currentView === 'list') {
            this.switchView('grid');
        }
    }

    /**
     * Handle tablet layout
     */
    handleTabletLayout() {
        console.log('Switched to tablet layout');
    }

    /**
     * Handle desktop layout
     */
    handleDesktopLayout() {
        console.log('Switched to desktop layout');
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        if (this.coursesContainer) {
            if (isLoading) {
                this.coursesContainer.classList.add('loading');
                this.showLoadingSpinner();
            } else {
                this.coursesContainer.classList.remove('loading');
                this.hideLoadingSpinner();
            }
        }
    }

    /**
     * Show loading spinner
     */
    showLoadingSpinner() {
        if (!this.coursesContainer) return;
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner"></div>
            <p>Loading courses...</p>
        `;
        
        this.coursesContainer.appendChild(spinner);
    }

    /**
     * Hide loading spinner
     */
    hideLoadingSpinner() {
        const spinner = this.coursesContainer?.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (!this.coursesContainer) return;
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <div class="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button class="btn-retry" onclick="window.location.reload()">Try Again</button>
        `;
        
        this.coursesContainer.innerHTML = '';
        this.coursesContainer.appendChild(errorElement);
    }

    /**
     * Track course selection for analytics
     */
    trackCourseSelection(course) {
        console.log('Tracking course selection:', course.id);
    }

    /**
     * Debounce utility function
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
        this.courseCards.forEach(card => card.destroy());
        this.courseCards = [];
        
        // Unsubscribe from data service
        dataService.unsubscribe(EVENTS.LOADING_START);
        dataService.unsubscribe(EVENTS.LOADING_END);
        dataService.unsubscribe(EVENTS.ERROR_OCCURRED);
        dataService.unsubscribe(EVENTS.COURSE_SELECTED);
    }
}

// Global function for clearing filters
window.clearFilters = function() {
    const searchInput = document.getElementById('searchInput');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const sortBy = document.getElementById('sortBy');
    
    if (searchInput) searchInput.value = '';
    if (difficultyFilter) difficultyFilter.value = '';
    if (sortBy) sortBy.value = 'title';
    
    if (window.categoryPage) {
        window.categoryPage.filters = { search: '', difficulty: '', sortBy: 'title' };
        window.categoryPage.applyFilters();
    }
};

// Initialize category page when script loads
let categoryPage;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        categoryPage = new CategoryPage();
        window.categoryPage = categoryPage;
    });
} else {
    categoryPage = new CategoryPage();
    window.categoryPage = categoryPage;
}
