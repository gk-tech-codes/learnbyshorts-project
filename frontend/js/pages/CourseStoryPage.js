/**
 * CourseStoryPage - Handles the display of course story content
 * Loads and renders course story chapters dynamically based on URL parameters
 */
class CourseStoryPage {
    constructor() {
        this.courseId = null;
        this.courseData = null;
        this.conceptData = null;
        this.categoryData = null;
        this.chapters = [];
        this.currentChapterIndex = 0;
        this.userProgress = 0;
        
        this.init();
    }
    
    /**
     * Initialize the page
     */
    async init() {
        try {
            console.log('Initializing CourseStoryPage');
            
            // Extract course ID from URL
            this.courseId = this.getCourseIdFromUrl();
            
            if (!this.courseId) {
                this.showError('Course ID not found in URL. Please check the URL and try again.');
                return;
            }
            
            console.log(`Loading course with ID: ${this.courseId}`);
            
            // Load course data
            await this.loadCourseData();
            
            // Load concept data
            await this.loadConceptData();
            
            // Load category data
            await this.loadCategoryData();
            
            // Generate chapters from concept data
            this.generateChapters();
            
            // Render the page
            this.renderPage();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('CourseStoryPage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CourseStoryPage:', error);
            this.showError('Failed to load course story. Please try again later.');
        }
    }
    
    /**
     * Get course ID from URL query parameters
     * @returns {string|null} Course ID or null if not found
     */
    getCourseIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }
    
    /**
     * Load course data from API
     */
    async loadCourseData() {
        try {
            // Fetch courses data
            const response = await fetch('data/courses.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Find the course with matching ID
            this.courseData = data.courses.find(course => course.id === this.courseId);
            
            if (!this.courseData) {
                throw new Error(`Course with ID ${this.courseId} not found`);
            }
            
            console.log('Course data loaded:', this.courseData);
        } catch (error) {
            console.error('Error loading course data:', error);
            throw error;
        }
    }
    
    /**
     * Load concept data for the course
     */
    async loadConceptData() {
        try {
            console.log(`Loading story content for: ${this.courseId}`);
            
            // Direct fetch from story-content.json
            const response = await fetch('data/story-content.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const allStoryContent = await response.json();
            console.log('All story content loaded, keys:', Object.keys(allStoryContent));
            
            const storyContent = allStoryContent[this.courseId];
            console.log(`Story content for ${this.courseId}:`, storyContent);
            
            if (storyContent && storyContent.length > 0) {
                // Convert story content to concept data format
                this.conceptData = {
                    id: this.courseId,
                    title: this.courseData?.title || 'Bridge Pattern',
                    description: this.courseData?.description || 'Learn the Bridge pattern through engaging stories',
                    chapters: storyContent
                };
                console.log('Concept data created:', this.conceptData);
                return;
            }
            
            throw new Error(`No story content found for ${this.courseId}`);
            
        } catch (error) {
            console.error('Error loading concept data:', error);
            throw error;
        }
    }
    
    /**
     * Load category data for the course
     */
    async loadCategoryData() {
        try {
            if (!this.courseData || !this.courseData.categoryId) {
                return;
            }
            
            // Fetch categories data
            const response = await fetch('data/categories.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Find the category with matching ID
            this.categoryData = data.categories.find(category => category.id === this.courseData.categoryId);
            
            console.log('Category data loaded:', this.categoryData);
        } catch (error) {
            console.error('Error loading category data:', error);
            // Don't throw error here, as we can still display the course without category
        }
    }
    
    /**
     * Generate chapters from concept data
     */
    generateChapters() {
        this.chapters = [];
        
        // Check if we have story content chapters (new format)
        if (this.conceptData.chapters && Array.isArray(this.conceptData.chapters)) {
            this.conceptData.chapters.forEach((chapter, index) => {
                this.chapters.push({
                    title: chapter.title,
                    type: 'story',
                    content: chapter.story,
                    duration: chapter.duration,
                    difficulty: chapter.difficulty
                });
            });
        } else if (this.conceptData.story) {
            // Fallback to old format
            // Add introduction chapter
            if (this.conceptData.story.introduction) {
                this.chapters.push({
                    title: 'Introduction',
                    type: 'introduction',
                    content: this.conceptData.story.introduction
                });
            }
            
            // Add timeline chapters
            if (this.conceptData.story.timeline) {
                this.conceptData.story.timeline.forEach(item => {
                    this.chapters.push({
                        title: item.title,
                        type: 'story',
                        content: item.description
                    });
                });
            }
        }
        
        console.log(`Generated ${this.chapters.length} chapters:`, this.chapters.map(c => c.title));
    }
        
        // Add technical explanation chapter
        if (this.conceptData.technicalExplanation) {
            this.chapters.push({
                title: 'Technical Explanation',
                type: 'technical',
                content: this.conceptData.technicalExplanation
            });
        }
        
        // Add code examples chapter
        if (this.conceptData.codeExamples && this.conceptData.codeExamples.length > 0) {
            this.chapters.push({
                title: 'Code Examples',
                type: 'code',
                content: this.conceptData.codeExamples
            });
        }
        
        // Add real-world applications chapter
        if (this.conceptData.realWorldApplications && this.conceptData.realWorldApplications.length > 0) {
            this.chapters.push({
                title: 'Real-World Applications',
                type: 'applications',
                content: this.conceptData.realWorldApplications
            });
        }
        
        // Add conclusion chapter
        this.chapters.push({
            title: 'Conclusion',
            type: 'conclusion',
            content: 'Congratulations! You have completed this course. You now understand the key concepts and applications of this pattern.'
        });
        
        console.log('Chapters generated:', this.chapters);
    }
    
    /**
     * Render the page
     */
    renderPage() {
        if (!this.courseData || !this.conceptData) {
            this.showError('Course data not found');
            return;
        }
        
        // Update page title
        document.title = `${this.courseData.title} - LearnByShorts`;
        
        // Render sidebar
        this.renderSidebar();
        
        // Render current chapter
        this.renderCurrentChapter();
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }
    
    /**
     * Render sidebar
     */
    renderSidebar() {
        // Update course title
        const courseTitle = document.getElementById('courseTitle');
        if (courseTitle) {
            courseTitle.textContent = this.courseData.title;
        }
        
        // Update course category
        const courseCategory = document.getElementById('courseCategory');
        if (courseCategory && this.categoryData) {
            courseCategory.textContent = this.categoryData.title;
            courseCategory.style.backgroundColor = this.categoryData.color || '#6366f1';
        }
        
        // Update course difficulty
        const courseDifficulty = document.getElementById('courseDifficulty');
        if (courseDifficulty) {
            courseDifficulty.textContent = this.courseData.difficulty || 'Beginner';
        }
        
        // Render chapters list
        this.renderChaptersList();
        
        // Update progress
        this.updateProgress();
    }
    
    /**
     * Render chapters list
     */
    renderChaptersList() {
        const chaptersList = document.getElementById('chaptersList');
        if (!chaptersList) return;
        
        chaptersList.innerHTML = '';
        
        this.chapters.forEach((chapter, index) => {
            const chapterItem = document.createElement('li');
            chapterItem.className = 'chapter-item';
            
            if (index === this.currentChapterIndex) {
                chapterItem.classList.add('active');
            }
            
            if (index < this.currentChapterIndex) {
                chapterItem.classList.add('completed');
            }
            
            chapterItem.innerHTML = `
                <span class="chapter-number">${index + 1}</span>
                <span class="chapter-title">${chapter.title}</span>
                <span class="chapter-status">${index < this.currentChapterIndex ? '✓' : ''}</span>
            `;
            
            // Add click event
            chapterItem.addEventListener('click', () => {
                this.navigateToChapter(index);
            });
            
            chaptersList.appendChild(chapterItem);
        });
    }
    
    /**
     * Update progress
     */
    updateProgress() {
        const progressPercentage = document.getElementById('progressPercentage');
        const progressBar = document.getElementById('progressBar');
        
        if (!progressPercentage || !progressBar) return;
        
        // Calculate progress percentage
        const totalChapters = this.chapters.length;
        const completedChapters = this.currentChapterIndex;
        const percentage = Math.round((completedChapters / totalChapters) * 100);
        
        // Update progress percentage
        progressPercentage.textContent = `${percentage}%`;
        
        // Update progress bar
        progressBar.style.width = `${percentage}%`;
        
        // Save progress
        this.userProgress = percentage;
    }
    
    /**
     * Render current chapter
     */
    renderCurrentChapter() {
        const currentChapter = this.chapters[this.currentChapterIndex];
        if (!currentChapter) return;
        
        // Update chapter number
        const currentChapterNumber = document.getElementById('currentChapterNumber');
        if (currentChapterNumber) {
            currentChapterNumber.textContent = `Chapter ${this.currentChapterIndex + 1} of ${this.chapters.length}`;
        }
        
        // Update chapter title
        const currentChapterTitle = document.getElementById('currentChapterTitle');
        if (currentChapterTitle) {
            currentChapterTitle.textContent = currentChapter.title;
        }
        
        // Update chapter content
        const storyContent = document.getElementById('storyContent');
        if (!storyContent) return;
        
        storyContent.innerHTML = '';
        
        switch (currentChapter.type) {
            case 'introduction':
                this.renderIntroductionChapter(storyContent, currentChapter);
                break;
            case 'story':
                this.renderStoryChapter(storyContent, currentChapter);
                break;
            case 'technical':
                this.renderTechnicalChapter(storyContent, currentChapter);
                break;
            case 'code':
                this.renderCodeChapter(storyContent, currentChapter);
                break;
            case 'applications':
                this.renderApplicationsChapter(storyContent, currentChapter);
                break;
            case 'conclusion':
                this.renderConclusionChapter(storyContent, currentChapter);
                break;
            default:
                storyContent.innerHTML = `<p>${currentChapter.content}</p>`;
        }
    }
    
    /**
     * Render introduction chapter
     * @param {HTMLElement} container - Content container
     * @param {Object} chapter - Chapter data
     */
    renderIntroductionChapter(container, chapter) {
        // Create character section
        if (this.conceptData.character) {
            const characterSection = document.createElement('div');
            characterSection.className = 'character-section';
            
            characterSection.innerHTML = `
                <div class="character-info">
                    <div class="character-avatar">
                        ${this.conceptData.character.image ? 
                            `<img src="${this.conceptData.character.image}" alt="${this.conceptData.character.name}">` : 
                            `<div class="character-placeholder">${this.conceptData.character.name.charAt(0)}</div>`}
                    </div>
                    <div class="character-details">
                        <h3>${this.conceptData.character.name}</h3>
                        <p>${this.conceptData.character.role}</p>
                    </div>
                </div>
            `;
            
            container.appendChild(characterSection);
        }
        
        // Create introduction content
        const introContent = document.createElement('div');
        introContent.className = 'chapter-content';
        
        introContent.innerHTML = `
            <p class="intro-text">${chapter.content}</p>
            ${this.conceptData.story.quote ? 
                `<blockquote class="story-quote">
                    <p>${this.conceptData.story.quote}</p>
                    <cite>${this.conceptData.character ? this.conceptData.character.name : 'Anonymous'}</cite>
                </blockquote>` : ''}
        `;
        
        container.appendChild(introContent);
    }
    
    /**
     * Render story chapter
     * @param {HTMLElement} container - Content container
     * @param {Object} chapter - Chapter data
     */
    renderStoryChapter(container, chapter) {
        const storyContent = document.createElement('div');
        storyContent.className = 'chapter-content';
        
        storyContent.innerHTML = `
            <div class="story-illustration">
                <div class="illustration-placeholder">
                    <span class="illustration-icon">📚</span>
                </div>
            </div>
            <h3>${chapter.title}</h3>
            <p>${chapter.content}</p>
        `;
        
        container.appendChild(storyContent);
    }
    
    /**
     * Render technical chapter
     * @param {HTMLElement} container - Content container
     * @param {Object} chapter - Chapter data
     */
    renderTechnicalChapter(container, chapter) {
        const techExp = chapter.content;
        
        const techContent = document.createElement('div');
        techContent.className = 'chapter-content';
        
        let html = `
            <div class="tech-header">
                <h3>Technical Explanation</h3>
                <p class="tech-definition">${techExp.definition}</p>
            </div>
        `;
        
        // Key characteristics
        if (techExp.keyCharacteristics && techExp.keyCharacteristics.length > 0) {
            html += `
                <div class="tech-section">
                    <h4>Key Characteristics</h4>
                    <ul class="tech-list">
                        ${techExp.keyCharacteristics.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // When to use
        if (techExp.whenToUse && techExp.whenToUse.length > 0) {
            html += `
                <div class="tech-section">
                    <h4>When to Use</h4>
                    <ul class="tech-list">
                        ${techExp.whenToUse.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Advantages and disadvantages
        if (techExp.advantages && techExp.advantages.length > 0) {
            html += `
                <div class="tech-section">
                    <h4>Advantages</h4>
                    <ul class="tech-list advantages">
                        ${techExp.advantages.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (techExp.disadvantages && techExp.disadvantages.length > 0) {
            html += `
                <div class="tech-section">
                    <h4>Disadvantages</h4>
                    <ul class="tech-list disadvantages">
                        ${techExp.disadvantages.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        techContent.innerHTML = html;
        container.appendChild(techContent);
    }
    
    /**
     * Render code chapter
     * @param {HTMLElement} container - Content container
     * @param {Object} chapter - Chapter data
     */
    renderCodeChapter(container, chapter) {
        const codeExamples = chapter.content;
        
        const codeContent = document.createElement('div');
        codeContent.className = 'chapter-content';
        
        codeContent.innerHTML = `
            <div class="code-header">
                <h3>Code Examples</h3>
                <p>Here are practical implementations of the concepts you've learned:</p>
            </div>
        `;
        
        // Create code examples
        codeExamples.forEach(example => {
            const codeExample = document.createElement('div');
            codeExample.className = 'code-example';
            
            codeExample.innerHTML = `
                <div class="code-example-header">
                    <h4>${example.title}</h4>
                    <span class="code-language">${example.language}</span>
                </div>
                <div class="code-filename">${example.filename}</div>
                <pre><code class="language-${example.language}">${this.escapeHtml(example.code)}</code></pre>
            `;
            
            codeContent.appendChild(codeExample);
        });
        
        container.appendChild(codeContent);
        
        // Initialize syntax highlighting
        if (window.hljs) {
            window.hljs.highlightAll();
        }
    }
    
    /**
     * Render applications chapter
     * @param {HTMLElement} container - Content container
     * @param {Object} chapter - Chapter data
     */
    renderApplicationsChapter(container, chapter) {
        const applications = chapter.content;
        
        const applicationsContent = document.createElement('div');
        applicationsContent.className = 'chapter-content';
        
        applicationsContent.innerHTML = `
            <div class="applications-header">
                <h3>Real-World Applications</h3>
                <p>See how these concepts are applied in real-world scenarios:</p>
            </div>
            <div class="applications-grid">
                ${applications.map(app => `
                    <div class="application-card">
                        <h4>${app.title}</h4>
                        <p>${app.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(applicationsContent);
    }
    
    /**
     * Render conclusion chapter
     * @param {HTMLElement} container - Content container
     * @param {Object} chapter - Chapter data
     */
    renderConclusionChapter(container, chapter) {
        const conclusionContent = document.createElement('div');
        conclusionContent.className = 'chapter-content conclusion';
        
        conclusionContent.innerHTML = `
            <div class="conclusion-icon">🎉</div>
            <h3>Congratulations!</h3>
            <p>${chapter.content}</p>
            <div class="conclusion-actions">
                <button class="btn-primary" id="backToCourseDetailBtn">
                    Back to Course Details
                </button>
                <button class="btn-secondary" id="exploreMoreBtn">
                    Explore More Courses
                </button>
            </div>
        `;
        
        container.appendChild(conclusionContent);
        
        // Add event listeners for conclusion buttons
        const backToCourseDetailBtn = document.getElementById('backToCourseDetailBtn');
        if (backToCourseDetailBtn) {
            backToCourseDetailBtn.addEventListener('click', () => {
                window.location.href = `course-detail.html?id=${this.courseId}`;
            });
        }
        
        const exploreMoreBtn = document.getElementById('exploreMoreBtn');
        if (exploreMoreBtn) {
            exploreMoreBtn.addEventListener('click', () => {
                window.location.href = `category.html?id=${this.courseData.categoryId}`;
            });
        }
    }
    
    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtnBottom = document.getElementById('prevBtnBottom');
        const nextBtnBottom = document.getElementById('nextBtnBottom');
        
        if (!prevBtn || !nextBtn || !prevBtnBottom || !nextBtnBottom) return;
        
        // Update previous buttons
        const isPrevDisabled = this.currentChapterIndex === 0;
        prevBtn.disabled = isPrevDisabled;
        prevBtnBottom.disabled = isPrevDisabled;
        
        // Update next buttons
        const isNextDisabled = this.currentChapterIndex === this.chapters.length - 1;
        nextBtn.disabled = isNextDisabled;
        nextBtnBottom.disabled = isNextDisabled;
        
        // Update next button text for last chapter
        if (isNextDisabled) {
            nextBtn.innerHTML = 'Finish <span class="nav-icon">✓</span>';
            nextBtnBottom.innerHTML = 'Finish <span class="nav-icon">✓</span>';
        } else {
            nextBtn.innerHTML = 'Next <span class="nav-icon">→</span>';
            nextBtnBottom.innerHTML = 'Next <span class="nav-icon">→</span>';
        }
    }
    
    /**
     * Navigate to previous chapter
     */
    navigateToPreviousChapter() {
        if (this.currentChapterIndex > 0) {
            this.currentChapterIndex--;
            this.renderCurrentChapter();
            this.renderChaptersList();
            this.updateNavigationButtons();
            this.scrollToTop();
        }
    }
    
    /**
     * Navigate to next chapter
     */
    navigateToNextChapter() {
        if (this.currentChapterIndex < this.chapters.length - 1) {
            this.currentChapterIndex++;
            this.renderCurrentChapter();
            this.renderChaptersList();
            this.updateNavigationButtons();
            this.updateProgress();
            this.scrollToTop();
        }
    }
    
    /**
     * Navigate to specific chapter
     * @param {number} index - Chapter index
     */
    navigateToChapter(index) {
        if (index >= 0 && index < this.chapters.length) {
            this.currentChapterIndex = index;
            this.renderCurrentChapter();
            this.renderChaptersList();
            this.updateNavigationButtons();
            this.updateProgress();
            this.scrollToTop();
        }
    }
    
    /**
     * Scroll to top of content
     */
    scrollToTop() {
        const storyContent = document.querySelector('.story-content');
        if (storyContent) {
            storyContent.scrollTop = 0;
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtnBottom = document.getElementById('prevBtnBottom');
        const nextBtnBottom = document.getElementById('nextBtnBottom');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateToPreviousChapter());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateToNextChapter());
        }
        
        if (prevBtnBottom) {
            prevBtnBottom.addEventListener('click', () => this.navigateToPreviousChapter());
        }
        
        if (nextBtnBottom) {
            nextBtnBottom.addEventListener('click', () => this.navigateToNextChapter());
        }
        
        // Back to course button
        const backToCourseBtn = document.getElementById('backToCourseBtn');
        if (backToCourseBtn) {
            backToCourseBtn.addEventListener('click', () => {
                window.location.href = `course-detail.html?id=${this.courseId}`;
            });
        }
        
        // Mobile menu toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                this.navigateToPreviousChapter();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
                this.navigateToNextChapter();
            }
        });
    }
    
    /**
     * Escape HTML special characters
     * @param {string} html - HTML string
     * @returns {string} - Escaped HTML string
     */
    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const container = document.querySelector('.story-content') || document.body;
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <div class="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button class="btn-retry" onclick="location.reload()">Try Again</button>
        `;
        
        container.prepend(errorElement);
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CourseStoryPage();
});
