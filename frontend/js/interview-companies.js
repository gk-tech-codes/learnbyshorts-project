// Interview Companies JavaScript - Matches design-patterns.html structure
class InterviewCompanies {
    constructor() {
        this.faangCompanies = [
            {
                id: 'google',
                name: 'Google',
                icon: '🔍',
                color: '#4285f4',
                difficulty: 'Hard',
                successRate: '15%',
                description: 'Algorithmic challenges, system design, and Googleyness interviews',
                available: true
            },
            {
                id: 'microsoft',
                name: 'Microsoft', 
                icon: '🪟',
                color: '#00a1f1',
                difficulty: 'Medium',
                successRate: '20%',
                description: 'Problem-solving, coding assessments, and culture fit evaluations',
                available: true
            }
        ];
        
        this.otherCompanies = [];
        this.init();
    }

    init() {
    }

    init() {
        this.renderCompanies();
    }

    renderCompanies() {
        this.renderFaangCompanies();
        this.renderOtherCompanies();
    }

    renderFaangCompanies() {
        const container = document.getElementById('faang-companies');
        if (!container) return;

        container.innerHTML = this.faangCompanies.map(company => 
            this.createCompanyCard(company)
        ).join('');
    }

    renderOtherCompanies() {
        const container = document.getElementById('other-companies');
        if (!container) return;

        container.innerHTML = this.otherCompanies.map(company => 
            this.createCompanyCard(company)
        ).join('');
    }

    createCompanyCard(company) {
        const cardClass = company.available ? 'pattern-card' : 'pattern-card disabled';
        const href = company.available ? `href="course-detail.html?id=${company.id}"` : '';
        const clickHandler = company.available ? '' : 'onclick="return false;"';

        return `
            <a ${href} class="${cardClass}" ${clickHandler}>
                <div class="pattern-icon" style="background-color: ${company.color};">${company.icon}</div>
                <h4>${company.name}</h4>
                <p>${company.description}</p>
                <div class="pattern-meta">
                    <span class="difficulty ${company.difficulty.toLowerCase()}">${company.difficulty}</span>
                </div>
                ${!company.available ? '<div class="coming-soon-overlay">Coming Soon</div>' : ''}
            </a>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InterviewCompanies();
});
