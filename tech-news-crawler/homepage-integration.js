/**
 * Homepage Integration for Tech News Shorts
 * Displays educational shorts on the LearnByShorts homepage
 */

class TechShortsDisplay {
    constructor() {
        this.shortsContainer = null;
        this.shortsData = null;
    }

    async loadShorts() {
        try {
            const response = await fetch('/tech-news-crawler/data/homepage_shorts.json');
            this.shortsData = await response.json();
            return this.shortsData;
        } catch (error) {
            console.error('Failed to load tech shorts:', error);
            return null;
        }
    }

    createShortCard(short) {
        const template = short.imageTemplate;
        const gradientStyle = template.type === 'gradient' 
            ? `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`
            : template.color;

        return `
            <div class="tech-short-card" data-short-id="${short.id}">
                <div class="short-image" style="background: ${gradientStyle};">
                    <div class="short-icon">${template.icon}</div>
                    <div class="short-category">${short.category}</div>
                </div>
                <div class="short-content">
                    <h3 class="short-title">${short.title}</h3>
                    <p class="short-preview">${short.preview}</p>
                    <div class="short-meta">
                        <span class="read-time">⏱️ ${short.readTime}</span>
                        <span class="source">📰 ${short.sourceName}</span>
                    </div>
                    <button class="read-short-btn" onclick="openShort('${short.id}')">
                        Read Short
                    </button>
                </div>
            </div>
        `;
    }

    renderShorts(containerId = 'tech-shorts-container') {
        this.shortsContainer = document.getElementById(containerId);
        
        if (!this.shortsContainer || !this.shortsData) {
            console.error('Container or data not found');
            return;
        }

        const shortsHTML = this.shortsData.featuredShorts
            .map(short => this.createShortCard(short))
            .join('');

        this.shortsContainer.innerHTML = `
            <div class="tech-shorts-header">
                <h2>🚀 Latest Tech & AI Insights</h2>
                <p>Educational shorts from top tech sources • Updated ${new Date(this.shortsData.lastUpdated).toLocaleDateString()}</p>
            </div>
            <div class="shorts-grid">
                ${shortsHTML}
            </div>
        `;
    }

    addStyles() {
        const styles = `
            <style>
            .tech-shorts-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .tech-shorts-header h2 {
                color: #2d3748;
                margin-bottom: 0.5rem;
            }
            
            .tech-shorts-header p {
                color: #718096;
                font-size: 0.9rem;
            }
            
            .shorts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin-top: 2rem;
            }
            
            .tech-short-card {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                transition: transform 0.2s, box-shadow 0.2s;
                cursor: pointer;
            }
            
            .tech-short-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            .short-image {
                height: 120px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                color: white;
            }
            
            .short-icon {
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
            }
            
            .short-category {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .short-content {
                padding: 1.5rem;
            }
            
            .short-title {
                font-size: 1.1rem;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 0.75rem;
                line-height: 1.4;
            }
            
            .short-preview {
                color: #4a5568;
                font-size: 0.9rem;
                line-height: 1.5;
                margin-bottom: 1rem;
            }
            
            .short-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                font-size: 0.8rem;
                color: #718096;
            }
            
            .read-short-btn {
                width: 100%;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 0.75rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            
            .read-short-btn:hover {
                opacity: 0.9;
            }
            
            @media (max-width: 768px) {
                .shorts-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .short-content {
                    padding: 1rem;
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    async init() {
        this.addStyles();
        const data = await this.loadShorts();
        if (data) {
            this.renderShorts();
        }
    }
}

// Global function to open individual shorts
function openShort(shortId) {
    // This would open the full short content
    // For now, just log the ID
    console.log('Opening short:', shortId);
    
    // In production, this would:
    // 1. Load full short content
    // 2. Open in modal or navigate to short page
    // 3. Track analytics
    
    alert('Short viewer would open here! Short ID: ' + shortId);
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const techShorts = new TechShortsDisplay();
    techShorts.init();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TechShortsDisplay;
}
