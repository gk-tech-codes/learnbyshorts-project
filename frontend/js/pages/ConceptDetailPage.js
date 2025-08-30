/**
 * ConceptDetailPage Controller - Manages the concept detail page
 * Handles loading, rendering, and interactions for concept details
 */

class ConceptDetailPage {
    constructor() {
        this.conceptId = null;
        this.concept = null;
        this.isLoading = false;
        
        this.init();
    }

    /**
     * Initialize the concept detail page
     */
    async init() {
        try {
            this.setupEventListeners();
            this.extractConceptId();
            await this.loadAndRenderConcept();
            this.setupInteractions();
        } catch (error) {
            console.error('Failed to initialize concept detail page:', error);
            this.showError('Failed to load concept details');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }

        // Handle browser navigation
        window.addEventListener('popstate', () => {
            this.extractConceptId();
            this.loadAndRenderConcept();
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.concept) {
                this.trackPageView();
            }
        });
    }

    /**
     * Handle DOM ready
     */
    onDOMReady() {
        // Initialize renderer
        conceptRenderer.init();
        
        // Setup navigation buttons
        this.setupNavigationButtons();
        
        // Setup share functionality
        this.setupShareFunctionality();
        
        // Setup bookmark functionality
        this.setupBookmarkFunctionality();
    }

    /**
     * Extract concept ID from URL parameters
     */
    extractConceptId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.conceptId = urlParams.get('id');
        
        if (!this.conceptId) {
            throw new Error('No concept ID provided in URL');
        }
    }

    /**
     * Load and render concept
     */
    async loadAndRenderConcept() {
        if (!this.conceptId) {
            this.showError('No concept ID provided');
            return;
        }

        try {
            this.showLoading();
            
            // Load concept data
            this.concept = await conceptDetailService.getConceptById(this.conceptId);
            
            // Render concept
            await conceptRenderer.renderConcept(this.concept);
            
            // Show content
            this.showContent();
            
            // Track analytics
            this.trackPageView();
            
            // Update page metadata
            this.updatePageMetadata();
            
        } catch (error) {
            console.error('Failed to load concept:', error);
            this.showError(error.message || 'Failed to load concept details');
        }
    }

    /**
     * Setup navigation buttons
     */
    setupNavigationButtons() {
        // Back button is already handled in HTML with history.back()
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                history.back();
            }
        });
    }

    /**
     * Setup share functionality
     */
    setupShareFunctionality() {
        const shareBtn = document.getElementById('shareBtn');
        if (!shareBtn) return;

        shareBtn.addEventListener('click', async () => {
            if (navigator.share && this.concept) {
                try {
                    await navigator.share({
                        title: this.concept.title,
                        text: this.concept.story?.introduction || this.concept.technicalExplanation?.definition,
                        url: window.location.href
                    });
                } catch (error) {
                    console.log('Share cancelled or failed:', error);
                    this.fallbackShare();
                }
            } else {
                this.fallbackShare();
            }
        });
    }

    /**
     * Fallback share functionality
     */
    fallbackShare() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('Link copied to clipboard!');
            }).catch(() => {
                this.showShareModal();
            });
        } else {
            this.showShareModal();
        }
    }

    /**
     * Show share modal
     */
    showShareModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4">Share this concept</h3>
                <div class="flex flex-col gap-3">
                    <input type="text" value="${window.location.href}" readonly 
                           class="w-full p-2 border rounded text-sm" id="shareUrl">
                    <div class="flex gap-2">
                        <button onclick="document.getElementById('shareUrl').select(); document.execCommand('copy'); this.textContent='Copied!'" 
                                class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Copy Link
                        </button>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Setup bookmark functionality
     */
    setupBookmarkFunctionality() {
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (!bookmarkBtn) return;

        // Check if already bookmarked
        this.updateBookmarkState();

        bookmarkBtn.addEventListener('click', () => {
            this.toggleBookmark();
        });
    }

    /**
     * Toggle bookmark state
     */
    toggleBookmark() {
        if (!this.concept) return;

        const bookmarks = this.getBookmarks();
        const isBookmarked = bookmarks.some(b => b.id === this.concept.id);

        if (isBookmarked) {
            // Remove bookmark
            const updatedBookmarks = bookmarks.filter(b => b.id !== this.concept.id);
            localStorage.setItem('conceptBookmarks', JSON.stringify(updatedBookmarks));
            this.showToast('Bookmark removed');
        } else {
            // Add bookmark
            const bookmark = {
                id: this.concept.id,
                title: this.concept.title,
                subtitle: this.concept.subtitle,
                url: window.location.href,
                timestamp: Date.now()
            };
            bookmarks.push(bookmark);
            localStorage.setItem('conceptBookmarks', JSON.stringify(bookmarks));
            this.showToast('Concept bookmarked!');
        }

        this.updateBookmarkState();
    }

    /**
     * Get bookmarks from localStorage
     */
    getBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('conceptBookmarks') || '[]');
        } catch (error) {
            console.error('Failed to parse bookmarks:', error);
            return [];
        }
    }

    /**
     * Update bookmark button state
     */
    updateBookmarkState() {
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (!bookmarkBtn || !this.concept) return;

        const bookmarks = this.getBookmarks();
        const isBookmarked = bookmarks.some(b => b.id === this.concept.id);

        const svg = bookmarkBtn.querySelector('svg');
        if (isBookmarked) {
            svg.setAttribute('fill', 'currentColor');
            bookmarkBtn.classList.add('text-blue-600');
        } else {
            svg.setAttribute('fill', 'none');
            bookmarkBtn.classList.remove('text-blue-600');
        }
    }

    /**
     * Setup additional interactions
     */
    setupInteractions() {
        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });

        // Add reading progress indicator
        this.addReadingProgress();
    }

    /**
     * Add reading progress indicator
     */
    addReadingProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'fixed top-0 left-0 h-1 bg-blue-600 z-50 transition-all duration-300';
        progressBar.style.width = '0%';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
        });
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.isLoading = true;
        const spinner = document.getElementById('loadingSpinner');
        const content = document.getElementById('contentContainer');
        const error = document.getElementById('errorMessage');

        if (spinner) spinner.classList.remove('hidden');
        if (content) content.classList.add('hidden');
        if (error) error.classList.add('hidden');
    }

    /**
     * Show content
     */
    showContent() {
        this.isLoading = false;
        const spinner = document.getElementById('loadingSpinner');
        const content = document.getElementById('contentContainer');
        const error = document.getElementById('errorMessage');

        if (spinner) spinner.classList.add('hidden');
        if (content) content.classList.remove('hidden');
        if (error) error.classList.add('hidden');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.isLoading = false;
        const spinner = document.getElementById('loadingSpinner');
        const content = document.getElementById('contentContainer');
        const error = document.getElementById('errorMessage');

        if (spinner) spinner.classList.add('hidden');
        if (content) content.classList.add('hidden');
        if (error) {
            error.classList.remove('hidden');
            const errorText = error.querySelector('p');
            if (errorText) {
                errorText.textContent = message;
            }
        }
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg z-50 transform translate-y-full transition-transform duration-300';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-y-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('translate-y-full');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Track page view analytics
     */
    trackPageView() {
        if (this.concept) {
            conceptDetailService.trackConceptView(this.concept.id);
        }
    }

    /**
     * Update page metadata
     */
    updatePageMetadata() {
        if (!this.concept) return;

        // Update title
        document.title = `${this.concept.title} - LearnByShorts`;

        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = this.concept.story?.introduction?.substring(0, 160) || 
                                 this.concept.technicalExplanation?.definition?.substring(0, 160) || 
                                 'Learn programming concepts through engaging stories';

        // Update Open Graph tags
        this.updateOpenGraphTags();
    }

    /**
     * Update Open Graph tags for social sharing
     */
    updateOpenGraphTags() {
        const ogTags = {
            'og:title': this.concept.title,
            'og:description': this.concept.story?.introduction?.substring(0, 200) || this.concept.technicalExplanation?.definition?.substring(0, 200),
            'og:url': window.location.href,
            'og:type': 'article'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            let tag = document.querySelector(`meta[property="${property}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                document.head.appendChild(tag);
            }
            tag.content = content;
        });
    }

    /**
     * Get current concept
     */
    getCurrentConcept() {
        return this.concept;
    }

    /**
     * Navigate to related concept
     */
    navigateToRelatedConcept(conceptId) {
        window.location.href = `concept-detail.html?id=${conceptId}`;
    }

    /**
     * Export concept as PDF (placeholder for future implementation)
     */
    exportAsPDF() {
        this.showToast('PDF export feature coming soon!');
    }

    /**
     * Print concept
     */
    printConcept() {
        window.print();
    }

    /**
     * Cleanup method
     */
    cleanup() {
        conceptRenderer.clear();
        conceptDetailService.clearCurrentConcept();
    }
}

// Initialize concept detail page when script loads
let conceptDetailPage;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        conceptDetailPage = new ConceptDetailPage();
        window.conceptDetailPage = conceptDetailPage;
    });
} else {
    conceptDetailPage = new ConceptDetailPage();
    window.conceptDetailPage = conceptDetailPage;
}
