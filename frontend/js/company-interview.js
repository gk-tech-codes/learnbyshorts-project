// Company Interview JavaScript - Matches course-detail.html structure
class CompanyInterview {
    constructor() {
        this.companyId = new URLSearchParams(window.location.search).get('company');
        this.companyData = null;
        this.init();
    }

    async init() {
        if (!this.companyId) {
            window.location.href = 'interview-companies.html';
            return;
        }
        
        await this.loadCompanyData();
        this.renderCompanyHero();
        this.renderInterviewContent();
    }

    async loadCompanyData() {
        try {
            const response = await fetch(`data/interviews/${this.companyId}.json`);
            this.companyData = await response.json();
        } catch (error) {
            console.error('Error loading company data:', error);
            this.companyData = null;
        }
    }

    renderCompanyHero() {
        if (!this.companyData) return;

        const { company, overview } = this.companyData;
        
        // Update page title and breadcrumb
        document.getElementById('page-title').textContent = `${company} Interview Prep - LearnByShorts`;
        document.title = `${company} Interview Prep - LearnByShorts`;
        document.getElementById('company-breadcrumb').textContent = company;
        
        // Render hero section
        const heroContainer = document.getElementById('company-hero');
        heroContainer.innerHTML = `
            <div class="company-hero-card">
                <div class="company-hero-header">
                    <div class="company-icon">${this.getCompanyIcon(this.companyId)}</div>
                    <div class="company-title">
                        <h1>${company} Interview Preparation</h1>
                        <p class="company-tagline">${overview.process}</p>
                    </div>
                </div>
                
                <div class="company-hero-stats">
                    <div class="stat-card">
                        <div class="stat-value">${overview.duration}</div>
                        <div class="stat-label">Process Duration</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overview.successRate}</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.companyData.rounds.length}</div>
                        <div class="stat-label">Interview Rounds</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.getTotalQuestions()}</div>
                        <div class="stat-label">Total Questions</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderInterviewContent() {
        if (!this.companyData) return;

        // Render stats
        const statsContainer = document.getElementById('interview-stats');
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${this.companyData.rounds.length}</span>
                    <span class="stat-text">Rounds</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${this.getTotalQuestions()}</span>
                    <span class="stat-text">Questions</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${this.companyData.overview.successRate}</span>
                    <span class="stat-text">Success Rate</span>
                </div>
            </div>
        `;

        // Render description
        const descContainer = document.getElementById('interview-description');
        descContainer.innerHTML = `
            <p>Master ${this.companyData.company}'s interview process through real candidate experiences and story-based learning. 
            Our comprehensive preparation covers all aspects of their ${this.companyData.rounds.length}-round interview process.</p>
            
            <div class="focus-areas">
                <h4>Key Focus Areas:</h4>
                <ul>
                    ${this.companyData.overview.focusAreas.map(area => `<li>${area}</li>`).join('')}
                </ul>
            </div>
        `;

        // Render rounds
        this.renderInterviewRounds();
    }

    renderInterviewRounds() {
        const roundsContainer = document.getElementById('interview-rounds');
        roundsContainer.innerHTML = this.companyData.rounds.map((round, index) => `
            <div class="curriculum-section">
                <div class="section-header">
                    <div class="section-number">${index + 1}</div>
                    <div class="section-info">
                        <h4>${round.title}</h4>
                        <p class="section-description">${round.description}</p>
                        <div class="section-meta">
                            <span class="duration">${round.duration}</span>
                            <span class="question-count">${round.questions.length} questions</span>
                        </div>
                    </div>
                </div>
                
                <div class="section-content">
                    <div class="questions-list">
                        ${round.questions.map(question => `
                            <div class="question-item" onclick="this.openQuestion('${question.id}', '${this.companyId}')">
                                <div class="question-header">
                                    <h5>${question.title}</h5>
                                    <span class="difficulty-badge ${question.difficulty.toLowerCase()}">${question.difficulty}</span>
                                </div>
                                <div class="question-meta">
                                    <span class="pattern-tag">${question.pattern}</span>
                                    <div class="tags">
                                        ${question.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                                    </div>
                                </div>
                                <p class="question-preview">${question.story}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        this.addQuestionClickHandlers();
    }

    addQuestionClickHandlers() {
        document.querySelectorAll('.question-item').forEach(item => {
            item.addEventListener('click', () => {
                const questionTitle = item.querySelector('h5').textContent;
                const question = this.findQuestionByTitle(questionTitle);
                if (question) {
                    this.openQuestion(question.id, this.companyId);
                }
            });
        });
    }

    findQuestionByTitle(title) {
        for (const round of this.companyData.rounds) {
            const question = round.questions.find(q => q.title === title);
            if (question) return question;
        }
        return null;
    }

    openQuestion(questionId, companyId) {
        // Navigate to course-detail.html with interview context
        window.location.href = `course-detail.html?type=interview&company=${companyId}&question=${questionId}`;
    }

    getCompanyIcon(companyId) {
        const icons = {
            'google': '🔍',
            'microsoft': '🪟',
            'amazon': '📦',
            'meta': '👥'
        };
        return icons[companyId] || '🏢';
    }

    getTotalQuestions() {
        return this.companyData.rounds.reduce((total, round) => total + round.questions.length, 0);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CompanyInterview();
});
