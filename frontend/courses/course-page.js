(function () {
    'use strict';

    const body = document.body;
    const courseId = String(body.dataset.courseId || '');
    const storageKey = 'lbs2:modern-skills';
    const checkboxes = [...document.querySelectorAll('[data-mission-id]')];
    const progressCopy = document.querySelector('[data-progress-copy]');
    const progressPercent = document.querySelector('[data-progress-percent]');
    const progressMeter = document.querySelector('[data-progress-meter]');
    const completionOffer = document.querySelector('[data-completion-offer]');
    const shareButton = document.querySelector('[data-share-course]');
    const shareStatus = document.querySelector('[data-share-status]');
    const foundingLink = document.querySelector('[data-founding-link]');

    function safeId(value) {
        return /^[a-z0-9-]{1,64}$/.test(String(value || '')) ? String(value) : '';
    }

    function readState() {
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey));
            if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
            return stored;
        } catch {
            return {};
        }
    }

    function courseCompleted(state) {
        const values = state.completed?.[courseId];
        if (!Array.isArray(values)) return [];
        return [...new Set(values.map(safeId).filter(Boolean))];
    }

    function writeState(completed) {
        const state = readState();
        const allCompleted = state.completed && typeof state.completed === 'object'
            ? state.completed
            : {};
        allCompleted[courseId] = completed;
        const totalMissions = 48;
        const completedTotal = Object.values(allCompleted)
            .filter(Array.isArray)
            .reduce((sum, missions) => sum + new Set(missions.map(safeId).filter(Boolean)).size, 0);
        const payload = {
            version: 1,
            activeTrack: courseId,
            completed: allCompleted,
            percent: Math.min(100, Math.round(completedTotal / totalMissions * 100)),
            updatedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
            // The static course remains usable when storage is unavailable.
        }
    }

    function render() {
        const completed = new Set(courseCompleted(readState()));
        checkboxes.forEach(input => {
            input.checked = completed.has(safeId(input.dataset.missionId));
            input.closest('.mission')?.classList.toggle('is-complete', input.checked);
        });
        const count = checkboxes.filter(input => input.checked).length;
        const percent = checkboxes.length > 0 ? Math.round(count / checkboxes.length * 100) : 0;
        progressCopy.textContent = `${count} of ${checkboxes.length} proof missions complete`;
        progressPercent.textContent = `${percent}%`;
        progressMeter.style.width = `${percent}%`;
        completionOffer.hidden = count !== checkboxes.length;
        return { count, percent };
    }

    checkboxes.forEach(input => {
        input.addEventListener('change', () => {
            const completed = checkboxes
                .filter(candidate => candidate.checked)
                .map(candidate => safeId(candidate.dataset.missionId))
                .filter(Boolean);
            writeState(completed);
            const progress = render();
            window.Analytics?.trackModernCourseStep?.(courseId, progress.count);
            if (progress.percent === 100) {
                window.Analytics?.trackCourseCompleteOffer?.(courseId, 'shown');
            }
        });
    });

    async function shareCourse() {
        const title = document.querySelector('h1')?.textContent?.trim() || 'LearnByShorts course';
        const shareData = {
            title: `${title} | LearnByShorts`,
            text: `I found this free, proof-driven learning path: ${title}`,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                shareStatus.textContent = 'Shared.';
                window.Analytics?.trackCourseShare?.(courseId, 'native');
                return;
            }
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            shareStatus.textContent = 'Course link copied.';
            window.Analytics?.trackCourseShare?.(courseId, 'clipboard');
        } catch (error) {
            if (error?.name !== 'AbortError') {
                shareStatus.textContent = 'Copy the page address to share this course.';
            }
        }
    }

    shareButton?.addEventListener('click', shareCourse);
    foundingLink?.addEventListener('click', () => {
        window.Analytics?.trackCourseCompleteOffer?.(courseId, 'clicked');
    });

    const initialState = readState();
    if (initialState.activeTrack !== courseId) {
        writeState(courseCompleted(initialState));
    }
    const initial = render();
    window.Analytics?.trackCourseLanding?.(courseId, document.referrer ? 'referred' : 'direct', initial.count);
})();
