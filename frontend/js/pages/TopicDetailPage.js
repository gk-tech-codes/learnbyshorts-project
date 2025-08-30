/**
 * TopicDetailPage - Handles the display of individual topic details
 * Loads and renders topic information dynamically based on URL parameters
 */
class TopicDetailPage {
    constructor() {
        this.topicId = null;
        this.courseId = null;
        this.topicIndex = null;
        this.topicData = null;
        this.courseData = null;
        this.allTopics = [];
        
        this.init();
    }
    
    /**
     * Initialize the page
     */
    async init() {
        try {
            console.log('Initializing TopicDetailPage');
            
            // Extract parameters from URL
            this.extractUrlParameters();
            
            if (!this.topicId && !this.courseId) {
                this.showError('Topic or course ID not found in URL. Please check the URL and try again.');
                return;
            }
            
            console.log(`Loading topic: ${this.topicId}, course: ${this.courseId}, index: ${this.topicIndex}`);
            
            // Load data
            await this.loadTopicData();
            await this.loadCourseData();
            
            // Render the page
            this.renderPage();
            
            // Setup interactions
            this.setupEventListeners();
            this.setupScrollTracking();
            this.generateTableOfContents();
            
            console.log('TopicDetailPage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TopicDetailPage:', error);
            this.showError('Failed to load topic details. Please try again later.');
        }
    }
    
    /**
     * Extract parameters from URL
     */
    extractUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        this.topicId = urlParams.get('id');
        this.courseId = urlParams.get('course');
        this.topicIndex = parseInt(urlParams.get('index')) || 0;
        
        // If no direct topic ID, construct from course and index
        if (!this.topicId && this.courseId) {
            this.topicId = `${this.courseId}-topic-${this.topicIndex + 1}`;
        }
    }
    
    /**
     * Load topic data
     */
    async loadTopicData() {
        try {
            // First try to load from concept-details.json
            const conceptResponse = await fetch('data/concept-details.json');
            if (conceptResponse.ok) {
                const conceptData = await conceptResponse.json();
                
                // Look for the topic in concept details
                const conceptKey = `${this.courseId}-detail`;
                if (conceptData.concepts[conceptKey]) {
                    this.topicData = this.createTopicFromConcept(conceptData.concepts[conceptKey]);
                    return;
                }
            }
            
            // Fallback: Load from topic-details.json (we'll create this)
            const topicResponse = await fetch('data/topic-details.json');
            if (topicResponse.ok) {
                const topicData = await topicResponse.json();
                this.topicData = topicData.topics[this.topicId];
            }
            
            // If still no data, create default topic
            if (!this.topicData) {
                this.topicData = this.createDefaultTopic();
            }
            
            console.log('Topic data loaded:', this.topicData);
        } catch (error) {
            console.error('Error loading topic data:', error);
            this.topicData = this.createDefaultTopic();
        }
    }
    
    /**
     * Load course data for context
     */
    async loadCourseData() {
        try {
            const response = await fetch('data/courses.json');
            if (response.ok) {
                const data = await response.json();
                this.courseData = data.courses.find(course => course.id === this.courseId);
                
                // Generate all topics for navigation
                this.generateAllTopics();
            }
        } catch (error) {
            console.error('Error loading course data:', error);
        }
    }
    
    /**
     * Create topic data from concept data
     */
    createTopicFromConcept(conceptData) {
        const timelineItem = conceptData.story.timeline[this.topicIndex] || conceptData.story.timeline[0];
        
        return {
            id: this.topicId,
            title: timelineItem.title,
            subtitle: conceptData.subtitle,
            category: 'Design Patterns',
            difficulty: 'Intermediate',
            duration: '8 min read',
            character: conceptData.character,
            story: {
                introduction: conceptData.story.introduction,
                quote: conceptData.story.quote,
                timeline: conceptData.story.timeline
            },
            technical: conceptData.technicalExplanation,
            codeExamples: conceptData.codeExamples || [],
            realWorldApplications: conceptData.realWorldApplications || [],
            keyTakeaways: this.generateKeyTakeaways(conceptData)
        };
    }
    
    /**
     * Create default topic data
     */
    createDefaultTopic() {
        return {
            id: this.topicId,
            title: 'Programming Concept',
            subtitle: 'Learn through engaging stories',
            category: 'Programming',
            difficulty: 'Intermediate',
            duration: '5 min read',
            character: {
                name: 'Code Master',
                role: 'Programming Guide',
                image: '👨‍💻'
            },
            story: {
                introduction: 'Welcome to this programming concept. We\'ll explore it through an engaging story that makes complex ideas simple to understand.',
                quote: 'The best way to learn programming is through stories that connect abstract concepts to real-world scenarios.',
                timeline: [
                    {
                        title: 'Introduction',
                        description: 'Understanding the basic concept and its importance in programming.'
                    },
                    {
                        title: 'The Problem',
                        description: 'Identifying the challenges that this concept helps solve.'
                    },
                    {
                        title: 'The Solution',
                        description: 'How this concept provides an elegant solution to common problems.'
                    },
                    {
                        title: 'Implementation',
                        description: 'Practical steps to implement this concept in your code.'
                    }
                ]
            },
            technical: {
                definition: 'This is a fundamental programming concept that helps solve common software design challenges.',
                keyCharacteristics: [
                    'Easy to understand and implement',
                    'Widely applicable across different programming languages',
                    'Improves code maintainability and readability',
                    'Follows established best practices'
                ]
            },
            codeExamples: [],
            realWorldApplications: [],
            keyTakeaways: [
                'Understanding this concept improves your programming skills',
                'It can be applied in many real-world scenarios',
                'Practice implementing it in different contexts',
                'Remember the key principles when designing software'
            ]
        };
    }
    
    /**
     * Generate key takeaways from concept data
     */
    generateKeyTakeaways(conceptData) {
        const takeaways = [];
        
        if (conceptData.technicalExplanation.advantages) {
            takeaways.push(...conceptData.technicalExplanation.advantages.slice(0, 3));
        }
        
        if (conceptData.technicalExplanation.whenToUse) {
            takeaways.push(`Use when: ${conceptData.technicalExplanation.whenToUse[0]}`);
        }
        
        if (takeaways.length === 0) {
            takeaways.push(
                'This pattern provides a structured approach to solving common problems',
                'Understanding the implementation details is crucial for proper usage',
                'Consider the trade-offs before applying this pattern',
                'Practice with real examples to master the concept'
            );
        }
        
        return takeaways;
    }
    
    /**
     * Generate all topics for navigation
     */
    generateAllTopics() {
        // This would typically come from the course data or be generated
        // For now, create a simple list based on common patterns
        this.allTopics = [
            { id: `${this.courseId}-topic-1`, title: 'Introduction', index: 0 },
            { id: `${this.courseId}-topic-2`, title: 'The Problem', index: 1 },
            { id: `${this.courseId}-topic-3`, title: 'The Solution', index: 2 },
            { id: `${this.courseId}-topic-4`, title: 'Implementation', index: 3 },
            { id: `${this.courseId}-topic-5`, title: 'Best Practices', index: 4 },
            { id: `${this.courseId}-topic-6`, title: 'Real-world Examples', index: 5 }
        ];
    }
    
    /**
     * Render the complete page
     */
    renderPage() {
        this.updatePageTitle();
        this.updateBreadcrumb();
        this.renderTopicHero();
        this.renderStorySection();
        this.renderTimelineSection();
        this.renderTechnicalSection();
        this.renderCodeExamples();
        this.renderApplications();
        this.renderTakeaways();
        this.renderNavigation();
    }
    
    /**
     * Update page title
     */
    updatePageTitle() {
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) {
            titleElement.textContent = `${this.topicData.title} - LearnByShorts`;
        }
        document.title = `${this.topicData.title} - LearnByShorts`;
    }
    
    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb() {
        const categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
        const courseBreadcrumb = document.getElementById('courseBreadcrumb');
        const topicBreadcrumb = document.getElementById('topicBreadcrumb');
        
        if (categoryBreadcrumb) {
            categoryBreadcrumb.textContent = this.topicData.category;
            categoryBreadcrumb.href = `category.html?id=${this.topicData.category.toLowerCase().replace(' ', '-')}`;
        }
        
        if (courseBreadcrumb && this.courseData) {
            courseBreadcrumb.textContent = this.courseData.title;
            courseBreadcrumb.href = `course-detail.html?id=${this.courseId}`;
        }
        
        if (topicBreadcrumb) {
            topicBreadcrumb.textContent = this.topicData.title;
        }
    }
    
    /**
     * Render topic hero section
     */
    renderTopicHero() {
        // Update meta information
        document.getElementById('topicCategory').textContent = this.topicData.category;
        document.getElementById('topicDifficulty').textContent = this.topicData.difficulty;
        document.getElementById('topicDuration').textContent = this.topicData.duration;
        
        // Update title and subtitle
        document.getElementById('topicTitle').textContent = this.topicData.title;
        document.getElementById('topicSubtitle').textContent = this.topicData.subtitle;
        
        // Update character information
        if (this.topicData.character) {
            document.getElementById('characterAvatar').textContent = this.topicData.character.image || '👨‍💼';
            document.getElementById('characterName').textContent = this.topicData.character.name;
            document.getElementById('characterRole').textContent = this.topicData.character.role;
        }
        
        // Set hero background color based on category
        const heroBackground = document.getElementById('heroBackground');
        const hero = document.getElementById('topicHero');
        if (hero) {
            const colors = {
                'Design Patterns': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'Algorithms': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'Data Structures': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'System Design': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            };
            hero.style.background = colors[this.topicData.category] || colors['Design Patterns'];
        }
    }
    
    /**
     * Render story section
     */
    renderStorySection() {
        const storyIntro = document.getElementById('storyIntro');
        const quoteText = document.getElementById('quoteText');
        const quoteCite = document.getElementById('quoteCite');
        
        if (storyIntro && this.topicData.story.introduction) {
            storyIntro.innerHTML = `<p>${this.topicData.story.introduction}</p>`;
        }
        
        if (quoteText && this.topicData.story.quote) {
            quoteText.textContent = this.topicData.story.quote;
        }
        
        if (quoteCite && this.topicData.character) {
            quoteCite.textContent = `- ${this.topicData.character.name}`;
        }
    }
    
    /**
     * Render timeline section
     */
    renderTimelineSection() {
        const timelineContainer = document.getElementById('timelineContainer');
        if (!timelineContainer || !this.topicData.story.timeline) return;
        
        timelineContainer.innerHTML = '';
        
        this.topicData.story.timeline.forEach((item, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <h3 class="timeline-title">${item.title}</h3>
                <p class="timeline-description">${item.description}</p>
            `;
            timelineContainer.appendChild(timelineItem);
        });
    }
    
    /**
     * Render technical section
     */
    renderTechnicalSection() {
        const definitionElement = document.getElementById('technicalDefinition');
        const characteristicsGrid = document.getElementById('characteristicsGrid');
        
        if (definitionElement && this.topicData.technical.definition) {
            definitionElement.textContent = this.topicData.technical.definition;
        }
        
        if (characteristicsGrid && this.topicData.technical.keyCharacteristics) {
            characteristicsGrid.innerHTML = '';
            
            this.topicData.technical.keyCharacteristics.forEach((characteristic, index) => {
                const card = document.createElement('div');
                card.className = 'characteristic-card';
                card.innerHTML = `
                    <h4 class="characteristic-title">Key Point ${index + 1}</h4>
                    <p class="characteristic-description">${characteristic}</p>
                `;
                characteristicsGrid.appendChild(card);
            });
        }
    }
    
    /**
     * Render code examples
     */
    renderCodeExamples() {
        const codeExamples = document.getElementById('codeExamples');
        if (!codeExamples) return;
        
        if (!this.topicData.codeExamples || this.topicData.codeExamples.length === 0) {
            codeExamples.innerHTML = `
                <div class="code-example">
                    <div class="code-header">
                        <span class="code-title">Example Implementation</span>
                        <span class="code-language">JavaScript</span>
                    </div>
                    <div class="code-content">
                        <pre><code class="language-javascript">// Example code will be added here
// This section demonstrates the practical implementation
// of the concept discussed in this topic

class ExampleImplementation {
    constructor() {
        console.log('Example implementation');
    }
    
    demonstrateConcept() {
        // Implementation details
        return 'Concept demonstrated successfully';
    }
}</code></pre>
                        <button class="copy-button" onclick="this.copyCode(this)">📋</button>
                    </div>
                </div>
            `;
        } else {
            codeExamples.innerHTML = '';
            this.topicData.codeExamples.forEach(example => {
                const exampleElement = this.createCodeExample(example);
                codeExamples.appendChild(exampleElement);
            });
        }
        
        // Re-highlight code
        if (typeof hljs !== 'undefined') {
            hljs.highlightAll();
        }
    }
    
    /**
     * Create code example element
     */
    createCodeExample(example) {
        const exampleDiv = document.createElement('div');
        exampleDiv.className = 'code-example';
        exampleDiv.innerHTML = `
            <div class="code-header">
                <span class="code-title">${example.title}</span>
                <span class="code-language">${example.language}</span>
            </div>
            <div class="code-content">
                <pre><code class="language-${example.language}">${example.code}</code></pre>
                <button class="copy-button" onclick="this.copyCode(this)">📋</button>
            </div>
        `;
        return exampleDiv;
    }
    
    /**
     * Render real-world applications
     */
    renderApplications() {
        const applicationsGrid = document.getElementById('applicationsGrid');
        if (!applicationsGrid) return;
        
        const applications = this.topicData.realWorldApplications.length > 0 
            ? this.topicData.realWorldApplications 
            : this.getDefaultApplications();
        
        applicationsGrid.innerHTML = '';
        applications.forEach(app => {
            const card = document.createElement('div');
            card.className = 'application-card';
            card.innerHTML = `
                <h4 class="application-title">${app.title}</h4>
                <p class="application-description">${app.description}</p>
            `;
            applicationsGrid.appendChild(card);
        });
    }
    
    /**
     * Get default applications
     */
    getDefaultApplications() {
        return [
            {
                title: 'Web Development',
                description: 'This concept is commonly used in web applications to improve code organization and maintainability.'
            },
            {
                title: 'Mobile Apps',
                description: 'Mobile application development benefits from this pattern for better performance and user experience.'
            },
            {
                title: 'Enterprise Software',
                description: 'Large-scale enterprise applications use this concept to manage complexity and ensure scalability.'
            }
        ];
    }
    
    /**
     * Render key takeaways
     */
    renderTakeaways() {
        const takeawaysContent = document.getElementById('takeawaysContent');
        if (!takeawaysContent || !this.topicData.keyTakeaways) return;
        
        takeawaysContent.innerHTML = '';
        this.topicData.keyTakeaways.forEach((takeaway, index) => {
            const item = document.createElement('div');
            item.className = 'takeaway-item';
            item.innerHTML = `
                <span class="takeaway-icon">💡</span>
                <p class="takeaway-text">${takeaway}</p>
            `;
            takeawaysContent.appendChild(item);
        });
    }
    
    /**
     * Render navigation buttons
     */
    renderNavigation() {
        const prevBtn = document.getElementById('prevTopicBtn');
        const nextBtn = document.getElementById('nextTopicBtn');
        const prevTitle = document.getElementById('prevTopicTitle');
        const nextTitle = document.getElementById('nextTopicTitle');
        
        // Find current topic index
        const currentIndex = this.allTopics.findIndex(topic => topic.id === this.topicId);
        
        // Previous topic
        if (currentIndex > 0) {
            const prevTopic = this.allTopics[currentIndex - 1];
            prevTitle.textContent = prevTopic.title;
            prevBtn.onclick = () => this.navigateToTopic(prevTopic);
            prevBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
        }
        
        // Next topic
        if (currentIndex < this.allTopics.length - 1) {
            const nextTopic = this.allTopics[currentIndex + 1];
            nextTitle.textContent = nextTopic.title;
            nextBtn.onclick = () => this.navigateToTopic(nextTopic);
            nextBtn.style.display = 'flex';
        } else {
            nextBtn.style.display = 'none';
        }
    }
    
    /**
     * Navigate to another topic
     */
    navigateToTopic(topic) {
        const url = `topic-detail.html?course=${this.courseId}&index=${topic.index}&id=${topic.id}`;
        window.location.href = url;
    }
    
    /**
     * Generate table of contents
     */
    generateTableOfContents() {
        const tocContainer = document.getElementById('tableOfContents');
        if (!tocContainer) return;
        
        const sections = [
            { id: 'story-section', title: 'The Story' },
            { id: 'timeline-section', title: 'Story Timeline' },
            { id: 'technical-section', title: 'Technical Deep Dive' },
            { id: 'code-section', title: 'Code Examples' },
            { id: 'applications-section', title: 'Real-World Applications' },
            { id: 'takeaways-section', title: 'Key Takeaways' }
        ];
        
        tocContainer.innerHTML = '';
        sections.forEach(section => {
            const link = document.createElement('a');
            link.href = `#${section.id}`;
            link.className = 'toc-item';
            link.textContent = section.title;
            link.onclick = (e) => {
                e.preventDefault();
                this.scrollToSection(section.id);
            };
            tocContainer.appendChild(link);
        });
    }
    
    /**
     * Scroll to section
     */
    scrollToSection(sectionId) {
        const element = document.querySelector(`.${sectionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Bookmark button
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
        }
        
        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareContent());
        }
        
        // Copy code buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-button')) {
                this.copyCode(e.target);
            }
        });
    }
    
    /**
     * Setup scroll tracking for progress
     */
    setupScrollTracking() {
        let ticking = false;
        
        const updateProgress = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            // Update progress bar
            const progressFill = document.getElementById('readingProgress');
            if (progressFill) {
                progressFill.style.width = `${Math.min(scrollPercent, 100)}%`;
            }
            
            // Update circular progress
            const progressRing = document.getElementById('progressRing');
            const progressPercent = document.getElementById('progressPercent');
            if (progressRing && progressPercent) {
                const circumference = 2 * Math.PI * 25;
                const offset = circumference - (scrollPercent / 100) * circumference;
                progressRing.style.strokeDashoffset = offset;
                progressPercent.textContent = `${Math.round(scrollPercent)}%`;
            }
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateProgress);
                ticking = true;
            }
        });
    }
    
    /**
     * Toggle bookmark
     */
    toggleBookmark() {
        // Implementation for bookmarking
        console.log('Bookmark toggled for:', this.topicData.title);
        // You would typically save this to localStorage or send to backend
    }
    
    /**
     * Share content
     */
    shareContent() {
        if (navigator.share) {
            navigator.share({
                title: this.topicData.title,
                text: this.topicData.subtitle,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    }
    
    /**
     * Copy code to clipboard
     */
    copyCode(button) {
        const codeBlock = button.parentElement.querySelector('code');
        if (codeBlock) {
            navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                button.textContent = '✅';
                setTimeout(() => {
                    button.textContent = '📋';
                }, 2000);
            });
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container">
                    <div class="error-message">
                        <h2>Oops! Something went wrong</h2>
                        <p>${message}</p>
                        <button onclick="history.back()" class="btn btn-primary">Go Back</button>
                    </div>
                </div>
            `;
        }
    }
}
