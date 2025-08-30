/**
 * ConceptRenderer - Renders concept detail content dynamically
 * Handles the display of different sections based on concept data
 */

class ConceptRenderer {
    constructor() {
        this.concept = null;
        this.elements = {};
    }

    /**
     * Initialize renderer with DOM elements
     */
    init() {
        this.elements = {
            header: document.getElementById('conceptHeader'),
            story: document.getElementById('storySection'),
            technical: document.getElementById('technicalSection'),
            code: document.getElementById('codeSection'),
            applications: document.getElementById('applicationsSection'),
            comparisons: document.getElementById('comparisonsSection'),
            related: document.getElementById('relatedSection')
        };
    }

    /**
     * Render complete concept
     */
    async renderConcept(concept) {
        this.concept = concept;
        
        // Set page background and theme
        this.setPageTheme(concept);
        
        // Render each section
        this.renderHeader(concept);
        this.renderStorySection(concept);
        this.renderTechnicalSection(concept);
        this.renderCodeSection(concept);
        this.renderApplicationsSection(concept);
        this.renderComparisonsSection(concept);
        await this.renderRelatedSection(concept);
        
        // Initialize interactive features
        this.initializeInteractiveFeatures();
    }

    /**
     * Set page theme based on concept
     */
    setPageTheme(concept) {
        const body = document.getElementById('pageBody');
        const title = document.getElementById('pageTitle');
        
        if (body) {
            // Add background pattern class
            if (concept.backgroundPattern) {
                body.classList.add(`bg-pattern-${concept.backgroundPattern}`);
            }
            
            // Set CSS custom properties for theming
            body.style.setProperty('--concept-color', concept.backgroundColor);
        }
        
        if (title) {
            title.textContent = `${concept.title} - LearnByShorts`;
        }
    }

    /**
     * Render header section
     */
    renderHeader(concept) {
        if (!this.elements.header) return;

        this.elements.header.innerHTML = `
            <h1 class="text-4xl md:text-5xl font-bold mb-4">
                <span class="title-gradient">${this.extractMainTitle(concept.title)}</span>
            </h1>
            <h2 class="text-xl md:text-2xl text-gray-600 mb-6">${concept.subtitle}</h2>
            <div class="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                <span class="concept-tag">📖 ${conceptDetailService.calculateConceptReadTime(concept)}</span>
                <span class="concept-tag">⭐ ${conceptDetailService.getConceptDifficulty(concept)}</span>
                <span class="concept-tag">👨‍💻 ${concept.character?.name || 'Programming Concept'}</span>
            </div>
        `;
    }

    /**
     * Extract main title (remove HTML tags)
     */
    extractMainTitle(title) {
        return title.replace(/<[^>]*>/g, '');
    }

    /**
     * Render story section
     */
    renderStorySection(concept) {
        if (!this.elements.story || !concept.story) return;

        let storyHTML = `
            <h2 class="text-2xl font-bold mb-6">The Story</h2>
        `;

        // Character section
        if (concept.character) {
            storyHTML += `
                <div class="character-section">
                    <div class="character-avatar">
                        ${this.getCharacterEmoji(concept.character.name)}
                    </div>
                    <div class="character-info">
                        <h3>${concept.character.name}</h3>
                        <p>${concept.character.role}</p>
                    </div>
                </div>
            `;
        }

        // Introduction
        if (concept.story.introduction) {
            storyHTML += `
                <p class="text-gray-700 mb-6 text-lg leading-relaxed">
                    ${concept.story.introduction}
                </p>
            `;
        }

        // Quote
        if (concept.story.quote) {
            storyHTML += `
                <div class="character-quote text-lg text-gray-600">
                    "${concept.story.quote}" — ${concept.character?.name || 'Wise Teacher'}
                </div>
            `;
        }

        // Timeline
        if (concept.story.timeline && concept.story.timeline.length > 0) {
            storyHTML += `
                <div class="timeline-container mt-8">
                    ${concept.story.timeline.map(item => `
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <h3 class="text-xl font-semibold mb-2">${item.title}</h3>
                            <p class="text-gray-700">${item.description}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        this.elements.story.innerHTML = storyHTML;
    }

    /**
     * Render technical section
     */
    renderTechnicalSection(concept) {
        if (!this.elements.technical || !concept.technicalExplanation) return;

        const tech = concept.technicalExplanation;
        
        let technicalHTML = `
            <h2 class="text-2xl font-bold mb-6">Technical Explanation</h2>
        `;

        // Definition
        if (tech.definition) {
            technicalHTML += `
                <p class="text-gray-700 mb-6 text-lg leading-relaxed">
                    ${tech.definition}
                </p>
            `;
        }

        // Technical details grid
        technicalHTML += `<div class="technical-grid">`;

        if (tech.keyCharacteristics && tech.keyCharacteristics.length > 0) {
            technicalHTML += `
                <div class="technical-card">
                    <h3>🔑 Key Characteristics</h3>
                    <ul>
                        ${tech.keyCharacteristics.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (tech.whenToUse && tech.whenToUse.length > 0) {
            technicalHTML += `
                <div class="technical-card">
                    <h3>🎯 When to Use</h3>
                    <ul>
                        ${tech.whenToUse.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (tech.advantages && tech.advantages.length > 0) {
            technicalHTML += `
                <div class="technical-card">
                    <h3>✅ Advantages</h3>
                    <ul>
                        ${tech.advantages.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (tech.disadvantages && tech.disadvantages.length > 0) {
            technicalHTML += `
                <div class="technical-card">
                    <h3>⚠️ Disadvantages</h3>
                    <ul>
                        ${tech.disadvantages.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        technicalHTML += `</div>`;

        this.elements.technical.innerHTML = technicalHTML;
    }

    /**
     * Render code section
     */
    renderCodeSection(concept) {
        if (!this.elements.code || !concept.codeExamples || concept.codeExamples.length === 0) {
            this.elements.code.style.display = 'none';
            return;
        }

        let codeHTML = `
            <h2 class="text-2xl font-bold mb-6">Code Examples</h2>
        `;

        concept.codeExamples.forEach((example, index) => {
            const copyId = `copy-btn-${index}`;
            codeHTML += `
                <div class="mb-8">
                    <h3 class="text-xl font-semibold mb-4">${example.title}</h3>
                    <div class="code-section">
                        <div class="code-header">
                            <span>${example.filename}</span>
                            <button class="copy-button" id="${copyId}" onclick="conceptRenderer.copyCode('${copyId}', ${index})">
                                Copy
                            </button>
                        </div>
                        <div class="highlight-container">
                            <pre class="code-block"><code class="language-${example.language}">${this.escapeHtml(example.code)}</code></pre>
                        </div>
                    </div>
                </div>
            `;
        });

        this.elements.code.innerHTML = codeHTML;
        
        // Re-highlight code after rendering
        setTimeout(() => {
            if (typeof hljs !== 'undefined') {
                hljs.highlightAll();
            }
        }, 100);
    }

    /**
     * Render applications section
     */
    renderApplicationsSection(concept) {
        if (!this.elements.applications || !concept.realWorldApplications || concept.realWorldApplications.length === 0) {
            this.elements.applications.style.display = 'none';
            return;
        }

        let applicationsHTML = `
            <h2 class="text-2xl font-bold mb-6">Real-World Applications</h2>
            <div class="application-grid">
                ${concept.realWorldApplications.map(app => `
                    <div class="application-card">
                        <h3>${app.title}</h3>
                        <p class="text-gray-700">${app.description}</p>
                    </div>
                `).join('')}
            </div>
        `;

        this.elements.applications.innerHTML = applicationsHTML;
    }

    /**
     * Render comparisons section
     */
    renderComparisonsSection(concept) {
        if (!this.elements.comparisons || !concept.comparisons || concept.comparisons.length === 0) {
            this.elements.comparisons.style.display = 'none';
            return;
        }

        let comparisonsHTML = `
            <h2 class="text-2xl font-bold mb-6">Pattern Comparisons</h2>
            <div class="comparison-grid">
                ${concept.comparisons.map(comp => `
                    <div class="comparison-card">
                        <h3>${this.extractMainTitle(concept.title)} vs. ${comp.pattern}</h3>
                        <p class="text-gray-700">${comp.difference}</p>
                    </div>
                `).join('')}
            </div>
        `;

        this.elements.comparisons.innerHTML = comparisonsHTML;
    }

    /**
     * Render related concepts section
     */
    async renderRelatedSection(concept) {
        if (!this.elements.related) return;

        try {
            const relatedConcepts = await conceptDetailService.getRelatedConcepts(concept.id);
            
            if (relatedConcepts.length === 0) {
                this.elements.related.style.display = 'none';
                return;
            }

            let relatedHTML = `
                <h2 class="text-2xl font-bold mb-6">Related Concepts</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${relatedConcepts.map(related => `
                        <a href="concept-detail.html?id=${related.id}" class="related-concept-card">
                            <h3>${this.extractMainTitle(related.title)}</h3>
                            <p>${related.story?.introduction?.substring(0, 100) || related.technicalExplanation?.definition?.substring(0, 100) || 'Learn more about this concept'}...</p>
                        </a>
                    `).join('')}
                </div>
            `;

            this.elements.related.innerHTML = relatedHTML;
        } catch (error) {
            console.error('Failed to load related concepts:', error);
            this.elements.related.style.display = 'none';
        }
    }

    /**
     * Get character emoji
     */
    getCharacterEmoji(characterName) {
        const emojiMap = {
            'Sharma Ji': '👨‍💼',
            'Patel Uncle': '👨‍💼',
            'Government Office': '🏛️',
            'WhatsApp Admin': '📱',
            'Tea Vendor': '☕',
            'Railway Station': '🚂'
        };
        return emojiMap[characterName] || '👨‍💻';
    }

    /**
     * Escape HTML for code display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Copy code to clipboard
     */
    async copyCode(buttonId, exampleIndex) {
        const button = document.getElementById(buttonId);
        const codeExample = this.concept.codeExamples[exampleIndex];
        
        if (!codeExample) return;

        try {
            await navigator.clipboard.writeText(codeExample.code);
            
            // Update button state
            button.textContent = 'Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = 'Copy';
                button.classList.remove('copied');
            }, 2000);
        } catch (error) {
            console.error('Failed to copy code:', error);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = codeExample.code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        }
    }

    /**
     * Initialize interactive features
     */
    initializeInteractiveFeatures() {
        // Add smooth scrolling to internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add intersection observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1
        });

        // Observe all concept cards
        document.querySelectorAll('.concept-card').forEach(card => {
            observer.observe(card);
        });
    }

    /**
     * Get current concept
     */
    getCurrentConcept() {
        return this.concept;
    }

    /**
     * Clear rendered content
     */
    clear() {
        Object.values(this.elements).forEach(element => {
            if (element) {
                element.innerHTML = '';
            }
        });
        this.concept = null;
    }
}

// Create singleton instance
const conceptRenderer = new ConceptRenderer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConceptRenderer;
}
