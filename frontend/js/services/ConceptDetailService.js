/**
 * Concept Detail Service - Manages concept detail data
 * Handles loading and processing of detailed concept information
 */

class ConceptDetailService {
    constructor() {
        this.concepts = {};
        this.isLoaded = false;
        this.currentConcept = null;
    }

    /**
     * Load concept details from JSON file
     */
    async loadConceptDetails() {
        try {
            const response = await fetch('data/concept-details.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.concepts = data.concepts;
            this.isLoaded = true;
            return this.concepts;
        } catch (error) {
            console.error('Failed to load concept details:', error);
            throw error;
        }
    }

    /**
     * Get concept details by ID
     */
    async getConceptById(id) {
        if (!this.isLoaded) {
            await this.loadConceptDetails();
        }
        
        const concept = this.concepts[id];
        if (!concept) {
            throw new Error(`Concept with ID '${id}' not found`);
        }
        
        this.currentConcept = concept;
        return concept;
    }

    /**
     * Get all available concepts
     */
    async getAllConcepts() {
        if (!this.isLoaded) {
            await this.loadConceptDetails();
        }
        return Object.values(this.concepts);
    }

    /**
     * Search concepts by title or content
     */
    async searchConcepts(query) {
        const allConcepts = await this.getAllConcepts();
        const searchTerm = query.toLowerCase();
        
        return allConcepts.filter(concept => 
            concept.title.toLowerCase().includes(searchTerm) ||
            concept.subtitle.toLowerCase().includes(searchTerm) ||
            concept.story.introduction.toLowerCase().includes(searchTerm) ||
            concept.technicalExplanation.definition.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get related concepts based on current concept
     */
    async getRelatedConcepts(conceptId, limit = 3) {
        const allConcepts = await this.getAllConcepts();
        const currentConcept = this.concepts[conceptId];
        
        if (!currentConcept) return [];

        // Simple recommendation based on similar patterns or categories
        const related = allConcepts
            .filter(concept => concept.id !== conceptId)
            .map(concept => {
                let score = 0;
                
                // Same background color suggests similar category
                if (concept.backgroundColor === currentConcept.backgroundColor) {
                    score += 2;
                }
                
                // Similar character types
                if (concept.character && currentConcept.character) {
                    if (concept.character.role === currentConcept.character.role) {
                        score += 1;
                    }
                }
                
                // Similar technical complexity (based on code examples count)
                const currentCodeCount = currentConcept.codeExamples?.length || 0;
                const conceptCodeCount = concept.codeExamples?.length || 0;
                if (Math.abs(currentCodeCount - conceptCodeCount) <= 1) {
                    score += 1;
                }
                
                return { ...concept, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return related;
    }

    /**
     * Get concept statistics
     */
    async getConceptStatistics() {
        const allConcepts = await this.getAllConcepts();
        
        const stats = {
            total: allConcepts.length,
            withCodeExamples: 0,
            withRealWorldApps: 0,
            withComparisons: 0,
            averageCodeExamples: 0,
            languages: new Set(),
            characters: new Set()
        };

        let totalCodeExamples = 0;

        allConcepts.forEach(concept => {
            if (concept.codeExamples && concept.codeExamples.length > 0) {
                stats.withCodeExamples++;
                totalCodeExamples += concept.codeExamples.length;
                
                concept.codeExamples.forEach(example => {
                    stats.languages.add(example.language);
                });
            }
            
            if (concept.realWorldApplications && concept.realWorldApplications.length > 0) {
                stats.withRealWorldApps++;
            }
            
            if (concept.comparisons && concept.comparisons.length > 0) {
                stats.withComparisons++;
            }
            
            if (concept.character && concept.character.name) {
                stats.characters.add(concept.character.name);
            }
        });

        stats.averageCodeExamples = totalCodeExamples / stats.total;
        stats.languages = Array.from(stats.languages);
        stats.characters = Array.from(stats.characters);

        return stats;
    }

    /**
     * Format code example for display
     */
    formatCodeExample(codeExample) {
        return {
            ...codeExample,
            formattedCode: this.addLineNumbers(codeExample.code),
            estimatedReadTime: this.calculateReadTime(codeExample.code)
        };
    }

    /**
     * Add line numbers to code
     */
    addLineNumbers(code) {
        const lines = code.split('\n');
        return lines.map((line, index) => ({
            number: index + 1,
            content: line
        }));
    }

    /**
     * Calculate estimated read time for code
     */
    calculateReadTime(code) {
        const lines = code.split('\n').length;
        const wordsPerMinute = 200; // Average reading speed
        const linesPerMinute = wordsPerMinute / 10; // Assuming 10 words per line of code
        const minutes = Math.ceil(lines / linesPerMinute);
        return `${minutes} min read`;
    }

    /**
     * Get concept navigation info
     */
    async getNavigationInfo(currentConceptId) {
        const allConcepts = await this.getAllConcepts();
        const currentIndex = allConcepts.findIndex(concept => concept.id === currentConceptId);
        
        if (currentIndex === -1) return null;

        return {
            current: currentIndex,
            total: allConcepts.length,
            previous: currentIndex > 0 ? allConcepts[currentIndex - 1] : null,
            next: currentIndex < allConcepts.length - 1 ? allConcepts[currentIndex + 1] : null
        };
    }

    /**
     * Generate concept summary
     */
    generateSummary(concept) {
        const keyPoints = [];
        
        // Add definition
        if (concept.technicalExplanation?.definition) {
            keyPoints.push(concept.technicalExplanation.definition);
        }
        
        // Add key characteristics
        if (concept.technicalExplanation?.keyCharacteristics) {
            keyPoints.push(...concept.technicalExplanation.keyCharacteristics.slice(0, 3));
        }
        
        // Add main use cases
        if (concept.technicalExplanation?.whenToUse) {
            keyPoints.push(`Use when: ${concept.technicalExplanation.whenToUse.slice(0, 2).join(', ')}`);
        }

        return {
            title: concept.title,
            character: concept.character?.name || 'Programming Concept',
            keyPoints: keyPoints.slice(0, 5),
            estimatedReadTime: this.calculateConceptReadTime(concept)
        };
    }

    /**
     * Calculate estimated read time for entire concept
     */
    calculateConceptReadTime(concept) {
        let totalWords = 0;
        
        // Count words in story
        if (concept.story?.introduction) {
            totalWords += concept.story.introduction.split(' ').length;
        }
        
        if (concept.story?.timeline) {
            concept.story.timeline.forEach(item => {
                totalWords += item.description.split(' ').length;
            });
        }
        
        // Count words in technical explanation
        if (concept.technicalExplanation?.definition) {
            totalWords += concept.technicalExplanation.definition.split(' ').length;
        }
        
        // Count code lines (approximate)
        if (concept.codeExamples) {
            concept.codeExamples.forEach(example => {
                totalWords += example.code.split('\n').length * 5; // 5 words per line estimate
            });
        }
        
        const wordsPerMinute = 200;
        const minutes = Math.ceil(totalWords / wordsPerMinute);
        return `${minutes} min read`;
    }

    /**
     * Export concept as markdown
     */
    exportAsMarkdown(concept) {
        let markdown = `# ${concept.title}\n\n`;
        markdown += `## ${concept.subtitle}\n\n`;
        
        if (concept.story?.introduction) {
            markdown += `## Story\n\n${concept.story.introduction}\n\n`;
        }
        
        if (concept.technicalExplanation?.definition) {
            markdown += `## Technical Explanation\n\n${concept.technicalExplanation.definition}\n\n`;
        }
        
        if (concept.codeExamples) {
            markdown += `## Code Examples\n\n`;
            concept.codeExamples.forEach(example => {
                markdown += `### ${example.title}\n\n`;
                markdown += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
            });
        }
        
        return markdown;
    }

    /**
     * Get concept difficulty level
     */
    getConceptDifficulty(concept) {
        let score = 0;
        
        // Code complexity
        if (concept.codeExamples) {
            score += concept.codeExamples.length * 2;
            concept.codeExamples.forEach(example => {
                score += example.code.split('\n').length / 10;
            });
        }
        
        // Technical depth
        if (concept.technicalExplanation?.keyCharacteristics) {
            score += concept.technicalExplanation.keyCharacteristics.length;
        }
        
        if (concept.comparisons) {
            score += concept.comparisons.length * 2;
        }
        
        // Determine difficulty
        if (score < 5) return 'Beginner';
        if (score < 15) return 'Intermediate';
        return 'Advanced';
    }

    /**
     * Track concept view analytics
     */
    trackConceptView(conceptId) {
        const analytics = {
            conceptId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
        
        // Store in localStorage for now (in real app, send to analytics service)
        const views = JSON.parse(localStorage.getItem('conceptViews') || '[]');
        views.push(analytics);
        localStorage.setItem('conceptViews', JSON.stringify(views));
        
        console.log('Concept view tracked:', analytics);
    }

    /**
     * Get current concept
     */
    getCurrentConcept() {
        return this.currentConcept;
    }

    /**
     * Clear current concept
     */
    clearCurrentConcept() {
        this.currentConcept = null;
    }
}

// Create singleton instance
const conceptDetailService = new ConceptDetailService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConceptDetailService;
}
