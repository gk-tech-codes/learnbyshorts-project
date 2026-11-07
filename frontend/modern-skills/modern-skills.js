(function () {
    'use strict';

    const storageKey = 'lbs2:modern-skills';
    const state = {
        category: 'all',
        query: '',
        tracks: [],
        videos: [],
        completed: {}
    };

    const refs = {
        filters: [...document.querySelectorAll('[data-category]')],
        search: document.querySelector('[data-catalog-search]'),
        count: document.querySelector('[data-catalog-count]'),
        courseGrid: document.querySelector('[data-course-grid]'),
        videoGrid: document.querySelector('[data-video-grid]'),
        trackCount: document.querySelector('[data-track-count]'),
        missionCount: document.querySelector('[data-mission-count]'),
        videoCount: document.querySelector('[data-video-count]'),
        progressCount: document.querySelector('[data-progress-count]'),
        courseDialog: document.querySelector('[data-course-dialog]'),
        courseClose: document.querySelector('[data-course-close]'),
        courseMark: document.querySelector('[data-course-mark]'),
        courseKicker: document.querySelector('[data-course-kicker]'),
        courseTitle: document.querySelector('[data-course-title]'),
        courseDescription: document.querySelector('[data-course-description]'),
        courseOutcome: document.querySelector('[data-course-outcome]'),
        courseProgress: document.querySelector('[data-course-progress]'),
        courseMeter: document.querySelector('[data-course-meter]'),
        courseMissions: document.querySelector('[data-course-missions]'),
        courseReferences: document.querySelector('[data-course-references]'),
        courseInteractive: document.querySelector('[data-course-interactive]'),
        videoDialog: document.querySelector('[data-video-dialog]'),
        videoClose: document.querySelector('[data-video-close]'),
        videoKicker: document.querySelector('[data-video-kicker]'),
        videoTitle: document.querySelector('[data-video-title]'),
        videoCredit: document.querySelector('[data-video-credit]'),
        videoFrame: document.querySelector('[data-video-frame]'),
        videoBefore: document.querySelector('[data-video-before]'),
        videoAfter: document.querySelector('[data-video-after]'),
        videoFallback: document.querySelector('[data-video-fallback]'),
        finderForm: document.querySelector('[data-path-finder]'),
        finderGoal: document.querySelector('[data-finder-goal]'),
        finderLevel: document.querySelector('[data-finder-level]'),
        finderPace: document.querySelector('[data-finder-pace]'),
        finderResult: document.querySelector('[data-finder-result]'),
        finderMark: document.querySelector('[data-finder-mark]'),
        finderTitle: document.querySelector('[data-finder-title]'),
        finderReason: document.querySelector('[data-finder-reason]'),
        finderDuration: document.querySelector('[data-finder-duration]'),
        finderOpen: document.querySelector('[data-finder-open]')
    };

    const recommendationRules = Object.freeze({
        ai: Object.freeze({
            beginner: 'ai-fluency',
            intermediate: 'ai-evals-reliability',
            advanced: 'agentic-engineering'
        }),
        build: Object.freeze({
            beginner: 'full-stack-delivery',
            intermediate: 'ai-assisted-coding',
            advanced: 'backend-distributed-systems'
        }),
        cloud: Object.freeze({
            beginner: 'cloud-finops',
            intermediate: 'platform-engineering-kubernetes',
            advanced: 'platform-engineering-kubernetes'
        }),
        data: Object.freeze({
            beginner: 'data-applied-ml',
            intermediate: 'data-applied-ml',
            advanced: 'ai-product-engineering'
        }),
        security: Object.freeze({
            beginner: 'secure-engineering',
            intermediate: 'secure-engineering',
            advanced: 'secure-engineering'
        }),
        career: Object.freeze({
            beginner: 'systems-interviews',
            intermediate: 'systems-interviews',
            advanced: 'systems-interviews'
        })
    });

    const recommendationReasons = Object.freeze({
        'ai-fluency': 'Build a dependable mental model and verification habit before adding tools or autonomous loops.',
        'ai-evals-reliability': 'You already have project experience; the highest-leverage next step is learning to measure whether an AI system actually works.',
        'agentic-engineering': 'Your production experience is best used on tool boundaries, permissions, recovery, and measurable agent behavior.',
        'full-stack-delivery': 'A vertical product slice will connect frontend, APIs, testing, and release fundamentals without unnecessary specialization.',
        'ai-assisted-coding': 'Use your existing project foundation to accelerate implementation while strengthening review, testing, and technical ownership.',
        'backend-distributed-systems': 'Your next growth edge is reasoning about state, concurrency, partial failure, and operations across service boundaries.',
        'cloud-finops': 'Start with the cheapest adequate architecture and learn the operational and cost decisions behind a real cloud workload.',
        'platform-engineering-kubernetes': 'Move beyond individual deployments and build a safe, reusable path that improves how other engineers ship.',
        'data-applied-ml': 'Build a defensible decision workflow from data quality and SQL through baselines, models, and clear explanation.',
        'ai-product-engineering': 'Combine your data experience with retrieval, evaluation, observability, security, and product economics.',
        'secure-engineering': 'Practice threat modeling, identity, supply-chain controls, and AI abuse cases as one delivery discipline.',
        'systems-interviews': 'Diagnose the complete hiring signal, then focus practice on the weakest evidence instead of studying everything.'
    });

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function safeId(value) {
        return /^[a-z0-9-]{1,64}$/.test(String(value || '')) ? String(value) : '';
    }

    function readProgress() {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey));
            if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
            const output = {};
            Object.entries(value.completed || {}).forEach(([trackId, missions]) => {
                const id = safeId(trackId);
                if (!id || !Array.isArray(missions)) return;
                output[id] = [...new Set(missions.map(safeId).filter(Boolean))].slice(0, 20);
            });
            return output;
        } catch {
            return {};
        }
    }

    function completedCount() {
        return state.tracks.reduce((sum, track) => sum + trackProgress(track).count, 0);
    }

    function writeProgress(activeTrack) {
        const total = state.tracks.reduce((sum, track) => sum + track.missions.length, 0);
        const payload = {
            version: 1,
            activeTrack: safeId(activeTrack),
            completed: state.completed,
            percent: total > 0 ? Math.round(completedCount() / total * 100) : 0,
            updatedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
            // Courses remain usable when browser storage is unavailable.
        }
    }

    function trackProgress(track) {
        const completed = state.completed[track.id] || [];
        const count = track.missions.filter(mission => completed.includes(mission.id)).length;
        return {
            completed,
            count,
            percent: Math.round(count / track.missions.length * 100)
        };
    }

    function filteredTracks() {
        const query = state.query.trim().toLowerCase();
        return state.tracks.filter(track => {
            if (state.category !== 'all' && track.category !== state.category) return false;
            if (!query) return true;
            const haystack = [
                track.title,
                track.description,
                track.outcome,
                track.whyNow,
                ...track.tags
            ].join(' ').toLowerCase();
            return haystack.includes(query);
        });
    }

    function renderStats() {
        refs.trackCount.textContent = String(state.tracks.length);
        refs.missionCount.textContent = String(
            state.tracks.reduce((sum, track) => sum + track.missions.length, 0)
        );
        refs.videoCount.textContent = String(state.videos.length);
        refs.progressCount.textContent = String(completedCount());
    }

    function renderCourses() {
        const tracks = filteredTracks();
        refs.courseGrid.replaceChildren();
        refs.courseGrid.setAttribute('aria-busy', 'false');
        refs.count.textContent = `${tracks.length} path${tracks.length === 1 ? '' : 's'} shown · progress stays in this browser`;

        tracks.forEach(track => {
            const progress = trackProgress(track);
            const card = element('article', 'course-card');
            card.style.setProperty('--track-accent', track.accent);

            const top = element('div', 'course-card-top');
            const mark = element('span', 'course-mark', track.mark);
            const meta = element('span', 'course-meta', `${track.level} · ${track.duration}`);
            top.append(mark, meta);

            const category = element('span', 'course-category', track.category);
            const title = element('h3');
            const titleLink = element('a', '', track.title);
            titleLink.href = `../courses/${track.id}/`;
            title.append(titleLink);
            const description = element('p', 'course-description', track.description);
            const tags = element('ul', 'course-tags');
            track.tags.forEach(tag => tags.append(element('li', '', tag)));
            const why = element('p', 'why-now', `Why now: ${track.whyNow}`);

            const progressTop = element('div', 'course-progress-label');
            progressTop.append(
                element('span', '', progress.count > 0 ? `${progress.count}/4 complete` : 'Not started'),
                element('strong', '', `${progress.percent}%`)
            );
            const meter = element('div', 'course-progress-meter');
            const meterValue = element('span');
            meterValue.style.width = `${progress.percent}%`;
            meter.append(meterValue);

            const actions = element('div', 'course-actions');
            const fullCourse = element('a', 'course-open course-open-primary', progress.count > 0 ? 'Continue full path →' : 'Start full path →');
            fullCourse.href = `../courses/${track.id}/`;
            fullCourse.dataset.courseLanding = track.id;
            const button = element('button', 'course-open course-open-secondary', 'Quick preview');
            button.type = 'button';
            button.dataset.openTrack = track.id;
            actions.append(fullCourse, button);

            card.append(top, category, title, description, tags, why, progressTop, meter, actions);
            refs.courseGrid.append(card);
        });
    }

    function referenceLink(reference) {
        const link = element('a', 'reference-link');
        let url;
        try {
            url = new URL(reference.url, window.location.href);
        } catch {
            return null;
        }
        if (url.origin !== window.location.origin && url.protocol !== 'https:') return null;
        link.href = url.href;
        link.append(
            element('strong', '', reference.label),
            element('span', '', `${reference.provider} ↗`)
        );
        if (url.origin !== window.location.origin) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        return link;
    }

    function openTrack(trackId, updateUrl = true) {
        const track = state.tracks.find(item => item.id === trackId);
        if (!track) return;
        const progress = trackProgress(track);

        refs.courseMark.textContent = track.mark;
        refs.courseMark.style.background = track.accent;
        refs.courseKicker.textContent = `${track.level} · ${track.duration}`;
        refs.courseTitle.textContent = track.title;
        refs.courseDescription.textContent = track.description;
        refs.courseOutcome.textContent = track.outcome;
        refs.courseProgress.textContent = `${progress.count} of ${track.missions.length} complete`;
        refs.courseMeter.style.width = `${progress.percent}%`;
        refs.courseMissions.replaceChildren();

        track.missions.forEach((mission, index) => {
            const complete = progress.completed.includes(mission.id);
            const row = element('label', complete ? 'proof-mission is-complete' : 'proof-mission');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = complete;
            checkbox.dataset.trackId = track.id;
            checkbox.dataset.missionId = mission.id;
            const number = element('span', 'mission-number', String(index + 1).padStart(2, '0'));
            const copy = element('div', 'mission-copy');
            copy.append(
                element('strong', '', mission.title),
                element('p', '', mission.action),
                element('small', '', `Proof: ${mission.proof}`)
            );
            row.append(checkbox, number, copy);
            refs.courseMissions.append(row);
        });

        refs.courseReferences.replaceChildren();
        track.references.forEach(reference => {
            const link = referenceLink(reference);
            if (link) refs.courseReferences.append(link);
        });

        if (track.interactiveUrl) {
            refs.courseInteractive.href = new URL(track.interactiveUrl, window.location.href).href;
            refs.courseInteractive.hidden = false;
        } else {
            refs.courseInteractive.hidden = true;
            refs.courseInteractive.removeAttribute('href');
        }

        refs.courseDialog.dataset.trackId = track.id;
        if (!refs.courseDialog.open) refs.courseDialog.showModal();
        if (updateUrl) {
            const url = new URL(window.location.href);
            url.searchParams.set('track', track.id);
            history.replaceState({}, '', url);
        }
        window.Analytics?.trackModernCourseOpen?.(track.id, progress.count);
    }

    function closeTrack() {
        refs.courseDialog.close();
        const url = new URL(window.location.href);
        url.searchParams.delete('track');
        history.replaceState({}, '', url);
    }

    function renderVideos() {
        refs.videoGrid.replaceChildren();
        state.videos.forEach(video => {
            const card = element('article', 'video-card');
            const visual = element('div', 'video-visual');
            visual.append(
                element('span', 'video-category', video.category),
                element('span', 'video-play', '▶'),
                element('small', '', video.length)
            );
            const copy = element('div', 'video-copy');
            copy.append(
                element('span', '', video.creator),
                element('h3', '', video.title),
                element('p', '', video.why)
            );
            const button = element('button', '', 'Open active-watch lesson →');
            button.type = 'button';
            button.dataset.openVideo = video.id;
            copy.append(button);
            card.append(visual, copy);
            refs.videoGrid.append(card);
        });
    }

    function openVideo(videoId) {
        const video = state.videos.find(item => item.id === videoId);
        if (!video || !/^[A-Za-z0-9_-]{11}$/.test(video.youtubeId)) return;

        refs.videoKicker.textContent = `${video.category} · ${video.length}`;
        refs.videoTitle.textContent = video.title;
        refs.videoCredit.textContent = `Third-party lesson by ${video.creator}.`;
        refs.videoBefore.textContent = video.before;
        refs.videoAfter.textContent = video.after;
        refs.videoFallback.href = `https://www.youtube.com/watch?v=${video.youtubeId}`;
        refs.videoFrame.replaceChildren();

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`;
        iframe.title = `${video.title} by ${video.creator}`;
        iframe.loading = 'eager';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        refs.videoFrame.append(iframe);
        refs.videoDialog.dataset.videoId = video.id;
        refs.videoDialog.showModal();
        window.Analytics?.trackCuratedVideoOpen?.(video.id, video.category);
    }

    function closeVideo() {
        refs.videoDialog.close();
        refs.videoFrame.replaceChildren(
            element('div', 'video-frame-placeholder', 'The privacy-enhanced player loads only after you open this lesson.')
        );
    }

    function recommendTrack() {
        const goal = String(refs.finderGoal?.value || '');
        const level = String(refs.finderLevel?.value || '');
        const pace = Number(refs.finderPace?.value);
        const trackId = recommendationRules[goal]?.[level];
        const track = state.tracks.find(item => item.id === trackId);
        if (!track || !refs.finderResult) return;

        refs.finderResult.style.setProperty('--finder-accent', track.accent);
        refs.finderMark.textContent = track.mark;
        refs.finderTitle.textContent = track.title;
        refs.finderReason.textContent = recommendationReasons[track.id] || track.whyNow;
        refs.finderDuration.textContent = `${track.duration} · ${[15, 30, 60].includes(pace) ? pace : 30} min/day`;
        refs.finderOpen.dataset.finderTrack = track.id;
        refs.finderOpen.href = `../courses/${track.id}/`;
        refs.finderResult.hidden = false;
        refs.finderResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        window.Analytics?.trackPathFinderComplete?.(goal, level, pace, track.id);
    }

    refs.filters.forEach(button => {
        button.addEventListener('click', () => {
            state.category = button.dataset.category;
            refs.filters.forEach(candidate => {
                candidate.setAttribute('aria-pressed', String(candidate === button));
            });
            renderCourses();
        });
    });

    refs.search?.addEventListener('input', event => {
        state.query = event.target.value.slice(0, 80);
        renderCourses();
    });

    refs.finderForm?.addEventListener('submit', event => {
        event.preventDefault();
        recommendTrack();
    });

    refs.finderOpen?.addEventListener('click', () => {
        const trackId = safeId(refs.finderOpen.dataset.finderTrack);
        if (trackId) window.Analytics?.trackCourseLandingClick?.(trackId, 'path_finder');
    });

    refs.courseGrid?.addEventListener('click', event => {
        const landing = event.target.closest('[data-course-landing]');
        if (landing) {
            window.Analytics?.trackCourseLandingClick?.(landing.dataset.courseLanding, 'catalog');
            return;
        }
        const button = event.target.closest('[data-open-track]');
        if (button) openTrack(button.dataset.openTrack);
    });

    refs.courseMissions?.addEventListener('change', event => {
        const input = event.target.closest('input[type="checkbox"]');
        if (!input) return;
        const trackId = safeId(input.dataset.trackId);
        const missionId = safeId(input.dataset.missionId);
        const completed = new Set(state.completed[trackId] || []);
        if (input.checked) completed.add(missionId);
        else completed.delete(missionId);
        state.completed[trackId] = [...completed];
        writeProgress(trackId);
        renderStats();
        renderCourses();
        openTrack(trackId, false);
        window.Analytics?.trackModernCourseStep?.(trackId, state.completed[trackId].length);
    });

    refs.videoGrid?.addEventListener('click', event => {
        const button = event.target.closest('[data-open-video]');
        if (button) openVideo(button.dataset.openVideo);
    });

    refs.courseClose?.addEventListener('click', closeTrack);
    refs.courseDialog?.addEventListener('click', event => {
        if (event.target === refs.courseDialog) closeTrack();
    });
    refs.courseDialog?.addEventListener('cancel', event => {
        event.preventDefault();
        closeTrack();
    });

    refs.videoClose?.addEventListener('click', closeVideo);
    refs.videoDialog?.addEventListener('click', event => {
        if (event.target === refs.videoDialog) closeVideo();
    });
    refs.videoDialog?.addEventListener('cancel', event => {
        event.preventDefault();
        closeVideo();
    });

    async function initialize() {
        state.completed = readProgress();
        try {
            const response = await fetch('../data/modern-skills.json', {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            if (!response.ok) throw new Error('Modern course catalog unavailable.');
            const data = await response.json();
            if (!Array.isArray(data.tracks) || !Array.isArray(data.videos)) {
                throw new Error('Modern course catalog invalid.');
            }
            state.tracks = data.tracks;
            state.videos = data.videos;
            renderStats();
            renderCourses();
            renderVideos();

            const requested = safeId(new URLSearchParams(window.location.search).get('track'));
            if (requested) openTrack(requested, false);
        } catch {
            refs.courseGrid.setAttribute('aria-busy', 'false');
            refs.count.textContent = 'The catalog could not be loaded. The AI and interview labs remain available.';
            const fallback = element('a', 'catalog-fallback', 'Open AI Fluency Lab →');
            fallback.href = '../ai-era-lab/index.html';
            refs.courseGrid.replaceChildren(fallback);
        }
    }

    initialize();
})();
