(() => {
    'use strict';

    const CATEGORY_DETAILS = {
        'design-patterns': {
            label: 'Design patterns',
            href: 'design-patterns.html'
        },
        'programming-fundamentals': {
            label: 'Programming fundamentals',
            href: 'modern-skills/'
        },
        algorithms: {
            label: 'Algorithms',
            href: 'modern-skills/'
        },
        javascript: {
            label: 'JavaScript',
            href: 'modern-skills/'
        },
        'system-design': {
            label: 'System design',
            href: 'modern-skills/'
        },
        'computer-science-fundamentals': {
            label: 'Computer science',
            href: 'modern-skills/'
        },
        'artificial-intelligence': {
            label: 'AI skills',
            href: 'ai-era-lab/'
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const courseId = new URLSearchParams(window.location.search).get('id');
        if (!courseId) {
            showError();
            return;
        }

        loadCourseData(courseId);
    });

    async function loadCourseData(courseId) {
        try {
            const response = await fetch('data/courses.json?v=20261107-2');
            if (!response.ok) throw new Error(`Course data returned ${response.status}`);

            const data = await response.json();
            const course = data.courses.find(item => item.id === courseId && item.published !== false);
            if (!course) {
                showError();
                return;
            }

            renderCourse(course);
        } catch (error) {
            console.error('Unable to load course detail:', error);
            showError();
        }
    }

    function renderCourse(course) {
        const topics = buildTopics(course);
        const category = CATEGORY_DETAILS[course.categoryId] || {
            label: 'Courses',
            href: 'modern-skills/'
        };
        const firstTopicUrl = buildTopicUrl(course, 0);
        document.title = `${course.title} | LearnByShorts`;

        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta) descriptionMeta.content = course.description;

        setText('[data-course-title]', course.title);
        setText('[data-course-breadcrumb]', course.title);
        setText('[data-course-description]', course.description);
        setText('[data-course-level]', course.difficulty || 'Progressive');
        setText('[data-course-duration]', course.duration || 'Self-paced');
        setText('[data-course-concepts]', `${topics.length} short stories`);
        setText('[data-course-icon]', course.icon || '↗');
        setText('[data-first-topic-title]', topics[0].title);
        setText('[data-first-topic-description]', topics[0].description);
        setText(
            '[data-final-course-copy]',
            `${topics.length} focused missions are ready for ${course.title}.`
        );

        document.querySelectorAll('[data-course-category]').forEach(element => {
            element.textContent = category.label;
        });

        const categoryLink = document.querySelector('[data-category-link]');
        if (categoryLink) categoryLink.href = category.href;

        document.querySelectorAll('[data-start-course], [data-card-start], [data-final-start]')
            .forEach(link => {
                link.href = firstTopicUrl;
            });

        const playerLink = document.querySelector('[data-player-link]');
        if (playerLink) {
            playerLink.href = `course-player.html?id=${encodeURIComponent(course.id)}`;
        }

        renderTopics(course, topics);
        renderOutcomeList(course.learningOutcomes, [
            `Explain the core decisions behind ${course.title}`,
            'Recognize the tradeoffs before applying the idea',
            'Use the concept in a realistic engineering scenario'
        ]);
        renderList('[data-course-prerequisites]', course.prerequisites, [
            'Basic programming familiarity',
            'Willingness to pause and predict'
        ]);
        renderList('[data-course-tags]', course.tags, ['Software design']);
        updateStructuredData(course, topics.length);
        setupShare(course);

        const page = document.querySelector('[data-course-page]');
        page?.setAttribute('aria-busy', 'false');
    }

    function buildTopics(course) {
        const configuredTopics = getTopicsForCourse(course.id);
        if (configuredTopics.length) return configuredTopics;

        const outcomes = Array.isArray(course.learningOutcomes) ? course.learningOutcomes : [];
        const targetCount = Math.max(1, Number(course.concepts) || outcomes.length || 4);

        return Array.from({ length: targetCount }, (_, index) => {
            const outcome = outcomes[index % Math.max(outcomes.length, 1)];
            return {
                title: outcome || `${course.title}: Practice ${index + 1}`,
                description: outcome
                    ? `Learn the idea in context, make a decision, and prove you can ${lowercaseFirst(outcome)}.`
                    : `Work through a short applied story and explain the decision behind ${course.title}.`,
                duration: '8–12 min'
            };
        });
    }

    function buildTopicUrl(course, index) {
        if (course.id === 'prompt-engineering') {
            return index === 0 ? 'ai-era-lab/' : `ai-era-lab/#level-${index + 1}`;
        }

        return `topic-story.html?course=${encodeURIComponent(course.id)}&index=${index}`;
    }

    function lowercaseFirst(value) {
        if (!value) return '';
        return value.charAt(0).toLowerCase() + value.slice(1);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
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
        'google': [
            { title: 'Alex\'s Google Interview: The Two Sum Challenge', description: 'Follow Alex through their Google phone screen as they tackle the classic Two Sum problem and discover the power of hash maps', duration: '15 min' },
            { title: 'Sarah\'s Google Interview: The Parentheses Puzzle', description: 'Join Sarah as she tackles the Valid Parentheses problem using stack data structure in their Google phone screen', duration: '12 min' }
        ],
        'microsoft': [
            { title: 'John\'s Microsoft Interview: The Reverse String Challenge', description: 'Follow John through his Microsoft phone screen as he tackles the string reversal problem with two-pointer technique', duration: '10 min' },
            { title: 'Lisa\'s Microsoft Interview: The Array Rotation Problem', description: 'Join Lisa as she solves the array rotation challenge using optimal space complexity in her Microsoft interview', duration: '14 min' }
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
            { title: 'AI Literacy and Safe Habits', description: 'Understand models, hallucinations, privacy boundaries, evidence, and when not to use AI', duration: '20 min' },
            { title: 'Prompt Specifications', description: 'Turn a vague wish into an outcome with context, constraints, examples, format, and acceptance criteria', duration: '35 min' },
            { title: 'Context Engineering', description: 'Build the smallest trustworthy context pack using sources, files, examples, schemas, and explicit unknowns', duration: '45 min' },
            { title: 'AI-Assisted Coding', description: 'Orient, plan, patch, test, review, secure, and explain code without losing the mental model', duration: '60 min' },
            { title: 'Structured Outputs and Tools', description: 'Use schemas, function calls, narrow permissions, validation, retries, and human approval', duration: '60 min' },
            { title: 'Reusable AI Skills', description: 'Package expertise with trigger rules, required inputs, checkable workflow steps, safety boundaries, and proof', duration: '75 min' },
            { title: 'Agents and Evaluation', description: 'Build evaluation sets, trace agent loops, measure success, control cost, and recover from tool failures', duration: '90 min' }
        ],
        'operating-systems': [
            { title: "Maya's First Crisis: When Servers Go Silent", description: "Learn OS fundamentals through Maya's first day as SRE when a critical system failure teaches her about kernel architecture", duration: "75 min" },
            { title: "David's Container Conundrum: The Multi-Tasking Mystery", description: "Master process creation, scheduling, and management through David's investigation of container performance issues", duration: "85 min" },
            { title: "Sarah's Memory Leak Hunt: The Case of the Vanishing RAM", description: "Explore virtual memory, paging, and memory allocation through Sarah's debugging of a memory-intensive application", duration: "90 min" },
            { title: "Alex's Storage Saga: The Great Data Migration", description: "Understand file systems, storage management, and I/O through Alex's mission to migrate critical data", duration: "80 min" },
            { title: "Team Crisis: The Deadlock Detective Story", description: "Master synchronization primitives and concurrency through the team's collaborative effort to solve a complex deadlock", duration: "95 min" },
            { title: "Maya's Deep Dive: Journey to the Kernel's Heart", description: "Explore system calls, kernel internals, and OS services through Maya's investigation of system performance bottlenecks", duration: "85 min" },
            { title: "The Team's Triumph: Building the Ultimate System", description: "Apply all OS concepts to design and optimize a high-performance system architecture", duration: "100 min" }
        ],
        'networking-fundamentals': [
            { title: "Elena's First Day: When the Network Goes Dark", description: "Learn networking fundamentals through Elena's first day as a Network Engineer when a complete network outage teaches her about OSI layers, protocols, and network architecture", duration: "60-75 min" },
            { title: "Marcus's Protocol Mystery: The Case of the Slow Application", description: "Master TCP/IP stack and packet analysis through Marcus's investigation of application performance issues that reveal deep protocol-level problems", duration: "70-85 min" },
            { title: "Priya's Routing Challenge: Connecting the Disconnected", description: "Understand routing protocols and network design through Priya's mission to connect multiple office locations with optimal path selection", duration: "80-95 min" },
            { title: "James's Switching Dilemma: The VLAN Virtualization Victory", description: "Master switching concepts and VLANs through James's project to segment and secure the corporate network using modern switching technologies", duration: "75-90 min" },
            { title: "Team Crisis: The Security Breach That Changed Everything", description: "Learn network security through the team's collaborative response to a sophisticated attack that teaches firewalls, VPNs, and security protocols", duration: "85-100 min" },
            { title: "Elena's Wireless Evolution: From Chaos to Connectivity", description: "Master wireless networking through Elena's project to design and deploy enterprise WiFi that supports thousands of users and IoT devices", duration: "80-95 min" },
            { title: "The Team's Cloud Journey: Bridging On-Premises and Cloud", description: "Apply all networking knowledge to design hybrid cloud connectivity that seamlessly integrates on-premises and cloud infrastructure", duration: "90-105 min" }
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
        'prompt-engineering': ['🧭', '🎯', '📚', '💻', '🔧', '🧩', '📊']
    };
    
    const icons = iconConfigs[courseId] || ['📚'];
    return icons[index] || '📚';
}

    function renderTopics(course, topics) {
        const container = document.querySelector('[data-course-modules]');
        if (!container) return;

        container.innerHTML = topics.map((topic, index) => {
            const number = String(index + 1).padStart(2, '0');
            const icon = getTopicIcon(course.id, index);
            const url = buildTopicUrl(course, index);

            return `
                <li class="course-module">
                    <a href="${escapeHtml(url)}">
                        <span class="course-module-number">${number}</span>
                        <div class="course-module-copy">
                            <h3><span aria-hidden="true">${escapeHtml(icon)}</span> ${escapeHtml(topic.title)}</h3>
                            <p>${escapeHtml(topic.description)}</p>
                        </div>
                        <span class="course-module-meta">
                            ${escapeHtml(topic.duration || '8–12 min')}
                            <i aria-hidden="true">→</i>
                        </span>
                    </a>
                </li>
            `;
        }).join('');
    }

    function renderList(selector, values, fallback) {
        const container = document.querySelector(selector);
        if (!container) return;

        const items = Array.isArray(values) && values.length ? values : fallback;
        container.innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    }

    function renderOutcomeList(values, fallback) {
        const container = document.querySelector('[data-learning-outcomes]');
        if (!container) return;

        const items = Array.isArray(values) && values.length ? values : fallback;
        container.innerHTML = items.map(item => `
            <li>
                <span class="course-outcome-mark" aria-hidden="true">✓</span>
                <span>${escapeHtml(item)}</span>
            </li>
        `).join('');
    }

    function setupShare(course) {
        const button = document.querySelector('[data-share-course]');
        const status = document.querySelector('[data-share-status]');
        if (!button || !status) return;

        button.addEventListener('click', async () => {
            const shareData = {
                title: `${course.title} | LearnByShorts`,
                text: `Learn ${course.title} through short stories and practical decisions.`,
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    status.textContent = 'Course shared.';
                    return;
                }

                await navigator.clipboard.writeText(window.location.href);
                status.textContent = 'Course link copied.';
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    status.textContent = 'Copy the course URL from your browser to share it.';
                }
            }
        });
    }

    function updateStructuredData(course, topicCount) {
        const script = document.getElementById('courseStructuredData');
        if (!script) return;

        script.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: course.title,
            description: course.description,
            provider: {
                '@type': 'EducationalOrganization',
                name: 'LearnByShorts',
                url: 'https://www.learnbyshorts.com/'
            },
            educationalLevel: course.difficulty || 'Progressive',
            timeRequired: course.duration || undefined,
            numberOfCredits: topicCount,
            isAccessibleForFree: true,
            inLanguage: 'en'
        });
    }

    function showError() {
        const page = document.querySelector('[data-course-page]');
        const errorSection = document.querySelector('[data-course-error]');

        page?.querySelectorAll(
            '.course-detail-hero, .course-proof-strip, .course-overview-section, ' +
            '.course-modules-section, .course-method-section, .course-final-section'
        ).forEach(section => {
            section.hidden = true;
        });

        if (errorSection) errorSection.hidden = false;
        page?.setAttribute('aria-busy', 'false');
        document.title = 'Course not found | LearnByShorts';
    }
})();
