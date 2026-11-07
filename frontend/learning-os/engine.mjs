const DAY_MS = 24 * 60 * 60 * 1000;

export const learningTotals = Object.freeze({
    javaSteps: 19,
    aiLevels: 7,
    interviewSkills: 6,
    modernMissions: 4
});

const goalOrder = Object.freeze({
    build: ['java', 'ai', 'interview'],
    interview: ['interview', 'java', 'ai'],
    ai: ['ai', 'java', 'interview'],
    foundation: ['java', 'interview', 'ai']
});

const focusLibrary = Object.freeze({
    modern: {
        id: 'modern',
        label: 'Advance your proof path',
        title: 'Continue your active modern skills course',
        description: 'Complete the next proof mission and save an artifact another person can inspect.',
        href: '../modern-skills/index.html'
    },
    java: {
        id: 'java',
        label: 'Build with code',
        title: 'Continue the Java OOP story',
        description: 'Solve the next code decision, run the private checks, and explain why the fix works.',
        href: '../learn-v2/index.html'
    },
    ai: {
        id: 'ai',
        label: 'Direct modern AI',
        title: 'Advance one AI fluency level',
        description: 'Practice a bounded AI workflow, verify its output, and keep the final judgment in your hands.',
        href: '../ai-era-lab/index.html'
    },
    interview: {
        id: 'interview',
        label: 'Make reasoning visible',
        title: 'Practice your weakest interview signal',
        description: 'Use a short timed drill, narrate assumptions, and finish with one evidence-backed improvement.',
        href: '../interview-lab/index.html'
    }
});

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

function safeObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

export function dayKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

export function parseStoredValue(raw, fallback = {}) {
    try {
        return safeObject(JSON.parse(raw)) || fallback;
    } catch {
        return fallback;
    }
}

function validDay(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function normalizePreferences(value) {
    const preferences = safeObject(value);
    return {
        goal: goalOrder[preferences.goal] ? preferences.goal : 'build',
        minutes: [5, 10, 20].includes(Number(preferences.minutes))
            ? Number(preferences.minutes)
            : 10
    };
}

export function normalizeLearningState(value) {
    const state = safeObject(value);
    const missions = safeArray(state.missions)
        .filter(item => item && validDay(item.date))
        .slice(-90)
        .map(item => ({
            date: item.date,
            completedSteps: [...new Set(
                safeArray(item.completedSteps)
                    .map(step => String(step))
                    .filter(step => /^(recall|focus|prove)$/.test(step))
            )],
            completed: item.completed === true
        }));
    const calibration = safeArray(state.calibration)
        .filter(item => item && /^[a-z0-9-]{1,40}$/.test(String(item.questionId || '')))
        .slice(-100)
        .map(item => ({
            questionId: String(item.questionId),
            confidence: clamp(item.confidence, 0, 1),
            correct: item.correct === true,
            date: validDay(item.date) ? item.date : ''
        }));
    const proofs = safeArray(state.proofs)
        .filter(item => item && /^[a-z0-9-]{1,40}$/.test(String(item.id || '')))
        .slice(-50)
        .map(item => ({
            id: String(item.id),
            type: /^[a-z-]{1,30}$/.test(String(item.type || ''))
                ? String(item.type)
                : 'practice',
            date: validDay(item.date) ? item.date : '',
            score: clamp(item.score, 0, 4)
        }));

    return {
        version: 1,
        preferences: normalizePreferences(state.preferences),
        missions,
        calibration,
        proofs,
        percent: clamp(state.percent, 0, 100),
        updatedAt: typeof state.updatedAt === 'string' ? state.updatedAt : ''
    };
}

function completedJavaSteps(javaState) {
    const completed = safeArray(javaState.completed).length;
    const position = Number(javaState.position);
    return clamp(Math.max(completed, Number.isFinite(position) ? position : 0), 0, learningTotals.javaSteps);
}

function dueJavaReviews(javaState, today) {
    return Object.values(safeObject(javaState.reviews)).filter(review =>
        review && validDay(review.due) && review.due <= today
    ).length;
}

function interviewMastery(interviewState) {
    const scores = Object.values(safeObject(interviewState.scores))
        .map(Number)
        .filter(Number.isFinite);
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, score) => sum + clamp(score, 0, 2), 0);
    return Math.round(total / (learningTotals.interviewSkills * 2) * 100);
}

function modernMastery(modernState) {
    const activeTrack = /^[a-z0-9-]{1,64}$/.test(String(modernState.activeTrack || ''))
        ? String(modernState.activeTrack)
        : '';
    const completed = activeTrack
        ? [...new Set(
            safeArray(safeObject(modernState.completed)[activeTrack])
                .map(String)
                .filter(id => /^[a-z0-9-]{1,64}$/.test(id))
        )].slice(0, learningTotals.modernMissions)
        : [];
    return {
        activeTrack,
        completedMissions: completed.length,
        percent: Math.round(completed.length / learningTotals.modernMissions * 100),
        hasActive: Boolean(activeTrack)
    };
}

function evidenceMastery(osState) {
    const completedMissions = osState.missions.filter(mission => mission.completed).length;
    const proofCount = osState.proofs.length;
    const calibratedAttempts = osState.calibration.length;
    return clamp(completedMissions * 8 + proofCount * 12 + calibratedAttempts * 3, 0, 100);
}

export function calculateStreak(sessionDays, todayValue = new Date()) {
    const days = new Set(safeArray(sessionDays).filter(validDay));
    if (days.size === 0) return 0;

    const today = new Date(`${dayKey(todayValue)}T00:00:00.000Z`);
    let cursor = today;
    if (!days.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY_MS);

    let streak = 0;
    while (days.has(dayKey(cursor))) {
        streak += 1;
        cursor = new Date(cursor.getTime() - DAY_MS);
    }
    return streak;
}

export function deriveLearningSnapshot(records, nowValue = new Date()) {
    const source = safeObject(records);
    const today = dayKey(nowValue);
    const javaState = safeObject(source['lbs2:oop-java-migrated']);
    const aiState = safeObject(source['lbs2:ai-fluency']);
    const interviewState = safeObject(source['lbs:interview-plan-v1']);
    const modernState = safeObject(source['lbs2:modern-skills']);
    const osState = normalizeLearningState(source['lbs2:learning-os']);
    const javaSteps = completedJavaSteps(javaState);
    const aiLevels = safeArray(aiState.completedLevels).length;
    const missionDays = osState.missions
        .filter(mission => mission.completed)
        .map(mission => mission.date);

    return {
        today,
        java: {
            completedSteps: javaSteps,
            percent: Math.round(javaSteps / learningTotals.javaSteps * 100),
            dueReviews: dueJavaReviews(javaState, today),
            xp: clamp(safeObject(javaState.game).xp, 0, 100000)
        },
        ai: {
            completedLevels: clamp(aiLevels, 0, learningTotals.aiLevels),
            percent: Math.round(clamp(aiLevels, 0, learningTotals.aiLevels) / learningTotals.aiLevels * 100),
            selectedTrack: typeof aiState.selectedTrack === 'string'
                ? aiState.selectedTrack
                : 'beginner'
        },
        interview: {
            percent: interviewMastery(interviewState),
            hasPlan: Object.keys(safeObject(interviewState.scores)).length > 0
        },
        modern: modernMastery(modernState),
        evidence: {
            percent: evidenceMastery(osState),
            proofCount: osState.proofs.length,
            completedMissions: missionDays.length
        },
        streak: calculateStreak(missionDays, nowValue),
        state: osState
    };
}

export function buildDailyMission(snapshot, preferences = {}) {
    const selected = normalizePreferences(preferences);
    const baseOrder = goalOrder[selected.goal] || goalOrder.build;
    const order = snapshot.modern?.hasActive && snapshot.modern.percent < 100
        ? ['modern', ...baseOrder]
        : baseOrder;
    const focusId = order.find(id => snapshot[id]?.percent < 100) || order[0];
    const baseFocus = focusLibrary[focusId];
    const focus = focusId === 'modern' && snapshot.modern?.activeTrack
        ? {
            ...baseFocus,
            href: `../courses/${snapshot.modern.activeTrack}/`
        }
        : baseFocus;
    const recallMinutes = selected.minutes === 5 ? 1 : selected.minutes === 10 ? 2 : 4;
    const proofMinutes = selected.minutes === 5 ? 1 : selected.minutes === 10 ? 3 : 5;
    const focusMinutes = selected.minutes - recallMinutes - proofMinutes;
    const hasReview = snapshot.java?.dueReviews > 0;

    return {
        id: `${snapshot.today}-${selected.goal}-${selected.minutes}`,
        date: snapshot.today,
        goal: selected.goal,
        minutes: selected.minutes,
        focusId,
        steps: [
            {
                id: 'recall',
                minutes: recallMinutes,
                label: hasReview ? 'Review what is due' : 'Recall before looking',
                title: hasReview
                    ? `${snapshot.java.dueReviews} Java review${snapshot.java.dueReviews === 1 ? '' : 's'} ready`
                    : 'Write what you remember first',
                description: hasReview
                    ? 'Retrieve the answer before revealing it. Grade the memory honestly.'
                    : 'State the key idea from your last session without notes, search, or AI.',
                href: hasReview ? '../learn-v2/index.html' : ''
            },
            {
                id: 'focus',
                minutes: focusMinutes,
                label: focus.label,
                title: focus.title,
                description: focus.description,
                href: focus.href
            },
            {
                id: 'prove',
                minutes: proofMinutes,
                label: 'Close the loop',
                title: 'Explain it without the tool',
                description: 'Give the claim, reasoning, one example, and one limit. Save only the completion proof.',
                href: '#explain-back'
            }
        ]
    };
}

export function weeklyMissionSummary(missions, nowValue = new Date(), target = 3) {
    const today = new Date(`${dayKey(nowValue)}T00:00:00.000Z`);
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    const start = new Date(today.getTime() - mondayOffset * DAY_MS);
    const end = new Date(start.getTime() + 6 * DAY_MS);
    const completed = new Set(
        safeArray(missions)
            .filter(mission => mission?.completed === true && validDay(mission.date))
            .map(mission => mission.date)
            .filter(date => date >= dayKey(start) && date <= dayKey(end))
    ).size;
    const normalizedTarget = clamp(target, 1, 7);
    return {
        completed,
        target: normalizedTarget,
        remaining: Math.max(0, normalizedTarget - completed),
        percent: Math.min(100, Math.round(completed / normalizedTarget * 100)),
        complete: completed >= normalizedTarget,
        start: dayKey(start),
        end: dayKey(end)
    };
}

export function calibrationSummary(attempts) {
    const values = safeArray(attempts)
        .map(item => ({
            confidence: clamp(item?.confidence, 0, 1),
            correct: item?.correct === true ? 1 : 0
        }));
    if (values.length === 0) {
        return {
            attempts: 0,
            accuracy: 0,
            confidence: 0,
            gap: 0,
            brier: 0,
            label: 'Not calibrated yet'
        };
    }

    const accuracy = values.reduce((sum, item) => sum + item.correct, 0) / values.length;
    const confidence = values.reduce((sum, item) => sum + item.confidence, 0) / values.length;
    const brier = values.reduce(
        (sum, item) => sum + ((item.confidence - item.correct) ** 2),
        0
    ) / values.length;

    return {
        attempts: values.length,
        accuracy: Math.round(accuracy * 100),
        confidence: Math.round(confidence * 100),
        gap: Math.round(Math.abs(confidence - accuracy) * 100),
        brier: Number(brier.toFixed(3)),
        label: brier <= 0.12
            ? 'Well calibrated'
            : brier <= 0.25
                ? 'Calibration developing'
                : 'Slow down and verify'
    };
}

export function masteryBands(snapshot) {
    return [
        {
            id: 'modern',
            label: 'Active proof path',
            percent: clamp(snapshot.modern?.percent, 0, 100),
            detail: snapshot.modern?.hasActive
                ? `${snapshot.modern.completedMissions} of ${learningTotals.modernMissions} course missions`
                : 'Choose a modern skills course'
        },
        {
            id: 'java',
            label: 'Code foundations',
            percent: clamp(snapshot.java?.percent, 0, 100),
            detail: `${snapshot.java?.completedSteps || 0} of ${learningTotals.javaSteps} Java steps`
        },
        {
            id: 'ai',
            label: 'AI fluency',
            percent: clamp(snapshot.ai?.percent, 0, 100),
            detail: `${snapshot.ai?.completedLevels || 0} of ${learningTotals.aiLevels} levels practiced`
        },
        {
            id: 'interview',
            label: 'Interview readiness',
            percent: clamp(snapshot.interview?.percent, 0, 100),
            detail: snapshot.interview?.hasPlan ? 'Diagnostic plan active' : 'Diagnostic not taken'
        },
        {
            id: 'evidence',
            label: 'Proof of learning',
            percent: clamp(snapshot.evidence?.percent, 0, 100),
            detail: `${snapshot.evidence?.proofCount || 0} proof artifact${snapshot.evidence?.proofCount === 1 ? '' : 's'}`
        }
    ];
}

export function createProofSummary(snapshot) {
    const bands = masteryBands(snapshot);
    return [
        'LearnByShorts Learning Proof',
        `Generated: ${snapshot.today}`,
        `Focus streak: ${snapshot.streak} day${snapshot.streak === 1 ? '' : 's'}`,
        `Completed daily missions: ${snapshot.evidence.completedMissions}`,
        `Proof artifacts: ${snapshot.evidence.proofCount}`,
        '',
        ...bands.map(band => `${band.label}: ${band.percent}% — ${band.detail}`),
        '',
        'This summary contains completion metadata only. Learner notes and explain-back drafts remain on the device.'
    ].join('\n');
}
