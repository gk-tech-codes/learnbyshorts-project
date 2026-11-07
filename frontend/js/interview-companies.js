(function () {
    'use strict';

    const storageKey = 'lbs2:company-interviews';
    const state = {
        role: 'all',
        query: '',
        compare: [],
        progress: {},
        companies: []
    };

    const refs = {
        grid: document.querySelector('[data-company-grid]'),
        count: document.querySelector('[data-result-count]'),
        filters: [...document.querySelectorAll('[data-role]')],
        search: document.querySelector('[data-company-search]'),
        comparison: document.querySelector('[data-comparison]'),
        dialog: document.querySelector('[data-company-dialog]'),
        dialogClose: document.querySelector('[data-dialog-close]'),
        dialogMark: document.querySelector('[data-dialog-mark]'),
        dialogTitle: document.querySelector('[data-dialog-title]'),
        dialogKicker: document.querySelector('[data-dialog-kicker]'),
        dialogSummary: document.querySelector('[data-dialog-summary]'),
        dialogFormats: document.querySelector('[data-dialog-formats]'),
        dialogSignals: document.querySelector('[data-dialog-signals]'),
        dialogCaveat: document.querySelector('[data-dialog-caveat]'),
        dialogSource: document.querySelector('[data-dialog-source]'),
        dialogRolePath: document.querySelector('[data-dialog-role-path]'),
        dialogProgress: document.querySelector('[data-dialog-progress]'),
        dialogMeter: document.querySelector('[data-dialog-meter]'),
        dialogSprint: document.querySelector('[data-dialog-sprint]')
    };

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function safeId(value) {
        return /^[a-z0-9-]{1,60}$/.test(String(value || '')) ? String(value) : '';
    }

    function readProgress() {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey));
            if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
            const output = {};
            Object.entries(value.completed || {}).forEach(([companyId, steps]) => {
                const id = safeId(companyId);
                if (!id || !Array.isArray(steps)) return;
                output[id] = [...new Set(steps.map(safeId).filter(Boolean))].slice(0, 20);
            });
            return output;
        } catch {
            return {};
        }
    }

    function writeProgress() {
        const totalSteps = state.companies.reduce((sum, company) => sum + company.sprint.length, 0);
        const completedSteps = state.companies.reduce(
            (sum, company) => sum + companyProgress(company).count,
            0
        );
        const payload = {
            version: 1,
            completed: state.progress,
            percent: totalSteps > 0 ? Math.round(completedSteps / totalSteps * 100) : 0,
            updatedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
            // The practice sprint remains usable when storage is unavailable.
        }
    }

    function companyProgress(company) {
        const completed = state.progress[company.id] || [];
        const count = company.sprint.filter(step => completed.includes(step.id)).length;
        return {
            completed,
            count,
            percent: Math.round(count / company.sprint.length * 100)
        };
    }

    function filteredCompanies() {
        const query = state.query.trim().toLowerCase();
        return state.companies.filter(company => {
            if (state.role !== 'all' && !company.roles.includes(state.role)) return false;
            if (!query) return true;
            const haystack = [
                company.name,
                company.summary,
                ...company.formats,
                ...company.signals
            ].join(' ').toLowerCase();
            return haystack.includes(query);
        });
    }

    function compareToggle(companyId) {
        if (state.compare.includes(companyId)) {
            state.compare = state.compare.filter(id => id !== companyId);
        } else if (state.compare.length < 3) {
            state.compare = [...state.compare, companyId];
        }
        renderCompanies();
        renderComparison();
    }

    function renderCompanies() {
        const companies = filteredCompanies();
        refs.grid.replaceChildren();
        refs.grid.setAttribute('aria-busy', 'false');
        refs.count.textContent = `${companies.length} compan${companies.length === 1 ? 'y' : 'ies'} shown · select up to three to compare`;

        companies.forEach(company => {
            const progress = companyProgress(company);
            const card = element('article', 'company-card');
            card.style.setProperty('--company-accent', company.accent);

            const top = element('div', 'company-card-top');
            const mark = element('span', 'company-card-mark', company.mark);
            const progressLabel = element(
                'span',
                progress.count > 0 ? 'company-progress is-started' : 'company-progress',
                progress.count > 0 ? `${progress.count}/4 practiced` : 'Ready to start'
            );
            top.append(mark, progressLabel);

            const title = element('h3', '', company.name);
            const summary = element('p', 'company-card-summary', company.summary);
            const signals = element('ul', 'company-signal-list');
            company.signals.slice(0, 3).forEach(signal => signals.append(element('li', '', signal)));

            const meter = element('div', 'company-card-meter');
            const meterValue = element('span');
            meterValue.style.width = `${progress.percent}%`;
            meter.append(meterValue);

            const actions = element('div', 'company-card-actions');
            const open = element('button', 'open-company', 'Open prep sprint →');
            open.type = 'button';
            open.dataset.openCompany = company.id;
            if (company.rolePathUrl) {
                const rolePath = element('a', 'role-plan-link', company.rolePathLabel || 'Build a role plan →');
                rolePath.href = company.rolePathUrl;
                actions.append(rolePath);
            }
            const compare = element(
                'button',
                state.compare.includes(company.id) ? 'compare-company is-selected' : 'compare-company',
                state.compare.includes(company.id) ? '✓ Added to comparison' : '+ Add to comparison'
            );
            compare.type = 'button';
            compare.dataset.compareCompany = company.id;
            compare.disabled = state.compare.length >= 3 && !state.compare.includes(company.id);
            actions.append(open, compare);

            card.append(top, title, summary, signals, meter, actions);
            refs.grid.append(card);
        });
    }

    function listInto(target, values) {
        target.replaceChildren();
        values.forEach(value => target.append(element('li', '', value)));
    }

    function openCompany(companyId, updateUrl = true) {
        const company = state.companies.find(item => item.id === companyId);
        if (!company) return;
        const progress = companyProgress(company);

        refs.dialogMark.textContent = company.mark;
        refs.dialogMark.style.background = company.accent;
        refs.dialogKicker.textContent = `${company.name} · evidence sprint`;
        refs.dialogTitle.textContent = `Prepare for ${company.name} without guessing the loop.`;
        refs.dialogSummary.textContent = company.summary;
        listInto(refs.dialogFormats, company.formats);
        listInto(refs.dialogSignals, company.signals);
        refs.dialogCaveat.textContent = company.caveat;
        refs.dialogSource.href = company.sourceUrl;
        refs.dialogSource.textContent = `${company.sourceLabel} ↗`;
        if (company.rolePathUrl) {
            refs.dialogRolePath.href = company.rolePathUrl;
            refs.dialogRolePath.textContent = `${company.rolePathLabel || 'Build a role plan'} →`;
            refs.dialogRolePath.hidden = false;
        } else {
            refs.dialogRolePath.hidden = true;
            refs.dialogRolePath.removeAttribute('href');
        }
        refs.dialogProgress.textContent = `${progress.count} of ${company.sprint.length} complete`;
        refs.dialogMeter.style.width = `${progress.percent}%`;
        refs.dialogSprint.replaceChildren();

        company.sprint.forEach((step, index) => {
            const complete = progress.completed.includes(step.id);
            const row = element('label', complete ? 'sprint-step is-complete' : 'sprint-step');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = complete;
            checkbox.dataset.companyId = company.id;
            checkbox.dataset.stepId = step.id;
            const number = element('span', 'sprint-number', String(index + 1).padStart(2, '0'));
            const copy = element('div', 'sprint-copy');
            copy.append(
                element('strong', '', step.title),
                element('p', '', step.task),
                element('small', '', `Evidence: ${step.evidence}`)
            );
            row.append(checkbox, number, copy);
            refs.dialogSprint.append(row);
        });

        refs.dialog.dataset.companyId = company.id;
        if (!refs.dialog.open) refs.dialog.showModal();
        if (updateUrl) {
            const url = new URL(window.location.href);
            url.searchParams.set('company', company.id);
            history.replaceState({}, '', url);
        }
        window.Analytics?.trackCompanyInterviewOpen?.(company.id, progress.count);
    }

    function closeDialog() {
        refs.dialog.close();
        const url = new URL(window.location.href);
        url.searchParams.delete('company');
        history.replaceState({}, '', url);
    }

    function renderComparison() {
        refs.comparison.replaceChildren();
        const companies = state.compare
            .map(id => state.companies.find(company => company.id === id))
            .filter(Boolean);
        if (companies.length === 0) {
            refs.comparison.append(element('p', 'empty-comparison', 'Select companies using “Add to comparison.”'));
            return;
        }

        const header = element('div', 'comparison-row comparison-header');
        header.append(element('strong', '', 'Signal'));
        companies.forEach(company => header.append(element('strong', '', company.name)));
        refs.comparison.append(header);

        const rows = [
            ['Core formats', company => company.formats.join(' · ')],
            ['Preparation emphasis', company => company.signals.slice(0, 2).join(' · ')],
            ['Reality check', company => company.caveat],
            ['Sprint progress', company => `${companyProgress(company).count} of 4 complete`]
        ];
        rows.forEach(([label, value]) => {
            const row = element('div', 'comparison-row');
            row.append(element('strong', '', label));
            companies.forEach(company => row.append(element('p', '', value(company))));
            refs.comparison.append(row);
        });
    }

    refs.filters.forEach(button => {
        button.addEventListener('click', () => {
            state.role = button.dataset.role;
            refs.filters.forEach(candidate => {
                candidate.setAttribute('aria-pressed', String(candidate === button));
            });
            renderCompanies();
        });
    });

    refs.search?.addEventListener('input', event => {
        state.query = event.target.value.slice(0, 80);
        renderCompanies();
    });

    refs.grid?.addEventListener('click', event => {
        const open = event.target.closest('[data-open-company]');
        if (open) {
            openCompany(open.dataset.openCompany);
            return;
        }
        const compare = event.target.closest('[data-compare-company]');
        if (compare) compareToggle(compare.dataset.compareCompany);
    });

    refs.dialogSprint?.addEventListener('change', event => {
        const input = event.target.closest('input[type="checkbox"]');
        if (!input) return;
        const companyId = safeId(input.dataset.companyId);
        const stepId = safeId(input.dataset.stepId);
        const completed = new Set(state.progress[companyId] || []);
        if (input.checked) completed.add(stepId);
        else completed.delete(stepId);
        state.progress[companyId] = [...completed];
        writeProgress();
        openCompany(companyId, false);
        renderCompanies();
        renderComparison();
        const company = state.companies.find(item => item.id === companyId);
        window.Analytics?.trackCompanyInterviewStep?.(
            companyId,
            company ? companyProgress(company).count : 0
        );
    });

    refs.dialogClose?.addEventListener('click', closeDialog);
    refs.dialog?.addEventListener('click', event => {
        if (event.target === refs.dialog) closeDialog();
    });
    refs.dialog?.addEventListener('cancel', event => {
        event.preventDefault();
        closeDialog();
    });

    async function initialize() {
        state.progress = readProgress();
        try {
            const response = await fetch('data/company-interviews.json', {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            if (!response.ok) throw new Error('Company catalog unavailable.');
            const data = await response.json();
            if (!Array.isArray(data.companies)) throw new Error('Company catalog invalid.');
            state.companies = data.companies;
            renderCompanies();
            renderComparison();

            const requested = safeId(new URLSearchParams(window.location.search).get('company'));
            if (requested) openCompany(requested, false);
        } catch {
            refs.grid.setAttribute('aria-busy', 'false');
            refs.count.textContent = 'Company guidance could not be loaded. Try the readiness lab instead.';
            const fallback = element('a', 'load-fallback', 'Open Modern Interview Lab →');
            fallback.href = 'interview-lab/index.html';
            refs.grid.replaceChildren(fallback);
        }
    }

    initialize();
})();
