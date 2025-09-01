// Simple CourseDetailPage that works immediately
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
        showError('Course not found');
        return;
    }
    
    // Load course data
    loadCourseData(courseId);
});

async function loadCourseData(courseId) {
    try {
        const response = await fetch('data/courses.json');
        const data = await response.json();
        const course = data.courses.find(c => c.id === courseId);
        
        if (!course) {
            showError('Course not found');
            return;
        }
        
        renderCourse(course);
    } catch (error) {
        console.error('Error loading course:', error);
        showError('Failed to load course data');
    }
}

function renderCourse(course) {
    // Update breadcrumbs
    updateBreadcrumbs(course);
    
    // Render slider
    renderCourseSlider(course);
    
    // Render topics
    renderTopics(course);
    
    // Render learning outcomes
    renderLearningOutcomes(course);
    
    // Render prerequisites
    renderPrerequisites(course);
}

function updateBreadcrumbs(course) {
    const categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
    const courseBreadcrumb = document.getElementById('courseBreadcrumb');
    
    // Category mapping
    const categoryNames = {
        'design-patterns': 'Design Patterns',
        'algorithms': 'Algorithms',
        'javascript': 'JavaScript',
        'system-design': 'System Design'
    };
    
    if (categoryBreadcrumb) {
        const categoryName = categoryNames[course.categoryId] || 'Courses';
        categoryBreadcrumb.textContent = categoryName;
        categoryBreadcrumb.href = 'index.html#courses';
    }
    
    if (courseBreadcrumb) {
        courseBreadcrumb.textContent = course.title || 'Course';
    }
}

function renderCourseSlider(course) {
    // Get course-specific topics
    const topics = getTopicsForCourse(course.id);
    
    const slides = [
        {
            type: 'intro',
            icon: course.icon || '🏗️',
            title: course.title,
            description: course.description,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        ...topics.map((topic, index) => ({
            type: 'topic',
            icon: getTopicIcon(course.id, index),
            title: topic.title,
            description: topic.description,
            duration: topic.duration,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            topicIndex: index
        }))
    ];

    // Render progress dots
    const progressDots = document.getElementById('progressDots');
    progressDots.innerHTML = slides.map((_, index) => 
        `<div class="progress-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`
    ).join('');

    // Render slides
    const sliderContent = document.getElementById('sliderContent');
    sliderContent.innerHTML = slides.map((slide, index) => `
        <div class="slide ${slide.type} ${index === 0 ? 'active' : ''}" data-index="${index}">
            <div class="slide-background" style="background: ${slide.background}"></div>
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <div class="slide-icon">${slide.icon}</div>
                <h2 class="slide-title">${slide.title}</h2>
                <p class="slide-description">${slide.description}</p>
                
                <div class="slide-actions">
                    ${slide.type === 'intro' ? `
                        <button class="slide-btn primary" onclick="startCourse('${course.id}')">
                            <i class="fas fa-play"></i>
                            Start Learning
                        </button>
                    ` : `
                        <button class="slide-btn primary" onclick="goToTopic('${course.id}', ${slide.topicIndex})">
                            <i class="fas fa-book-open"></i>
                            Read Story
                        </button>
                    `}
                </div>
            </div>
        </div>
    `).join('');

    // Setup slider controls
    setupSliderControls(slides.length);
}

let currentSlide = 0;
let totalSlides = 0;

function setupSliderControls(slideCount) {
    totalSlides = slideCount;
    
    document.getElementById('prevSlide').addEventListener('click', () => {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    });
    
    document.getElementById('nextSlide').addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        }
    });
    
    updateSliderControls();
}

function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    
    // Update slides
    document.querySelectorAll('.slide').forEach((slide, i) => {
        slide.classList.remove('active', 'prev');
        if (i === index) {
            slide.classList.add('active');
        } else if (i < index) {
            slide.classList.add('prev');
        }
    });
    
    // Update progress dots
    document.querySelectorAll('.progress-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    currentSlide = index;
    updateSliderControls();
}

function updateSliderControls() {
    document.getElementById('prevSlide').disabled = currentSlide === 0;
    document.getElementById('nextSlide').disabled = currentSlide === totalSlides - 1;
}

function startCourse(courseId) {
    window.location.href = `topic-story.html?course=${courseId}&index=0`;
}

function goToTopic(courseId, topicIndex) {
    window.location.href = `topic-story.html?course=${courseId}&index=${topicIndex}`;
}

function previewCourse(courseId) {
    window.location.href = `course-story-viewer.html?id=${courseId}`;
}

function getTopicsForCourse(courseId) {
    const topicConfigs = {
        'singleton-pattern': [
            { title: 'The Office Chaos', description: 'Meet Sharma Ji and discover the printer management crisis that started it all', duration: '8 min' },
            { title: 'The One Manager Rule', description: 'Learn how Sharma Ji implements the Singleton pattern to solve the chaos', duration: '10 min' },
            { title: 'Building the Perfect Singleton', description: 'Master thread-safe implementation with real code examples', duration: '12 min' },
            { title: 'The Singleton Traps', description: 'Avoid common pitfalls like reflection attacks and serialization issues', duration: '9 min' },
            { title: 'Beyond Singleton', description: 'Explore modern alternatives and when NOT to use Singleton', duration: '11 min' },
            { title: 'Singleton Mastery', description: 'Become the office Singleton expert with best practices', duration: '6 min' }
        ],
        'factory-method-pattern': [
            { title: 'The Pizza Shop Crisis', description: 'Maya\'s hard-coded pizza creation nightmare and the chaos of if-else chains', duration: '8 min' },
            { title: 'The Pizza Factory Solution', description: 'Raj introduces the Factory Method pattern with abstract PizzaStore', duration: '10 min' },
            { title: 'Scaling the Pizza Empire', description: 'Multi-city expansion with unique pizza styles and international franchising', duration: '12 min' },
            { title: 'Factory Method vs Simple Factory', description: 'Consultant challenges Maya\'s approach - when to use each pattern', duration: '9 min' },
            { title: 'Real-World Factory Applications', description: 'Gaming character factories, database connections, and UI components', duration: '11 min' },
            { title: 'Testing and Best Practices', description: 'Mock factories, dependency injection, and testing strategies', duration: '8 min' },
            { title: 'Factory Method Mastery', description: 'Maya\'s conference presentation and decision framework', duration: '7 min' }
        ],
        'abstract-factory-pattern': [
            { title: 'The Gaming Empire Crisis', description: 'Alex\'s cross-platform nightmare with UI components and platform chaos', duration: '9 min' },
            { title: 'The UI Factory Solution', description: 'Emma introduces Abstract Factory with platform-specific component families', duration: '10 min' },
            { title: 'Console and VR Expansion', description: 'Adding console and VR support with multi-platform testing', duration: '12 min' },
            { title: 'Abstract Factory vs Factory Method', description: 'Dr. Martinez challenges the approach - pattern comparison', duration: '8 min' },
            { title: 'Real-World Abstract Factories', description: 'E-commerce payment systems, document generation, and database abstraction', duration: '10 min' },
            { title: 'Abstract Factory Mastery', description: 'Alex\'s keynote presentation and component family wisdom', duration: '6 min' }
        ],
        'builder-pattern': [
            { title: 'The Custom Computer Chaos', description: 'Sofia\'s constructor hell with complex computer configurations', duration: '8 min' },
            { title: 'The Computer Builder Solution', description: 'Carlos introduces Builder pattern with fluent ComputerBuilder interface', duration: '10 min' },
            { title: 'Advanced Builder Techniques', description: 'Enterprise expansion with Director pattern and configuration templates', duration: '12 min' },
            { title: 'Builder vs Other Patterns', description: 'Dr. Kim challenges the approach - when to use Builder vs other patterns', duration: '9 min' },
            { title: 'Real-World Builder Applications', description: 'SQL Query Builder, HTTP Request Builder, and Email Builder systems', duration: '8 min' },
            { title: 'Builder Pattern Mastery', description: 'Sofia\'s keynote presentation and fluent interface wisdom', duration: '6 min' }
        ],
        'adapter-pattern': [
            { title: 'The Integration Nightmare', description: 'Maya\'s legacy system crisis with incompatible payment interfaces', duration: '8 min' },
            { title: 'The Payment Adapter Solution', description: 'David introduces Adapter pattern with clean interface translation', duration: '10 min' },
            { title: 'Object vs Class Adapters', description: 'Jake\'s static legacy system and comparison of adapter approaches', duration: '9 min' },
            { title: 'Real-World Adapter Applications', description: 'Database adapters, API integration, and file format conversion', duration: '8 min' },
            { title: 'Advanced Adapter Techniques', description: 'Multi-system architecture with caching and retry adapters', duration: '10 min' },
            { title: 'Adapter Pattern Mastery', description: 'Maya\'s conference presentation and integration expertise', duration: '7 min' }
        ],
        'decorator-pattern': [
            { title: 'The Coffee Shop Customization Crisis', description: 'Emma\'s coffee shop dream meets the nightmare of infinite customizations', duration: '8 min' },
            { title: 'The Coffee Decorator Solution', description: 'Dr. Martinez introduces Decorator pattern with elegant coffee layering', duration: '10 min' },
            { title: 'Scaling the Coffee Empire', description: 'Adding new features effortlessly with oat milk, seasonal syrups, and iced options', duration: '9 min' },
            { title: 'Decorator vs Inheritance Showdown', description: 'Marcus challenges Emma\'s approach in an epic coding battle', duration: '8 min' },
            { title: 'Real-World Decorator Applications', description: 'UI components, data processing pipelines, and HTTP client enhancement', duration: '9 min' },
            { title: 'Decorator Pattern Mastery', description: 'Emma\'s conference keynote and design pattern wisdom', duration: '8 min' }
        ],
        'observer-pattern': [
            { title: 'The Newsletter Nightmare', description: 'Sarah\'s startup dream turns into manual notification chaos with 500 subscribers', duration: '7 min' },
            { title: 'The Observer Solution', description: 'Mike introduces Observer pattern with automated notification magic', duration: '8 min' },
            { title: 'Scaling the Notification Empire', description: 'Multi-channel publishing with smart subscribers and personalized content', duration: '9 min' },
            { title: 'Observer vs Push-Pull Dilemma', description: 'Carlos optimizes performance with pull model for 50,000 subscribers', duration: '8 min' },
            { title: 'Real-World Observer Applications', description: 'MVC frameworks, e-commerce systems, gaming, and stock trading', duration: '9 min' },
            { title: 'Observer Pattern Mastery', description: 'Sarah\'s conference keynote and notification empire success', duration: '7 min' }
        ],
        'strategy-pattern': [
            { title: 'The Payment Processing Nightmare', description: 'Alex\'s e-commerce dream meets the if-else monster of payment methods', duration: '6 min' },
            { title: 'The Strategy Solution', description: 'Jordan introduces Strategy pattern with payment specialists approach', duration: '7 min' },
            { title: 'Expanding Payment Empire', description: 'Global growth with crypto, BNPL, and international payment strategies', duration: '6 min' },
            { title: 'Strategy vs State Confusion', description: 'Marcus clarifies the difference between Strategy and State patterns', duration: '6 min' },
            { title: 'Real-World Strategy Applications', description: 'Shipping, discounts, compression, and sorting algorithm strategies', duration: '6 min' },
            { title: 'Strategy Pattern Mastery', description: 'Alex\'s conference keynote and e-commerce empire success', duration: '4 min' }
        ],
        'command-pattern': [
            { title: 'The Smart Home Remote Control Chaos', description: 'Maya\'s smart home dream becomes a 12-remote nightmare with hardcoded universal remote', duration: '8 min' },
            { title: 'The Command Pattern Solution', description: 'David introduces Command pattern with smart remote and undo magic', duration: '9 min' },
            { title: 'Macro Commands and Smart Scenes', description: 'Movie night, good morning, and party mode automation with macro commands', duration: '8 min' },
            { title: 'Command Queue and Scheduling', description: 'Time-based automation with command scheduling and daily routines', duration: '7 min' },
            { title: 'Real-World Command Applications', description: 'Text editors, databases, GUI systems, and game development', duration: '8 min' },
            { title: 'Command Pattern Mastery', description: 'Maya\'s conference keynote and CommandHome Pro success', duration: '5 min' }
        ],
        'facade-pattern': [
            { title: 'The Microservice Integration Nightmare', description: 'Ryan\'s frontend hell with 8 different microservice APIs and authentication chaos', duration: '6 min' },
            { title: 'The Facade Solution', description: 'Marcus introduces Facade pattern with unified dashboard interface', duration: '7 min' },
            { title: 'Advanced Facade Architectures', description: 'Multi-client facades for web, mobile, and API with specialized data formats', duration: '6 min' },
            { title: 'Facade vs Adapter Confusion', description: 'Jessica clarifies the difference between Facade and Adapter patterns', duration: '5 min' },
            { title: 'Real-World Facade Applications', description: 'Database access, file processing, and e-commerce checkout systems', duration: '5 min' },
            { title: 'Facade Pattern Mastery', description: 'Ryan\'s conference keynote and API architecture empire success', duration: '3 min' }
        ],
        'bridge-pattern': [
            { title: 'The Cross-Platform Inheritance Explosion', description: 'Sofia\'s mobile app nightmare with exponential class growth and inheritance chaos', duration: '7 min' },
            { title: 'The Bridge Pattern Solution', description: 'Elena introduces Bridge pattern separating abstraction from implementation', duration: '8 min' },
            { title: 'Advanced Bridge Patterns', description: 'Multi-dimensional flexibility with platform-independent notification systems', duration: '8 min' },
            { title: 'Bridge vs Adapter Distinction', description: 'Understanding when to use Bridge vs Adapter for system architecture', duration: '6 min' },
            { title: 'Real-World Bridge Applications', description: 'Cross-platform development, database drivers, and graphics rendering systems', duration: '7 min' },
            { title: 'Bridge Pattern Mastery', description: 'Sofia\'s conference keynote and cross-platform architecture expertise', duration: '6 min' }
        ],
        'chain-of-responsibility-pattern': [
            { title: 'The Customer Support Chaos', description: 'Marcus\'s support nightmare with monolithic if-else chains and 500 daily tickets', duration: '8 min' },
            { title: 'The Chain of Responsibility Solution', description: 'Elena introduces Chain pattern with specialized support handler hierarchy', duration: '9 min' },
            { title: 'Advanced Chain Patterns', description: 'Multiple handler processing with logging, metrics, and security integration', duration: '10 min' },
            { title: 'Real-World Chain Implementation', description: 'Production system with AI-powered handlers and dynamic chain reconfiguration', duration: '8 min' },
            { title: 'Chain of Responsibility Mastery', description: 'Marcus\'s keynote presentation and support system transformation success', duration: '6 min' }
        ],
        'prompt-engineering': [
            { title: 'The AI Miscommunication Crisis', description: 'Arjun\'s marketing disasters with ChatGPT and the chaos of vague prompts', duration: '8 min' },
            { title: 'The CLEAR Framework Discovery', description: 'Priya introduces systematic prompt engineering with Context, Length, Examples, Audience, Role', duration: '10 min' },
            { title: 'Advanced Prompt Techniques', description: 'Chain-of-thought reasoning, few-shot learning, and role-playing mastery', duration: '12 min' },
            { title: 'Creative AI Collaboration', description: 'Content creation workflows for blogs, social media, and marketing campaigns', duration: '10 min' },
            { title: 'Business Applications Mastery', description: 'Email automation, report generation, and data analysis with AI assistants', duration: '11 min' },
            { title: 'Multi-Model Expertise', description: 'GPT-4, Claude, Gemini differences and optimization strategies for each platform', duration: '9 min' },
            { title: 'Ethical AI Practices', description: 'Bias prevention, responsible AI usage, and building inclusive prompt libraries', duration: '8 min' },
            { title: 'The Prompt Engineering Empire', description: 'Arjun becomes company AI consultant and transforms his career path', duration: '7 min' }
        ]
    };
    
    return topicConfigs[courseId] || [];
}

function getTopicIcon(courseId, index) {
    const iconConfigs = {
        'singleton-pattern': ['🏢', '👨‍💼', '🔧', '⚠️', '🚀', '🎯'],
        'factory-method-pattern': ['🍕', '🏭', '🌍', '🤔', '🎮', '🧪', '🏆'],
        'abstract-factory-pattern': ['🎮', '🏗️', '🎯', '⚖️', '🌟', '👑'],
        'builder-pattern': ['💻', '👷', '🏢', '⚖️', '🔧', '🏆'],
        'adapter-pattern': ['💥', '🔌', '🔄', '🌐', '🏗️', '🎯'],
        'decorator-pattern': ['☕', '🎨', '🏪', '⚔️', '🌍', '🎤'],
        'observer-pattern': ['📧', '📢', '🚀', '⚡', '🌍', '🏆'],
        'strategy-pattern': ['💳', '🎯', '🌍', '🤔', '🔧', '🏆'],
        'command-pattern': ['📱', '🎮', '🎬', '⏰', '🌍', '🏆'],
        'facade-pattern': ['💥', '🏛️', '🏗️', '🤔', '🌍', '🏆'],
        'bridge-pattern': ['💥', '🌉', '🔧', '⚖️', '🌍', '🏆'],
        'chain-of-responsibility-pattern': ['🚨', '⛓️', '🔧', '🏭', '🏆'],
        'prompt-engineering': ['🤖', '💬', '🧠', '⚡', '🎯', '🚀', '🔮', '👑']
    };
    
    const icons = iconConfigs[courseId] || ['📚'];
    return icons[index] || '📚';
}

function renderTopics(course) {
    const container = document.getElementById('courseTopics');
    const topics = getTopicsForCourse(course.id);
    
    container.innerHTML = topics.map((topic, i) => `
        <div class="topic-card" onclick="goToTopic('${course.id}', ${i})">
            <div class="topic-number">${getTopicIcon(course.id, i)}</div>
            <div class="topic-info">
                <h3 class="topic-title">${topic.title}</h3>
                <p class="topic-description">${topic.description}</p>
            </div>
            <div class="topic-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `).join('');
}

function renderLearningOutcomes(course) {
    const container = document.getElementById('learningObjectives');
    const outcomes = course.learningOutcomes || [
        'Understand the Singleton pattern structure and purpose',
        'Implement thread-safe Singleton in multiple ways',
        'Identify when to use Singleton vs alternatives',
        'Avoid common Singleton pitfalls and anti-patterns',
        'Apply Singleton pattern in real-world scenarios'
    ];
    
    container.innerHTML = `<div class="outcome-grid">
        ${outcomes.map(outcome => `
            <div class="outcome-item">
                <div class="outcome-icon"><i class="fas fa-check"></i></div>
                <div class="outcome-text">${outcome}</div>
            </div>
        `).join('')}
    </div>`;
}

function renderDescription(course) {
    const container = document.getElementById('detailedDescription');
    container.innerHTML = `
        <p><strong>Welcome to the most engaging way to learn the Singleton Design Pattern!</strong></p>
        
        <p>Join Sharma Ji, a senior developer, as he navigates through office chaos caused by multiple printer managers. Through his hilarious adventures, you'll master one of the most important design patterns in software development.</p>
        
        <h3>🎭 Story-Based Learning</h3>
        <p>Each topic is presented as an engaging story with real characters, office scenarios, and practical problems. You'll learn through narrative, making complex concepts memorable and fun.</p>
        
        <h3>💻 Real Code Examples</h3>
        <p>Every story includes working code examples, from basic implementation to advanced thread-safe versions. All code is production-ready and follows industry best practices.</p>
        
        <h3>🎯 Practical Application</h3>
        <p>Learn not just HOW to implement Singleton, but WHEN to use it, WHEN to avoid it, and what alternatives exist in modern software development.</p>
        
        <h3>📚 Complete Coverage</h3>
        <ul>
            <li>Basic Singleton implementation</li>
            <li>Thread-safe variations (synchronized, double-checked locking, enum)</li>
            <li>Common pitfalls (reflection, serialization, cloning)</li>
            <li>Modern alternatives (dependency injection, service locators)</li>
            <li>Real-world use cases and anti-patterns</li>
        </ul>
        
        <p><em>By the end of this course, you'll not only understand Singleton inside and out, but you'll also know when to use it and when to choose better alternatives.</em></p>
    `;
}

function renderPrerequisites(course) {
    const container = document.getElementById('coursePrerequisites');
    const prerequisites = course.prerequisites || [
        'Basic understanding of Object-Oriented Programming',
        'Familiarity with classes and objects',
        'Basic knowledge of Java or similar language'
    ];
    
    container.innerHTML = prerequisites.map(prereq => `
        <div class="prerequisite-item">
            <i class="fas fa-check-circle"></i>
            <span>${prereq}</span>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    const labels = {
        'available': 'Start',
        'completed': 'Completed', 
        'in-progress': 'Continue',
        'locked': 'Locked'
    };
    return labels[status] || status;
}

function goToTopic(courseId, index) {
    window.location.href = `topic-story.html?course=${courseId}&index=${index}`;
}

function showError(message) {
    document.querySelector('.main-content').innerHTML = `
        <div class="error-message" style="text-align: center; padding: 3rem; background: #fee2e2; border-radius: 12px; border: 1px solid #fecaca;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h3 style="color: #dc2626; margin-bottom: 1rem;">Oops! Something went wrong</h3>
            <p style="color: #7f1d1d; margin-bottom: 1.5rem;">${message}</p>
            <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">Try Again</button>
        </div>
    `;
}
