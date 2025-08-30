/**
 * Enhanced TopicDetailPage - Configurable storytelling-focused topic detail page
 * Loads rich content from JSON configuration files
 */
class EnhancedTopicDetailPage {
    constructor() {
        this.topicId = null;
        this.courseId = null;
        this.topicData = null;
        this.config = {
            dataSource: 'data/topic-details.json',
            enableQuiz: true,
            enableProgress: true,
            theme: 'learnbyshorts'
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Initializing Enhanced TopicDetailPage');
            
            this.extractUrlParameters();
            
            if (!this.topicId) {
                this.showError('Topic ID not found. Please check the URL.');
                return;
            }
            
            await this.loadTopicData();
            
            if (!this.topicData) {
                this.showError('Topic content not found.');
                return;
            }
            
            this.renderPage();
            this.setupEventListeners();
            this.setupScrollTracking();
            
            console.log('✅ Enhanced TopicDetailPage initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize:', error);
            this.showError('Failed to load topic details.');
        }
    }
    
    extractUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        this.topicId = urlParams.get('id') || 'singleton-pattern-intro';
        this.courseId = urlParams.get('course') || 'singleton-pattern';
        console.log(`📖 Loading topic: ${this.topicId}`);
    }
    
    async loadTopicData() {
        try {
            const response = await fetch(this.config.dataSource);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.topicData = data.topics[this.topicId];
            
            if (this.topicData) {
                console.log('📚 Topic data loaded:', this.topicData.title);
            } else {
                console.warn('⚠️ Topic not found, using fallback');
                this.topicData = this.createFallbackTopic();
            }
        } catch (error) {
            console.error('❌ Error loading topic data:', error);
            this.topicData = this.createFallbackTopic();
        }
    }
    
    createFallbackTopic() {
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
                introduction: 'Welcome to this programming concept. We\'ll explore it through an engaging story.',
                quote: 'The best way to learn programming is through stories.',
                timeline: [
                    {
                        title: 'Introduction',
                        description: 'Understanding the basic concept.'
                    }
                ]
            },
            technical: {
                definition: 'This is a fundamental programming concept.',
                keyCharacteristics: ['Easy to understand', 'Widely applicable']
            },
            codeExamples: [],
            realWorldApplications: [],
            keyTakeaways: []
        };
    }
    
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
    
    updatePageTitle() {
        document.title = `${this.topicData.title} - LearnByShorts`;
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) {
            titleElement.textContent = `${this.topicData.title} - LearnByShorts`;
        }
    }
    
    updateBreadcrumb() {
        const categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
        const courseBreadcrumb = document.getElementById('courseBreadcrumb');
        const topicBreadcrumb = document.getElementById('topicBreadcrumb');
        
        if (categoryBreadcrumb) {
            categoryBreadcrumb.textContent = this.topicData.category;
            categoryBreadcrumb.href = `category.html?id=${this.topicData.category.toLowerCase().replace(' ', '-')}`;
        }
        
        if (courseBreadcrumb) {
            courseBreadcrumb.textContent = this.courseId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            courseBreadcrumb.href = `course-detail.html?id=${this.courseId}`;
        }
        
        if (topicBreadcrumb) {
            topicBreadcrumb.textContent = this.topicData.title;
        }
    }
    
    renderTopicHero() {
        // Update meta information
        this.updateElement('topicCategory', this.topicData.category);
        this.updateElement('topicDifficulty', this.topicData.difficulty);
        this.updateElement('topicDuration', this.topicData.duration);
        
        // Update title and subtitle
        this.updateElement('topicTitle', this.topicData.title);
        this.updateElement('topicSubtitle', this.topicData.subtitle);
        
        // Update character information
        if (this.topicData.character) {
            this.updateElement('characterAvatar', this.topicData.character.image || '👨‍💼');
            this.updateElement('characterName', this.topicData.character.name);
            this.updateElement('characterRole', this.topicData.character.role);
        }
        
        // Set hero background
        this.setHeroBackground();
    }
    
    setHeroBackground() {
        const hero = document.getElementById('topicHero');
        if (hero) {
            const colors = {
                'Design Patterns': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'Algorithms': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'JavaScript': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'React': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            };
            hero.style.background = colors[this.topicData.category] || colors['Design Patterns'];
        }
    }
    
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
                ${item.details ? `<div class="timeline-details">${item.details}</div>` : ''}
                ${item.lesson ? `<div class="timeline-lesson"><strong>💡 Programming Lesson:</strong> ${item.lesson}</div>` : ''}
            `;
            timelineContainer.appendChild(timelineItem);
        });
    }
    
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
    
    renderCodeExamples() {
        const codeExamples = document.getElementById('codeExamples');
        if (!codeExamples) return;
        
        if (!this.topicData.codeExamples || this.topicData.codeExamples.length === 0) {
            codeExamples.innerHTML = '<p class="no-content">Code examples will be added soon.</p>';
            return;
        }
        
        codeExamples.innerHTML = '';
        this.topicData.codeExamples.forEach(example => {
            const exampleElement = this.createCodeExample(example);
            codeExamples.appendChild(exampleElement);
        });
        
        // Re-highlight code
        if (typeof hljs !== 'undefined') {
            hljs.highlightAll();
        }
    }
    
    createCodeExample(example) {
        const exampleDiv = document.createElement('div');
        exampleDiv.className = 'code-example';
        exampleDiv.innerHTML = `
            <div class="code-header">
                <div class="code-info">
                    <span class="code-title">${example.title}</span>
                    <span class="code-language">${example.language}</span>
                </div>
                <button class="copy-button" onclick="this.copyCode(this)">📋</button>
            </div>
            ${example.description ? `<div class="code-description">${example.description}</div>` : ''}
            <div class="code-content">
                <pre><code class="language-${example.language}">${example.code}</code></pre>
            </div>
        `;
        return exampleDiv;
    }
    
    renderApplications() {
        const applicationsGrid = document.getElementById('applicationsGrid');
        if (!applicationsGrid) return;
        
        const applications = this.topicData.realWorldApplications || [];
        
        if (applications.length === 0) {
            applicationsGrid.innerHTML = '<p class="no-content">Real-world applications will be added soon.</p>';
            return;
        }
        
        applicationsGrid.innerHTML = '';
        applications.forEach(app => {
            const card = document.createElement('div');
            card.className = 'application-card';
            card.innerHTML = `
                <div class="app-icon">${app.icon || '🌍'}</div>
                <h4 class="application-title">${app.title}</h4>
                <p class="application-description">${app.description}</p>
                ${app.example ? `<div class="app-example"><strong>Example:</strong> ${app.example}</div>` : ''}
            `;
            applicationsGrid.appendChild(card);
        });
    }
    
    renderTakeaways() {
        const takeawaysContent = document.getElementById('takeawaysContent');
        if (!takeawaysContent) return;
        
        const takeaways = this.topicData.keyTakeaways || [];
        
        if (takeaways.length === 0) {
            takeawaysContent.innerHTML = '<p class="no-content">Key takeaways will be added soon.</p>';
            return;
        }
        
        takeawaysContent.innerHTML = '';
        takeaways.forEach((takeaway, index) => {
            const item = document.createElement('div');
            item.className = 'takeaway-item';
            
            if (typeof takeaway === 'string') {
                item.innerHTML = `
                    <span class="takeaway-icon">💡</span>
                    <p class="takeaway-text">${takeaway}</p>
                `;
            } else {
                item.innerHTML = `
                    <span class="takeaway-icon">${takeaway.icon || '💡'}</span>
                    <div class="takeaway-content">
                        <h4 class="takeaway-title">${takeaway.point}</h4>
                        <p class="takeaway-text">${takeaway.explanation}</p>
                    </div>
                `;
            }
            
            takeawaysContent.appendChild(item);
        });
    }
    
    renderNavigation() {
        const prevBtn = document.getElementById('prevTopicBtn');
        const nextBtn = document.getElementById('nextTopicBtn');
        const prevTitle = document.getElementById('prevTopicTitle');
        const nextTitle = document.getElementById('nextTopicTitle');
        
        // Handle previous topic
        if (this.topicData.previousTopic) {
            if (prevTitle) prevTitle.textContent = this.topicData.previousTopic.title;
            if (prevBtn) {
                prevBtn.style.display = 'flex';
                prevBtn.onclick = () => this.navigateToTopic(this.topicData.previousTopic.id);
            }
        } else {
            if (prevBtn) prevBtn.style.display = 'none';
        }
        
        // Handle next topic
        if (this.topicData.nextTopic) {
            if (nextTitle) nextTitle.textContent = this.topicData.nextTopic.title;
            if (nextBtn) {
                nextBtn.style.display = 'flex';
                nextBtn.onclick = () => this.navigateToTopic(this.topicData.nextTopic.id);
            }
        } else {
            if (nextBtn) nextBtn.style.display = 'none';
        }
    }
    
    navigateToTopic(topicId) {
        const url = `topic-detail.html?course=${this.courseId}&id=${topicId}`;
        window.location.href = url;
    }
    
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
        
        // Copy code functionality
        window.copyCode = (button) => {
            const codeBlock = button.closest('.code-example').querySelector('code');
            if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    button.textContent = '✅';
                    setTimeout(() => {
                        button.textContent = '📋';
                    }, 2000);
                });
            }
        };
    }
    
    setupScrollTracking() {
        let ticking = false;
        
        const updateProgress = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);
            
            // Update progress bar
            const progressFill = document.getElementById('readingProgress');
            if (progressFill) {
                progressFill.style.width = `${scrollPercent}%`;
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
    
    toggleBookmark() {
        console.log('Bookmark toggled for:', this.topicData.title);
        // Implementation for bookmarking
    }
    
    shareContent() {
        if (navigator.share) {
            navigator.share({
                title: this.topicData.title,
                text: this.topicData.subtitle,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    }
    
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element && content) {
            element.textContent = content;
        }
    }
    
    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container">
                    <div class="error-message" style="text-align: center; padding: 4rem 2rem;">
                        <h2 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Oops! Something went wrong</h2>
                        <p style="color: #64748b; margin-bottom: 2rem;">${message}</p>
                        <button onclick="history.back()" class="btn btn-primary">← Go Back</button>
                    </div>
                </div>
            `;
        }
    }
}
