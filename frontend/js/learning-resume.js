(function () {
    'use strict';

    const courseId = 'oop-java-migrated';
    const totalSteps = 19;
    const progressKey = `lbs2:${courseId}`;

    function readProgress() {
        try {
            const saved = JSON.parse(localStorage.getItem(progressKey));
            return saved && typeof saved === 'object' ? saved : null;
        } catch {
            return null;
        }
    }

    function dueReviewCount(reviews) {
        const today = new Date().toISOString().slice(0, 10);
        return Object.values(reviews || {}).filter(item =>
            item && typeof item.due === 'string' && item.due <= today
        ).length;
    }

    function initializeResumePrompt() {
        const progress = readProgress();
        const card = document.getElementById('resume-learning');
        if (!progress || !card) return;

        const completed = Array.isArray(progress.completed) ? progress.completed.length : 0;
        const position = Number.isFinite(progress.position) ? progress.position : 0;
        const completedSteps = Math.min(totalSteps, Math.max(completed, position, 0));
        if (completedSteps === 0) return;

        const percent = Math.round(completedSteps / totalSteps * 100);
        const dueReviews = dueReviewCount(progress.reviews);
        const title = document.getElementById('resume-title');
        const detail = document.getElementById('resume-detail');
        const kicker = document.getElementById('resume-kicker');
        const link = document.getElementById('resume-link');
        const heroCta = document.querySelector('.hero-actions .btn-primary');
        const percentLabel = card.querySelector('[data-resume-percent]');
        const progressRing = card.querySelector('.resume-value');

        if (dueReviews > 0) {
            kicker.textContent = 'Review ready';
            title.textContent = `${dueReviews} concept${dueReviews === 1 ? '' : 's'} ready to strengthen`;
            detail.textContent = `You are ${percent}% through the Java OOP preview.`;
            link.firstChild.textContent = 'Review now ';
        } else if (completedSteps >= totalSteps) {
            kicker.textContent = 'Lesson complete';
            title.textContent = 'Keep your Java OOP knowledge fresh';
            detail.textContent = 'Revisit the lesson whenever you want another practice round.';
            link.firstChild.textContent = 'Practice again ';
        } else {
            title.textContent = `Continue your Java OOP lesson — ${percent}% complete`;
            detail.textContent = `${totalSteps - completedSteps} short step${totalSteps - completedSteps === 1 ? '' : 's'} remaining.`;
        }

        if (heroCta) {
            heroCta.setAttribute(
                'aria-label',
                `Open Learning OS with Java OOP at ${percent}% complete`
            );
            const label = heroCta.lastChild;
            if (label) label.textContent = ` Open Mission · Java ${percent}%`;
        }

        if (percentLabel) percentLabel.textContent = `${percent}%`;
        if (progressRing) {
            const circumference = 113;
            progressRing.style.strokeDashoffset = String(circumference - circumference * percent / 100);
        }

        link.addEventListener('click', () => {
            window.Analytics?.trackResumeClick?.(courseId, percent, dueReviews);
        });
        card.hidden = false;
        window.Analytics?.trackResumePrompt?.(courseId, percent, dueReviews);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeResumePrompt);
    } else {
        initializeResumePrompt();
    }
})();
