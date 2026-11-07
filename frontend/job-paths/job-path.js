(function () {
    'use strict';

    const roleId = 'amazon-sde-ii';
    const storageKey = `lbs2:job-path:${roleId}`;
    const timelineConfig = {
        1: {
            label: '7-day emergency sprint',
            cadence: '3–4 focused hours per day. Protect sleep and keep one recovery block.',
            periods: [
                { label: 'Day 1', modules: ['target', 'resume'] },
                { label: 'Day 2', modules: ['coding-core'] },
                { label: 'Day 3', modules: ['coding-core', 'design'] },
                { label: 'Day 4', modules: ['design'] },
                { label: 'Day 5', modules: ['leadership'] },
                { label: 'Day 6', modules: ['production', 'mock'] },
                { label: 'Day 7', modules: ['final'] }
            ]
        },
        2: {
            label: '2-week focused sprint',
            cadence: '2–3 focused hours per day, six days per week, with one review day.',
            periods: [
                { label: 'Days 1–2', modules: ['target', 'resume'] },
                { label: 'Days 3–4', modules: ['coding-core'] },
                { label: 'Days 5–6', modules: ['design'] },
                { label: 'Days 7–8', modules: ['leadership'] },
                { label: 'Days 9–10', modules: ['production'] },
                { label: 'Days 11–12', modules: ['coding-core', 'design'] },
                { label: 'Day 13', modules: ['mock'] },
                { label: 'Day 14', modules: ['final'] }
            ]
        },
        4: {
            label: '4-week focused plan',
            cadence: '90–120 minutes per day, five focused days plus one weekly mock or review.',
            periods: [
                { label: 'Week 1', modules: ['target', 'coding-core'] },
                { label: 'Week 2', modules: ['design', 'leadership'] },
                { label: 'Week 3', modules: ['production', 'resume'] },
                { label: 'Week 4', modules: ['mock', 'final'] }
            ]
        },
        8: {
            label: '8-week deep-build plan',
            cadence: '60–90 minutes per day, five days per week, with evidence review every weekend.',
            periods: [
                { label: 'Week 1', modules: ['target'] },
                { label: 'Week 2', modules: ['coding-core'] },
                { label: 'Week 3', modules: ['design'] },
                { label: 'Week 4', modules: ['leadership'] },
                { label: 'Week 5', modules: ['production'] },
                { label: 'Week 6', modules: ['resume'] },
                { label: 'Week 7', modules: ['mock'] },
                { label: 'Week 8', modules: ['final'] }
            ]
        }
    };

    const state = {
        role: null,
        weeks: 4,
        completedByTimeline: {}
    };

    const refs = {
        signalGrid: document.querySelector('[data-signal-grid]'),
        sourceList: document.querySelector('[data-source-list]'),
        timelineButtons: [...document.querySelectorAll('[data-weeks]')],
        jobText: document.querySelector('[data-job-text]'),
        resumeText: document.querySelector('[data-resume-text]'),
        jobCount: document.querySelector('[data-job-count]'),
        resumeCount: document.querySelector('[data-resume-count]'),
        generate: document.querySelector('[data-generate-plan]'),
        status: document.querySelector('[data-planner-status]'),
        selectedDuration: document.querySelector('[data-selected-duration]'),
        output: document.querySelector('[data-plan-output]'),
        planTitle: document.querySelector('[data-plan-title]'),
        planSummary: document.querySelector('[data-plan-summary]'),
        coverageValue: document.querySelector('[data-coverage-value]'),
        coverageLabel: document.querySelector('[data-coverage-label]'),
        evidenceList: document.querySelector('[data-evidence-list]'),
        resumeActions: document.querySelector('[data-resume-actions]'),
        curriculumTitle: document.querySelector('[data-curriculum-title]'),
        curriculumCadence: document.querySelector('[data-curriculum-cadence]'),
        planGrid: document.querySelector('[data-plan-grid]'),
        planProgress: document.querySelector('[data-plan-progress]'),
        promptGrid: document.querySelector('[data-prompt-grid]')
    };

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function safeId(value) {
        return /^[a-z0-9-]{1,80}$/.test(String(value || '')) ? String(value) : '';
    }

    function readProgress() {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey));
            if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
            const output = {};
            Object.entries(value.completedByTimeline || {}).forEach(([weeks, ids]) => {
                if (!timelineConfig[weeks] || !Array.isArray(ids)) return;
                output[weeks] = [...new Set(ids.map(safeId).filter(Boolean))].slice(0, 30);
            });
            return output;
        } catch {
            return {};
        }
    }

    function validPlanIds(weeks) {
        const config = timelineConfig[weeks];
        if (!config) return [];
        return config.periods.map((period, index) => planBlockId(weeks, index, period));
    }

    function currentCompleted() {
        const valid = new Set(validPlanIds(state.weeks));
        return (state.completedByTimeline[state.weeks] || []).filter(id => valid.has(id));
    }

    function writeProgress() {
        const payload = {
            version: 1,
            roleId,
            completedByTimeline: state.completedByTimeline,
            updatedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
            // The planner remains usable when browser storage is unavailable.
        }
    }

    function normalized(value) {
        return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function signalHits(text, signal) {
        if (!text) return [];
        return signal.keywords.filter(keyword => text.includes(keyword.toLowerCase()));
    }

    function analyze(jobText, resumeText) {
        const job = normalized(jobText);
        const resume = normalized(resumeText);
        const hasJob = job.length > 0;
        const hasResume = resume.length > 0;
        const signals = state.role.signals.map(signal => {
            const jobHits = signalHits(job, signal);
            const resumeHits = signalHits(resume, signal);
            return {
                signal,
                jobHits,
                resumeHits,
                relevant: !hasJob || jobHits.length > 0,
                covered: hasResume && resumeHits.length > 0
            };
        });
        const explicit = signals.filter(item => item.relevant);
        const relevant = explicit.length >= 3 ? explicit : signals;
        const covered = relevant.filter(item => item.covered).length;
        return {
            hasJob,
            hasResume,
            detectedCount: explicit.length,
            relevant,
            coverage: hasResume ? Math.round(covered / relevant.length * 100) : null,
            uncovered: relevant.filter(item => !item.covered)
        };
    }

    function renderSignals() {
        refs.signalGrid.replaceChildren();
        state.role.signals.forEach((signal, index) => {
            const card = element('article', 'signal-card');
            card.append(
                element('span', '', `SIGNAL ${String(index + 1).padStart(2, '0')}`),
                element('h3', '', signal.label),
                element('p', '', signal.description),
                element('small', '', 'Proof before polish: create evidence you can defend.')
            );
            refs.signalGrid.append(card);
        });
        refs.signalGrid.setAttribute('aria-busy', 'false');
    }

    function renderSources() {
        refs.sourceList.replaceChildren();
        state.role.sources.forEach(source => {
            let url;
            try {
                url = new URL(source.url);
            } catch {
                return;
            }
            if (url.protocol !== 'https:') return;
            const link = element('a', 'source-link');
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.append(element('strong', '', source.label), element('span', '', '↗'));
            refs.sourceList.append(link);
        });
    }

    function renderPrompts() {
        refs.promptGrid.replaceChildren();
        state.role.prompts.forEach((prompt, index) => {
            const card = element('article', 'prompt-card');
            const text = element('p', 'prompt-text', prompt.text);
            const button = element('button', 'prompt-copy', 'Copy coaching prompt');
            button.type = 'button';
            button.dataset.copyPrompt = prompt.id;
            card.append(
                element('span', '', `COACH ${String(index + 1).padStart(2, '0')}`),
                element('h3', '', prompt.title),
                element('p', '', prompt.use),
                text,
                button
            );
            refs.promptGrid.append(card);
        });
        refs.promptGrid.setAttribute('aria-busy', 'false');
    }

    function updateTimeline(weeks) {
        if (!timelineConfig[weeks]) return;
        state.weeks = Number(weeks);
        refs.timelineButtons.forEach(button => {
            button.setAttribute('aria-pressed', String(Number(button.dataset.weeks) === state.weeks));
        });
        refs.selectedDuration.textContent = `${state.weeks} WEEK${state.weeks === 1 ? '' : 'S'}`;
        refs.status.textContent = `A ${timelineConfig[state.weeks].label} is ready to generate.`;
        if (!refs.output.hidden) generatePlan(false);
    }

    function evidenceState(item, analysis) {
        if (!analysis.hasResume) {
            return item.relevant ? ['Role signal', ''] : ['Supporting', ''];
        }
        if (item.covered) return ['Evidence found', 'is-covered'];
        if (item.relevant) return ['Priority gap', 'is-priority'];
        return ['Supporting', ''];
    }

    function renderEvidence(analysis) {
        refs.evidenceList.replaceChildren();
        state.role.signals.forEach(itemSignal => {
            const item = analysis.relevant.find(candidate => candidate.signal.id === itemSignal.id) || {
                signal: itemSignal,
                relevant: false,
                covered: false,
                jobHits: [],
                resumeHits: []
            };
            const [label, className] = evidenceState(item, analysis);
            const wrapper = element('article', 'evidence-item');
            const top = element('div', 'evidence-item-top');
            top.append(
                element('strong', '', item.signal.label),
                element('span', `evidence-state ${className}`.trim(), label)
            );
            let detail = item.signal.description;
            if (analysis.hasJob && item.jobHits.length > 0) {
                detail = `Posting signals: ${item.jobHits.slice(0, 4).join(', ')}. ${detail}`;
            }
            wrapper.append(top, element('p', '', detail));
            refs.evidenceList.append(wrapper);
        });
    }

    function renderResumeActions(analysis) {
        refs.resumeActions.replaceChildren();
        const priorities = analysis.uncovered.length > 0
            ? analysis.uncovered
            : analysis.relevant.slice(0, 3);
        priorities.slice(0, 4).forEach((item, index) => {
            const card = element('article', 'resume-action');
            const title = analysis.hasResume && !item.covered
                ? `Close evidence gap ${index + 1}: ${item.signal.label}`
                : `Strengthen proof ${index + 1}: ${item.signal.label}`;
            card.append(
                element('strong', '', title),
                element(
                    'p',
                    '',
                    'Find one real example with scope, your decision, a measurable result, and a constraint. If none exists, build or practice before rewriting.'
                ),
                element('code', '', item.signal.resumeTemplate)
            );
            refs.resumeActions.append(card);
        });
    }

    function planBlockId(weeks, index, period) {
        return safeId(`${weeks}-${index + 1}-${period.modules.join('-')}`);
    }

    function combinedModule(period) {
        const modules = period.modules
            .map(id => state.role.planModules.find(module => module.id === id))
            .filter(Boolean);
        return {
            title: modules.map(module => module.title).join(' + '),
            focus: modules.map(module => module.focus).join(' '),
            deliverable: modules.map(module => module.deliverable).join(' Then: ')
        };
    }

    function renderPlan() {
        const config = timelineConfig[state.weeks];
        const completed = new Set(currentCompleted());
        refs.planGrid.replaceChildren();
        config.periods.forEach((period, index) => {
            const details = combinedModule(period);
            const id = planBlockId(state.weeks, index, period);
            const row = element('label', completed.has(id) ? 'plan-block is-complete' : 'plan-block');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = completed.has(id);
            checkbox.dataset.planId = id;
            const copy = element('div');
            copy.append(
                element('small', '', period.label),
                element('h4', '', details.title),
                element('p', '', details.focus),
                element('p', '', `Deliverable: ${details.deliverable}`)
            );
            row.append(checkbox, copy);
            refs.planGrid.append(row);
        });
        const count = completed.size;
        refs.planProgress.textContent =
            `${count} of ${config.periods.length} plan blocks complete · checkmarks stay on this device`;
    }

    function coverageBand(analysis) {
        if (analysis.coverage === null) return 'not_provided';
        if (analysis.coverage >= 75) return 'high';
        if (analysis.coverage >= 45) return 'medium';
        return 'low';
    }

    function generatePlan(shouldScroll = true) {
        if (!state.role) return;
        const jobText = refs.jobText.value.slice(0, 20000);
        const resumeText = refs.resumeText.value.slice(0, 12000);
        const analysis = analyze(jobText, resumeText);
        const config = timelineConfig[state.weeks];
        let emphasis = 'This uses the reviewed Amazon SDE II role baseline because no posting was supplied.';
        if (analysis.hasJob && analysis.detectedCount >= 3) {
            emphasis = `${analysis.detectedCount} role signals were detected in the redacted posting.`;
        } else if (analysis.hasJob) {
            emphasis = `The posting contained ${analysis.detectedCount} recognizable signal${analysis.detectedCount === 1 ? '' : 's'}, so the plan keeps the full SDE II baseline.`;
        }
        const gap = analysis.hasResume
            ? ` ${analysis.uncovered.length} evidence area${analysis.uncovered.length === 1 ? '' : 's'} should be strengthened or practiced honestly.`
            : ' Add redacted experience notes for a signal-coverage view; no resume text is required.';

        refs.planTitle.textContent = `${state.role.company} ${state.role.level} · ${config.label}`;
        refs.planSummary.textContent = `${emphasis}${gap} Recruiter instructions and the exact posting remain the source of truth.`;
        refs.coverageValue.textContent = analysis.coverage === null ? '—' : `${analysis.coverage}%`;
        refs.coverageLabel.textContent = analysis.coverage === null ? 'evidence not entered' : 'signal coverage';
        refs.curriculumTitle.textContent = config.label;
        refs.curriculumCadence.textContent = config.cadence;
        renderEvidence(analysis);
        renderResumeActions(analysis);
        renderPlan();
        refs.output.hidden = false;
        refs.status.textContent = 'Plan generated locally. Private text was not saved.';

        window.Analytics?.trackJobPlanGenerate?.(
            roleId,
            state.weeks,
            analysis.hasJob ? 'posting' : 'baseline',
            coverageBand(analysis)
        );

        if (shouldScroll) {
            refs.output.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    refs.timelineButtons.forEach(button => {
        button.addEventListener('click', () => updateTimeline(Number(button.dataset.weeks)));
    });

    refs.jobText?.addEventListener('input', () => {
        refs.jobCount.textContent = `${refs.jobText.value.length.toLocaleString()} / 20,000 characters`;
    });

    refs.resumeText?.addEventListener('input', () => {
        refs.resumeCount.textContent = `${refs.resumeText.value.length.toLocaleString()} / 12,000 characters`;
    });

    refs.generate?.addEventListener('click', () => generatePlan(true));

    refs.planGrid?.addEventListener('change', event => {
        const input = event.target.closest('input[type="checkbox"][data-plan-id]');
        if (!input) return;
        const id = safeId(input.dataset.planId);
        const valid = new Set(validPlanIds(state.weeks));
        if (!valid.has(id)) return;
        const completed = new Set(currentCompleted());
        if (input.checked) completed.add(id);
        else completed.delete(id);
        state.completedByTimeline[state.weeks] = [...completed];
        writeProgress();
        renderPlan();
        window.Analytics?.trackJobPlanStep?.(roleId, state.weeks, completed.size);
    });

    refs.promptGrid?.addEventListener('click', async event => {
        const button = event.target.closest('[data-copy-prompt]');
        if (!button || !state.role) return;
        const promptId = safeId(button.dataset.copyPrompt);
        const prompt = state.role.prompts.find(item => item.id === promptId);
        if (!prompt) return;
        try {
            await navigator.clipboard.writeText(prompt.text);
            button.textContent = 'Copied — keep the evidence yours';
            button.classList.add('is-copied');
            window.setTimeout(() => {
                button.textContent = 'Copy coaching prompt';
                button.classList.remove('is-copied');
            }, 2200);
            window.Analytics?.trackJobPromptCopy?.(roleId, promptId);
        } catch {
            button.textContent = 'Select the prompt and copy manually';
        }
    });

    async function initialize() {
        state.completedByTimeline = readProgress();
        try {
            const response = await fetch('../../data/job-prep-paths.json', {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            if (!response.ok) throw new Error('Role path unavailable.');
            const data = await response.json();
            state.role = data.roles?.find(role => role.id === roleId);
            if (!state.role) throw new Error('Role path invalid.');
            renderSignals();
            renderSources();
            renderPrompts();
            updateTimeline(4);
        } catch {
            refs.signalGrid.setAttribute('aria-busy', 'false');
            refs.promptGrid.setAttribute('aria-busy', 'false');
            refs.status.textContent = 'The role path could not be loaded. Use the Company Explorer and try again.';
            refs.generate.disabled = true;
        }
    }

    initialize();
})();
