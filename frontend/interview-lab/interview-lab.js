(function () {
    'use strict';

    const storageKey = 'lbs:interview-plan-v1';
    const form = document.querySelector('[data-diagnostic]');
    const result = document.querySelector('[data-diagnostic-result]');
    const resultTitle = document.querySelector('[data-result-title]');
    const resultCopy = document.querySelector('[data-result-copy]');
    const planGrid = document.querySelector('[data-plan-grid]');
    const resetButton = document.querySelector('[data-reset-plan]');

    const skills = {
        coding: {
            label: 'Live coding',
            practice: 'Run two 35-minute problems. Spend the first three minutes clarifying and the last five testing aloud.'
        },
        debugging: {
            label: 'Debugging and code review',
            practice: 'Take unfamiliar code, write three hypotheses, isolate one defect, then explain the smallest safe fix.'
        },
        systems: {
            label: 'System design',
            practice: 'Design one service from requirements through APIs, data, scale, failure modes, and observability.'
        },
        behavioral: {
            label: 'Behavioral impact',
            practice: 'Draft four stories with a specific decision, your action, a measurable result, and what you learned.'
        },
        project: {
            label: 'Project deep-dive',
            practice: 'Build a ten-minute narrative covering constraints, your contribution, alternatives, incidents, and outcomes.'
        },
        ai: {
            label: 'AI-assisted judgment',
            practice: 'Practice one allowed-tool task while narrating verification, privacy checks, and where you reject the output.'
        }
    };

    function rankedSkills(scores) {
        return Object.entries(scores).sort((a, b) => a[1] - b[1]);
    }

    function renderPlan(plan, shouldScroll) {
        if (!result || !resultTitle || !resultCopy || !planGrid) return;

        const ranked = rankedSkills(plan.scores);
        const primary = skills[ranked[0][0]];
        const secondary = skills[ranked[1][0]];
        const strongest = skills[ranked[ranked.length - 1][0]];

        resultTitle.textContent = `Start with ${primary.label.toLowerCase()}.`;
        resultCopy.textContent =
            `Your second priority is ${secondary.label.toLowerCase()}. Keep ${strongest.label.toLowerCase()} warm while you build the weaker signals.`;

        const cards = [
            ['Days 1–3 · Primary', primary.label, primary.practice],
            ['Days 4–5 · Secondary', secondary.label, secondary.practice],
            ['Days 6–7 · Simulation', 'Combine the signals', `Run a 50-minute mock: ${primary.label.toLowerCase()} first, then a focused ${secondary.label.toLowerCase()} follow-up.`],
            ['Week 2 · Evidence loop', 'Review and repeat', 'Watch the recording or review your notes. Identify one reasoning gap, one communication gap, and one concrete improvement before repeating.']
        ];

        planGrid.innerHTML = cards.map(([kicker, title, copy]) => `
            <article class="plan-card">
                <span>${kicker}</span>
                <strong>${title}</strong>
                <p>${copy}</p>
            </article>
        `).join('');

        result.hidden = false;
        if (shouldScroll) result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function savePlan(scores) {
        const plan = {
            scores,
            createdAt: new Date().toISOString()
        };
        try {
            localStorage.setItem(storageKey, JSON.stringify(plan));
        } catch {
            // The diagnostic remains useful even when storage is unavailable.
        }
        renderPlan(plan, true);

        const primary = rankedSkills(scores)[0][0];
        const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
        window.Analytics?.trackInterviewDiagnostic?.(primary, total);
    }

    form?.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const scores = {};

        Object.keys(skills).forEach(skill => {
            scores[skill] = Number(data.get(skill));
        });

        if (Object.values(scores).some(Number.isNaN)) return;
        savePlan(scores);
    });

    resetButton?.addEventListener('click', () => {
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // Ignore storage restrictions.
        }
        form?.reset();
        if (result) result.hidden = true;
        form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved?.scores) {
            Object.entries(saved.scores).forEach(([skill, value]) => {
                const input = form?.querySelector(`input[name="${skill}"][value="${value}"]`);
                if (input) input.checked = true;
            });
            renderPlan(saved, false);
        }
    } catch {
        // Start with a clean diagnostic if saved data cannot be read.
    }
})();
