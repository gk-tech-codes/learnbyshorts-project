(function () {
    'use strict';

    const main = document.querySelector('[data-dashboard-main]') ||
        document.querySelector('.dashboard-main');
    const status = document.querySelector('[data-dashboard-status]');
    const courseGrid = document.querySelector('[data-course-grid]');
    const syncButton = document.querySelector('[data-sync-local]');
    const logoutButton = document.querySelector('[data-logout]');

    const catalog = [
        {
            id: 'ai-fluency',
            mark: 'AI',
            title: 'AI Fluency Lab',
            description: 'Prompting, context, coding, skills, tools, agents, and evaluation.',
            href: 'ai-era-lab/index.html',
            color: '#c8ff68'
        },
        {
            id: 'interview-lab',
            mark: 'HI',
            title: 'Modern Interview Lab',
            description: 'Build a role-aware plan across the complete engineering signal stack.',
            href: 'interview-lab/index.html',
            color: '#ff9c8f'
        },
        {
            id: 'oop-java',
            mark: 'J',
            title: 'Java OOP Lab',
            description: 'Learn objects, classes, and design decisions through a coding story.',
            href: 'learn-v2/index.html',
            color: '#ffdc68'
        }
    ];

    function showStatus(message, isError = false) {
        if (!status) return;
        status.querySelector('p').textContent = message;
        status.classList.toggle('is-error', isError);
    }

    function normalizeProgress(payload) {
        if (!payload || typeof payload !== 'object') return {};
        if (payload.courses && typeof payload.courses === 'object') return payload.courses;
        return {};
    }

    function progressPercent(state) {
        if (!state || typeof state !== 'object') return 0;
        if (state.completed === true) return 100;
        const direct = Number(state.percent ?? state.progressPercent);
        if (Number.isFinite(direct)) return Math.max(0, Math.min(100, Math.round(direct)));
        const step = Number(state.currentBlock ?? state.currentStep ?? state.step);
        const total = Number(state.totalBlocks ?? state.totalSteps ?? 19);
        if (Number.isFinite(step) && Number.isFinite(total) && total > 0) {
            return Math.max(0, Math.min(100, Math.round((step / total) * 100)));
        }
        return Object.keys(state).length > 0 ? 5 : 0;
    }

    function updatedTime(state) {
        const candidate = state?.updatedAt || state?.lastVisited || state?.lastSaved;
        const value = candidate ? new Date(candidate) : null;
        return value && !Number.isNaN(value.getTime()) ? value : null;
    }

    function renderCourses(courses) {
        if (!courseGrid) return;
        courseGrid.replaceChildren();

        catalog.forEach(course => {
            const state = courses[course.id]?.state || courses[course.id] || {};
            const percent = progressPercent(state);
            const card = document.createElement('article');
            card.className = 'dashboard-course';
            card.style.setProperty('--course-color', course.color);

            const mark = document.createElement('span');
            mark.className = 'course-mark';
            mark.textContent = course.mark;

            const label = document.createElement('span');
            label.textContent = percent > 0 ? `${percent}% saved` : 'Ready to start';

            const title = document.createElement('h3');
            title.textContent = course.title;

            const description = document.createElement('p');
            description.textContent = course.description;

            const meter = document.createElement('div');
            meter.className = 'course-progress';
            meter.setAttribute('aria-label', `${course.title}: ${percent}% complete`);
            const meterValue = document.createElement('span');
            meterValue.style.width = `${percent}%`;
            meter.append(meterValue);

            const link = document.createElement('a');
            link.href = course.href;
            link.textContent = percent > 0 ? 'Continue path' : 'Start path';
            const arrow = document.createElement('span');
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '→';
            link.append(arrow);

            card.append(mark, label, title, description, meter, link);
            courseGrid.append(card);
        });
    }

    function renderStats(courses) {
        const entries = Object.values(courses).map(value => value?.state || value || {});
        const started = entries.filter(state => progressPercent(state) > 0).length;
        const completed = entries.filter(state => progressPercent(state) >= 100).length;
        const latest = entries
            .map(updatedTime)
            .filter(Boolean)
            .sort((a, b) => b.getTime() - a.getTime())[0];

        document.querySelector('[data-stat-started]').textContent = String(started);
        document.querySelector('[data-stat-completed]').textContent = String(completed);
        document.querySelector('[data-stat-last]').textContent = latest
            ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(latest)
            : '—';
    }

    function renderUser(user) {
        const name = user?.name || user?.email || 'Learner';
        const first = name.includes('@') ? 'learner' : name.split(/\s+/)[0];
        document.querySelector('[data-first-name]').textContent = first;
        document.querySelector('[data-profile-name]').textContent = name;
        document.querySelector('[data-profile-email]').textContent = user?.email || 'Secure account';
        document.querySelector('[data-profile-initial]').textContent =
            (first.charAt(0) || 'L').toUpperCase();
    }

    async function loadDashboard() {
        await window.authService?.initialized;
        if (!window.authService?.isAuthenticated()) {
            window.location.replace('/login.html?redirect=/dashboard.html');
            return;
        }

        renderUser(window.authService.getUser());
        try {
            const payload = await window.authService.getProgress();
            const courses = normalizeProgress(payload);
            renderCourses(courses);
            renderStats(courses);
            showStatus('Your account is secure and synced.');
        } catch {
            renderCourses({});
            renderStats({});
            showStatus('Your account is signed in, but cloud progress could not be loaded.', true);
        } finally {
            main?.setAttribute('aria-busy', 'false');
        }
    }

    syncButton?.addEventListener('click', async () => {
        syncButton.disabled = true;
        showStatus('Syncing local course progress…');
        try {
            await window.authService.syncLocalProgress();
            const payload = await window.authService.getProgress();
            const courses = normalizeProgress(payload);
            renderCourses(courses);
            renderStats(courses);
            showStatus('This browser’s eligible lesson progress is now synced.');
        } catch {
            showStatus('Local progress could not be synced. Your browser copy was not removed.', true);
        } finally {
            syncButton.disabled = false;
        }
    });

    logoutButton?.addEventListener('click', () => {
        logoutButton.disabled = true;
        window.authService.logout();
    });

    loadDashboard();
})();
