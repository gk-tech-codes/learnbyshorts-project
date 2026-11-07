(function () {
    'use strict';

    const storageKey = 'lbs:interview-plan-v1';
    const form = document.querySelector('[data-diagnostic]');
    const result = document.querySelector('[data-diagnostic-result]');
    const resultTitle = document.querySelector('[data-result-title]');
    const resultCopy = document.querySelector('[data-result-copy]');
    const planGrid = document.querySelector('[data-plan-grid]');
    const resetButton = document.querySelector('[data-reset-plan]');
    const scoreValue = document.querySelector('[data-readiness-score]');
    const scoreBand = document.querySelector('[data-readiness-band]');
    const shareButton = document.querySelector('[data-share-plan]');
    const shareStatus = document.querySelector('[data-share-status]');
    let currentPlan = null;

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

    function readiness(scores) {
        const total = Object.values(scores).reduce((sum, score) => sum + Number(score || 0), 0);
        const percent = Math.round(total / (Object.keys(skills).length * 2) * 100);
        return {
            total,
            percent,
            band: percent >= 84
                ? 'Simulation ready'
                : percent >= 59
                    ? 'Practice foundation'
                    : 'Build core signals',
            analyticsBand: percent >= 84 ? 'high' : percent >= 59 ? 'medium' : 'low'
        };
    }

    function planCard(kicker, title, copy) {
        const card = document.createElement('article');
        card.className = 'plan-card';
        const cardKicker = document.createElement('span');
        cardKicker.textContent = kicker;
        const cardTitle = document.createElement('strong');
        cardTitle.textContent = title;
        const cardCopy = document.createElement('p');
        cardCopy.textContent = copy;
        card.append(cardKicker, cardTitle, cardCopy);
        return card;
    }

    function renderPlan(plan, shouldScroll) {
        if (!result || !resultTitle || !resultCopy || !planGrid) return;

        const ranked = rankedSkills(plan.scores);
        const primary = skills[ranked[0][0]];
        const secondary = skills[ranked[1][0]];
        const strongest = skills[ranked[ranked.length - 1][0]];
        const score = readiness(plan.scores);
        currentPlan = {
            ...plan,
            primaryId: ranked[0][0],
            primary,
            secondary,
            strongest,
            readiness: score
        };

        resultTitle.textContent = `Start with ${primary.label.toLowerCase()}.`;
        resultCopy.textContent =
            `Your second priority is ${secondary.label.toLowerCase()}. Keep ${strongest.label.toLowerCase()} warm while you build the weaker signals.`;
        scoreValue.textContent = String(score.percent);
        scoreBand.textContent = score.band;

        const cards = [
            ['Days 1–3 · Primary', primary.label, primary.practice],
            ['Days 4–5 · Secondary', secondary.label, secondary.practice],
            ['Days 6–7 · Simulation', 'Combine the signals', `Run a 50-minute mock: ${primary.label.toLowerCase()} first, then a focused ${secondary.label.toLowerCase()} follow-up.`],
            ['Week 2 · Evidence loop', 'Review and repeat', 'Watch the recording or review your notes. Identify one reasoning gap, one communication gap, and one concrete improvement before repeating.']
        ];

        planGrid.replaceChildren(...cards.map(card => planCard(...card)));

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
        window.Analytics?.trackInterviewDiagnostic?.(primary, readiness(scores).percent);
    }

    async function sharePlan() {
        if (!currentPlan) return;
        const shareData = {
            title: 'My LearnByShorts Interview Readiness Plan',
            text: `My self-reported interview practice score is ${currentPlan.readiness.percent}/100. My next focus is ${currentPlan.primary.label.toLowerCase()}. Build your private plan:`,
            url: window.location.href.split('#')[0]
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                shareStatus.textContent = 'Readiness plan shared.';
                window.Analytics?.trackReadinessShare?.(
                    currentPlan.primaryId,
                    currentPlan.readiness.analyticsBand,
                    'native'
                );
                return;
            }
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            shareStatus.textContent = 'Privacy-safe result copied. No answers were included.';
            window.Analytics?.trackReadinessShare?.(
                currentPlan.primaryId,
                currentPlan.readiness.analyticsBand,
                'clipboard'
            );
        } catch (error) {
            if (error?.name !== 'AbortError') {
                shareStatus.textContent = 'Sharing was blocked. Copy the page address instead.';
            }
        }
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
        currentPlan = null;
        if (shareStatus) shareStatus.textContent = '';
        form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    shareButton?.addEventListener('click', sharePlan);

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
