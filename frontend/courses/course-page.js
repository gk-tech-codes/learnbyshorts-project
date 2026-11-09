(function () {
    'use strict';

    const body = document.body;
    const courseId = String(body.dataset.courseId || '');
    const videoLibraryUrl = new URL(
        '../data/course-videos.json',
        document.currentScript.src
    );
    const storageKey = 'lbs2:modern-skills';
    const checkboxes = [...document.querySelectorAll('[data-mission-id]')];
    const progressCopy = document.querySelector('[data-progress-copy]');
    const progressPercent = document.querySelector('[data-progress-percent]');
    const progressMeter = document.querySelector('[data-progress-meter]');
    const completionOffer = document.querySelector('[data-completion-offer]');
    const shareButton = document.querySelector('[data-share-course]');
    const shareStatus = document.querySelector('[data-share-status]');
    const foundingLink = document.querySelector('[data-founding-link]');
    const videoLinks = [...document.querySelectorAll('[data-video-link]')];

    function safeId(value) {
        return /^[a-z0-9-]{1,64}$/.test(String(value || '')) ? String(value) : '';
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
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

    function validVideo(video, missionIds) {
        return Boolean(
            video &&
            /^[A-Za-z0-9_-]{11}$/.test(String(video.youtubeId || '')) &&
            typeof video.title === 'string' &&
            typeof video.creator === 'string' &&
            typeof video.why === 'string' &&
            typeof video.before === 'string' &&
            typeof video.after === 'string' &&
            Array.isArray(video.missionIds) &&
            video.missionIds.length > 0 &&
            video.missionIds.every(id => missionIds.has(safeId(id)))
        );
    }

    function videoCard(video, missionTitles) {
        const article = element('article', 'course-video-card');
        const meta = element('div', 'course-video-meta');
        meta.append(
            element('span', '', 'Curated video'),
            element('strong', '', video.creator)
        );

        const title = element('h3', '', video.title);
        const coverage = element('ul', 'course-video-coverage');
        video.missionIds.forEach(id => {
            coverage.append(
                element('li', '', missionTitles.get(id) || 'Proof mission')
            );
        });

        const why = element('p', 'course-video-why', video.why);
        const frame = element('div', 'course-video-frame');
        const consent = element('div', 'course-video-consent');
        consent.append(
            element('span', 'course-video-play', '▶'),
            element(
                'p',
                '',
                'YouTube loads only after you choose to watch. Its privacy terms then apply.'
            )
        );
        const watch = element('button', 'course-video-watch', 'Load private embed');
        watch.type = 'button';
        watch.addEventListener('click', () => {
            const iframe = document.createElement('iframe');
            iframe.src =
                `https://www.youtube-nocookie.com/embed/${video.youtubeId}` +
                '?rel=0&modestbranding=1';
            iframe.title = `${video.title} by ${video.creator}`;
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allow =
                'accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            frame.replaceChildren(iframe);
            window.Analytics?.trackCourseVideoStart?.(
                courseId,
                video.youtubeId,
                video.missionIds.length
            );
        }, { once: true });
        consent.append(watch);
        frame.append(consent);

        const prompts = element('div', 'course-video-prompts');
        const before = element('div', '');
        before.append(
            element('span', '', 'Before watching'),
            element('p', '', video.before)
        );
        const after = element('div', '');
        after.append(
            element('span', '', 'Turn it into proof'),
            element('p', '', video.after)
        );
        prompts.append(before, after);

        const source = element('a', 'course-video-source', 'Open on YouTube ↗');
        source.href = `https://www.youtube.com/watch?v=${video.youtubeId}`;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
        source.addEventListener('click', () => {
            window.Analytics?.trackCourseVideoStart?.(
                courseId,
                video.youtubeId,
                video.missionIds.length
            );
        });

        article.append(meta, title, coverage, why, frame, prompts, source);
        return article;
    }

    async function renderCourseVideos() {
        const response = await fetch(videoLibraryUrl, { credentials: 'same-origin' });
        if (!response.ok) return;
        const library = await response.json();
        const videos = library?.courses?.[courseId];
        if (!Array.isArray(videos) || videos.length === 0) return;

        const missionTitles = new Map(
            checkboxes.map(input => [
                safeId(input.dataset.missionId),
                input.closest('.mission')?.querySelector('h3')?.textContent?.trim()
            ])
        );
        const missionIds = new Set(missionTitles.keys());
        const safeVideos = videos.filter(video => validVideo(video, missionIds));
        if (safeVideos.length === 0) return;

        const section = element('section', 'section course-video-section');
        section.id = 'videos';
        const shell = element('div', 'shell');
        const heading = element('div', 'section-heading');
        const headingId = `course-videos-${courseId}`;
        const headingText = element('h2', '', 'Watch with a mission. Build right after.');
        headingText.id = headingId;
        section.setAttribute('aria-labelledby', headingId);
        heading.append(
            element('span', '', 'Curated watch-to-work library'),
            headingText,
            element(
                'p',
                '',
                'Each video is mapped to a proof mission. Predict first, watch selectively, then produce the artifact—never binge the playlist.'
            )
        );

        const grid = element('div', 'course-video-grid');
        safeVideos.forEach(video => grid.append(videoCard(video, missionTitles)));
        const legal = element(
            'p',
            'course-video-legal',
            `Reviewed ${library.reviewedAt}. Videos remain owned and controlled by their creators and YouTube; LearnByShorts does not copy, rehost, or certify them. Availability, ads, and recommendations may change.`
        );
        shell.append(heading, grid, legal);
        section.append(shell);
        const sources = document.querySelector('#sources');
        if (!sources) return;
        sources.before(section);
        videoLinks.forEach(link => {
            link.hidden = false;
        });
    }

    const initialState = readState();
    if (initialState.activeTrack !== courseId) {
        writeState(courseCompleted(initialState));
    }
    const initial = render();
    window.Analytics?.trackCourseLanding?.(courseId, document.referrer ? 'referred' : 'direct', initial.count);
    renderCourseVideos().catch(() => {
        // Core missions remain fully usable when the optional video library is unavailable.
    });
})();
