import {
    buildDailyMission,
    calibrationSummary,
    createProofSummary,
    dayKey,
    deriveLearningSnapshot,
    masteryBands,
    normalizeLearningState,
    parseStoredValue,
    weeklyMissionSummary
} from './engine.mjs';

const stateKey = 'lbs2:learning-os';
const draftKey = 'lbs:learning-os-drafts-v1';
const sourceKeys = [
    'lbs2:oop-java-migrated',
    'lbs2:ai-fluency',
    'lbs:interview-plan-v1',
    'lbs2:modern-skills',
    stateKey
];

const questions = [
    {
        id: 'verify-ai-fix',
        prompt: 'An AI-generated fix passes the existing tests. What is the strongest next move?',
        answers: [
            ['merge', 'Merge immediately because the suite is green'],
            ['verify', 'Inspect the diff, add the missing edge case, then rerun focused tests'],
            ['rewrite', 'Ask a second model to rewrite the entire change']
        ],
        correct: 'verify',
        explanation: 'Passing existing tests is evidence, not proof. Inspect the change and test the failure boundary it may have missed.'
    },
    {
        id: 'interview-signal',
        prompt: 'During a coding interview, you are unsure about an input constraint. What creates the best signal?',
        answers: [
            ['assume', 'Silently choose the most convenient constraint'],
            ['reason', 'Clarify the constraint and explain how it changes the design'],
            ['pause', 'Stop until the interviewer gives the full solution']
        ],
        correct: 'reason',
        explanation: 'Clarifying and explaining the tradeoff makes reasoning visible without outsourcing the answer.'
    },
    {
        id: 'source-grounding',
        prompt: 'A model gives a confident current pricing claim with no source. What should happen next?',
        answers: [
            ['trust', 'Use it because confidence implies freshness'],
            ['average', 'Ask several models and average the answers'],
            ['source', 'Check the current official source and record its effective date']
        ],
        correct: 'source',
        explanation: 'Current claims need current evidence. Verify against the primary source and preserve the date.'
    }
];

const explainPrompts = {
    modern: 'Explain the proof mission you practiced: state the decision, evidence, one test or example, and one limitation.',
    java: 'Explain the Java decision you practiced: state the design claim, why it works, one concrete example, and one failure case.',
    ai: 'Explain the AI workflow you practiced: state the boundary, how you verified output, one useful example, and when a human must stop it.',
    interview: 'Explain your interview approach: state the signal, how you make reasoning visible, one example, and one mistake you will avoid.'
};

function readJson(key, fallback = {}) {
    try {
        return parseStoredValue(localStorage.getItem(key), fallback);
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

function records() {
    return Object.fromEntries(sourceKeys.map(key => [key, readJson(key)]));
}

let state = normalizeLearningState(readJson(stateKey));
let snapshot = deriveLearningSnapshot({ ...records(), [stateKey]: state });
let mission = buildDailyMission(snapshot, state.preferences);
let selectedConfidence = 0;
let questionIndex = state.calibration.length % questions.length;
let questionAnswered = false;

const refs = {
    goal: document.querySelector('[data-goal]'),
    minutes: [...document.querySelectorAll('input[name="minutes"]')],
    week: document.querySelector('[data-week]'),
    missionDate: document.querySelector('[data-mission-date]'),
    missionTitle: document.querySelector('[data-mission-title]'),
    missionDuration: document.querySelector('[data-mission-duration]'),
    missionSteps: document.querySelector('[data-mission-steps]'),
    missionMeter: document.querySelector('[data-mission-meter]'),
    missionStatus: document.querySelector('[data-mission-status]'),
    mastery: document.querySelector('[data-mastery]'),
    heroScore: document.querySelector('[data-hero-score]'),
    heroStreak: document.querySelector('[data-hero-streak]'),
    heroReviews: document.querySelector('[data-hero-reviews]'),
    heroProofs: document.querySelector('[data-hero-proofs]'),
    heroNext: document.querySelector('[data-hero-next]'),
    question: document.querySelector('[data-question]'),
    answers: document.querySelector('[data-answers]'),
    confidenceButtons: [...document.querySelectorAll('[data-confidence]')],
    feedback: document.querySelector('[data-question-feedback]'),
    nextQuestion: document.querySelector('[data-next-question]'),
    calibrationLabel: document.querySelector('[data-calibration-label]'),
    calibrationAttempts: document.querySelector('[data-calibration-attempts]'),
    calibrationAccuracy: document.querySelector('[data-calibration-accuracy]'),
    calibrationConfidence: document.querySelector('[data-calibration-confidence]'),
    calibrationGap: document.querySelector('[data-calibration-gap]'),
    explainPrompt: document.querySelector('[data-explain-prompt]'),
    explainDraft: document.querySelector('[data-explain-draft]'),
    wordCount: document.querySelector('[data-word-count]'),
    proofChecks: [...document.querySelectorAll('.explain-card input[type="checkbox"]')],
    saveProof: document.querySelector('[data-save-proof]'),
    proofStatus: document.querySelector('[data-proof-status]'),
    vaultMissions: document.querySelector('[data-vault-missions]'),
    vaultProofs: document.querySelector('[data-vault-proofs]'),
    vaultStreak: document.querySelector('[data-vault-streak]'),
    exportProof: document.querySelector('[data-export-proof]'),
    coachPrompt: document.querySelector('[data-coach-prompt]'),
    copyCoach: document.querySelector('[data-copy-coach]'),
    copyStatus: document.querySelector('[data-copy-status]'),
    weeklyCopy: document.querySelector('[data-weekly-copy]'),
    weeklyCount: document.querySelector('[data-weekly-count]'),
    weeklyMeter: document.querySelector('[data-weekly-meter]'),
    weeklyStatus: document.querySelector('[data-weekly-status]')
};

function currentMissionRecord() {
    return state.missions.find(item => item.date === snapshot.today) || {
        date: snapshot.today,
        completedSteps: [],
        completed: false
    };
}

function statePercent(sourceSnapshot = snapshot) {
    const todayRecord = currentMissionRecord();
    const missionScore = todayRecord.completedSteps.length / 3 * 45;
    const bands = masteryBands(sourceSnapshot);
    const masteryScore = bands.reduce((sum, band) => sum + band.percent, 0) / bands.length * 0.55;
    return Math.round(Math.min(100, missionScore + masteryScore));
}

function saveState() {
    state.updatedAt = new Date().toISOString();
    snapshot = deriveLearningSnapshot({ ...records(), [stateKey]: state });
    state.percent = statePercent(snapshot);
    writeJson(stateKey, state);
    snapshot = deriveLearningSnapshot({ ...records(), [stateKey]: state });
    mission = buildDailyMission(snapshot, state.preferences);
}

function updateMissionRecord(nextRecord) {
    state.missions = [
        ...state.missions.filter(item => item.date !== nextRecord.date),
        nextRecord
    ].slice(-90);
    saveState();
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function renderWeek() {
    refs.week.replaceChildren();
    const today = new Date(`${snapshot.today}T00:00:00.000Z`);
    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setUTCDate(today.getUTCDate() - offset);
        const dateValue = dayKey(date);
        const record = state.missions.find(item => item.date === dateValue);
        const day = element('div', record?.completed ? 'is-complete' : record ? 'is-partial' : '');
        if (dateValue === snapshot.today) day.classList.add('is-today');
        day.setAttribute(
            'aria-label',
            `${date.toLocaleDateString(undefined, { weekday: 'long' })}: ${record?.completed ? 'mission complete' : record ? 'mission in progress' : 'no mission'}`
        );
        day.append(
            element('span', '', date.toLocaleDateString(undefined, { weekday: 'narrow' })),
            element('i', '', record?.completed ? '✓' : record ? '•' : '')
        );
        refs.week.append(day);
    }
}

function renderMission() {
    const record = currentMissionRecord();
    refs.missionDate.textContent = new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    }).format(new Date(`${snapshot.today}T12:00:00`));
    const goalLabels = {
        build: 'build',
        interview: 'interview',
        ai: 'AI',
        foundation: 'foundation'
    };
    refs.missionTitle.textContent = `${mission.minutes}-minute ${goalLabels[mission.goal] || 'focused'} mission`;
    refs.missionDuration.textContent = `${mission.minutes} min`;
    refs.missionSteps.replaceChildren();

    mission.steps.forEach((step, index) => {
        const complete = record.completedSteps.includes(step.id);
        const item = element('li', complete ? 'is-complete' : '');
        const number = element('span', 'mission-number', complete ? '✓' : String(index + 1).padStart(2, '0'));
        const body = element('div', 'mission-step-copy');
        const meta = element('span', 'mission-step-meta', `${step.label} · ${step.minutes} min`);
        const title = element('strong', '', step.title);
        const description = element('p', '', step.description);
        body.append(meta, title, description);

        const actions = element('div', 'mission-step-actions');
        if (step.href) {
            const link = element('a', '', step.id === 'prove' ? 'Open studio' : 'Open practice');
            link.href = step.href;
            actions.append(link);
        }
        const completeButton = element('button', '', complete ? 'Completed' : 'Mark complete');
        completeButton.type = 'button';
        completeButton.dataset.missionStep = step.id;
        completeButton.setAttribute('aria-pressed', String(complete));
        actions.append(completeButton);
        item.append(number, body, actions);
        refs.missionSteps.append(item);
    });

    const percent = Math.round(record.completedSteps.length / mission.steps.length * 100);
    refs.missionMeter.style.width = `${percent}%`;
    refs.missionStatus.textContent = record.completed
        ? 'Mission complete. The learning proof is recorded—come back tomorrow for the next adaptation.'
        : `${record.completedSteps.length} of ${mission.steps.length} thinking steps complete.`;
}

function renderMastery() {
    const bands = masteryBands(snapshot);
    refs.mastery.replaceChildren();
    bands.forEach((band, index) => {
        const item = element('article', `mastery-item mastery-${band.id}`);
        const top = element('div', 'mastery-top');
        const titleWrap = element('div');
        titleWrap.append(
            element('span', '', String(index + 1).padStart(2, '0')),
            element('strong', '', band.label)
        );
        top.append(titleWrap, element('b', '', `${band.percent}%`));
        const meter = element('div', 'mastery-meter');
        const value = element('span');
        value.style.width = `${band.percent}%`;
        meter.append(value);
        item.append(top, meter, element('p', '', band.detail));
        refs.mastery.append(item);
    });

    const average = Math.round(bands.reduce((sum, band) => sum + band.percent, 0) / bands.length);
    refs.heroScore.textContent = String(average);
    refs.heroStreak.textContent = String(snapshot.streak);
    refs.heroReviews.textContent = String(snapshot.java.dueReviews);
    refs.heroProofs.textContent = String(snapshot.evidence.proofCount);
    refs.heroNext.textContent = mission.steps[1].title;
    refs.vaultMissions.textContent = String(snapshot.evidence.completedMissions);
    refs.vaultProofs.textContent = String(snapshot.evidence.proofCount);
    refs.vaultStreak.textContent = String(snapshot.streak);
}

function renderWeeklyChallenge() {
    const weekly = weeklyMissionSummary(state.missions, new Date(`${snapshot.today}T12:00:00Z`));
    refs.weeklyCount.textContent = String(weekly.completed);
    refs.weeklyMeter.style.width = `${weekly.percent}%`;
    refs.weeklyStatus.textContent = weekly.complete
        ? 'Weekly proof sprint complete'
        : `${weekly.remaining} mission${weekly.remaining === 1 ? '' : 's'} remaining`;
    refs.weeklyCopy.textContent = weekly.complete
        ? 'You closed three learning loops. Keep the streak honest: return only when you can retrieve, practice, and prove.'
        : weekly.completed === 0
            ? 'One finished mission today starts the loop.'
            : 'Your next completed mission strengthens the habit without rewarding passive screen time.';
}

function renderCalibrationSummary() {
    const summary = calibrationSummary(state.calibration);
    refs.calibrationLabel.textContent = summary.label;
    refs.calibrationAttempts.textContent = `${summary.attempts} attempt${summary.attempts === 1 ? '' : 's'}`;
    refs.calibrationAccuracy.textContent = `${summary.accuracy}%`;
    refs.calibrationConfidence.textContent = `${summary.confidence}%`;
    refs.calibrationGap.textContent = `${summary.gap}%`;
}

function renderQuestion() {
    const question = questions[questionIndex];
    selectedConfidence = 0;
    questionAnswered = false;
    refs.question.textContent = question.prompt;
    refs.feedback.textContent = 'Commit to confidence first, then choose an answer.';
    refs.feedback.className = 'challenge-feedback';
    refs.nextQuestion.hidden = true;
    refs.confidenceButtons.forEach(button => {
        button.setAttribute('aria-pressed', 'false');
        button.disabled = false;
    });
    refs.answers.replaceChildren();
    question.answers.forEach(([id, label], index) => {
        const button = element('button', '', '');
        button.type = 'button';
        button.dataset.answer = id;
        button.disabled = true;
        button.append(element('span', '', String.fromCharCode(65 + index)), document.createTextNode(label));
        refs.answers.append(button);
    });
}

function coachText() {
    const focus = mission.steps[1];
    return `Act as a questioning tutor for a ${mission.minutes}-minute learning session.

Goal: ${focus.title}

Rules:
1. Ask me to retrieve what I know before explaining.
2. Give one small challenge at a time.
3. Do not reveal the full answer before I attempt.
4. Ask for assumptions, evidence, tests, and one failure case.
5. End by asking me to explain the idea without your help.
6. Do not request private, confidential, or credential data.

Start with one diagnostic question.`;
}

function renderCoach() {
    refs.coachPrompt.textContent = coachText();
    refs.explainPrompt.textContent = explainPrompts[mission.focusId] || explainPrompts.java;
}

function renderDraft() {
    const draft = readJson(draftKey);
    if (draft.promptId === mission.focusId && typeof draft.text === 'string') {
        refs.explainDraft.value = draft.text.slice(0, 4000);
    }
    updateWordCount();
}

function updateWordCount() {
    const count = refs.explainDraft.value.trim()
        ? refs.explainDraft.value.trim().split(/\s+/).length
        : 0;
    refs.wordCount.textContent = `${count} word${count === 1 ? '' : 's'}`;
    return count;
}

function renderAll() {
    refs.goal.value = state.preferences.goal;
    refs.minutes.forEach(input => {
        input.checked = Number(input.value) === state.preferences.minutes;
    });
    renderWeek();
    renderMission();
    renderMastery();
    renderWeeklyChallenge();
    renderCalibrationSummary();
    renderCoach();
}

refs.goal.addEventListener('change', () => {
    state.preferences.goal = refs.goal.value;
    saveState();
    renderAll();
    window.Analytics?.trackLearningOsMission?.(state.preferences.goal, state.preferences.minutes);
});

refs.minutes.forEach(input => {
    input.addEventListener('change', () => {
        if (!input.checked) return;
        state.preferences.minutes = Number(input.value);
        saveState();
        renderAll();
        window.Analytics?.trackLearningOsMission?.(state.preferences.goal, state.preferences.minutes);
    });
});

refs.missionSteps.addEventListener('click', event => {
    const button = event.target.closest('[data-mission-step]');
    if (!button) return;
    const stepId = button.dataset.missionStep;
    const record = currentMissionRecord();
    const completedSteps = record.completedSteps.includes(stepId)
        ? record.completedSteps.filter(id => id !== stepId)
        : [...record.completedSteps, stepId];
    const completed = completedSteps.length === mission.steps.length;
    updateMissionRecord({ ...record, completedSteps, completed });

    if (completed) {
        const proofId = `mission-${snapshot.today}`;
        if (!state.proofs.some(proof => proof.id === proofId)) {
            state.proofs.push({
                id: proofId,
                type: 'daily-mission',
                date: snapshot.today,
                score: 3
            });
            saveState();
        }
    }
    renderAll();
    window.Analytics?.trackLearningOsStep?.(stepId, completedSteps.length, completed);
    if (completed) {
        const weekly = weeklyMissionSummary(state.missions, new Date(`${snapshot.today}T12:00:00Z`));
        window.Analytics?.trackWeeklyChallenge?.(
            state.preferences.goal,
            weekly.completed,
            weekly.complete ? 'complete' : 'in_progress'
        );
    }
});

refs.confidenceButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (questionAnswered) return;
        selectedConfidence = Number(button.dataset.confidence);
        refs.confidenceButtons.forEach(candidate => {
            candidate.setAttribute('aria-pressed', String(candidate === button));
        });
        [...refs.answers.querySelectorAll('button')].forEach(answer => {
            answer.disabled = false;
        });
        refs.feedback.textContent = 'Confidence committed. Now choose the strongest answer.';
    });
});

refs.answers.addEventListener('click', event => {
    const button = event.target.closest('[data-answer]');
    if (!button || questionAnswered || !selectedConfidence) return;
    questionAnswered = true;
    const question = questions[questionIndex];
    const correct = button.dataset.answer === question.correct;
    [...refs.answers.querySelectorAll('button')].forEach(answer => {
        answer.disabled = true;
        answer.classList.toggle('is-correct', answer.dataset.answer === question.correct);
        if (answer === button && !correct) answer.classList.add('is-wrong');
    });
    refs.confidenceButtons.forEach(candidate => {
        candidate.disabled = true;
    });
    refs.feedback.textContent = `${correct ? 'Correct.' : 'Not yet.'} ${question.explanation}`;
    refs.feedback.classList.add(correct ? 'is-success' : 'is-warning');
    refs.nextQuestion.hidden = false;

    state.calibration.push({
        questionId: question.id,
        confidence: selectedConfidence,
        correct,
        date: snapshot.today
    });
    state.calibration = state.calibration.slice(-100);
    saveState();
    renderCalibrationSummary();
    renderMastery();
    window.Analytics?.trackLearningOsCalibration?.(
        question.id,
        selectedConfidence,
        correct
    );
});

refs.nextQuestion.addEventListener('click', () => {
    questionIndex = (questionIndex + 1) % questions.length;
    renderQuestion();
});

refs.explainDraft.addEventListener('input', () => {
    updateWordCount();
    writeJson(draftKey, {
        promptId: mission.focusId,
        text: refs.explainDraft.value.slice(0, 4000)
    });
});

refs.saveProof.addEventListener('click', () => {
    const words = updateWordCount();
    const score = refs.proofChecks.filter(input => input.checked).length;
    if (words < 35 || score < 3) {
        refs.proofStatus.textContent =
            `Keep going: ${Math.max(0, 35 - words)} more words and ${Math.max(0, 3 - score)} more evidence check${3 - score === 1 ? '' : 's'} needed.`;
        refs.proofStatus.className = 'proof-status is-warning';
        return;
    }

    const proofId = `explain-${snapshot.today}-${mission.focusId}`;
    const existing = state.proofs.find(proof => proof.id === proofId);
    if (existing) {
        existing.score = score;
    } else {
        state.proofs.push({
            id: proofId,
            type: 'explain-back',
            date: snapshot.today,
            score
        });
    }
    saveState();
    renderMastery();
    refs.proofStatus.textContent =
        'Completion proof saved. Your explanation remains only in this browser and is not included in cloud sync.';
    refs.proofStatus.className = 'proof-status is-success';
    window.Analytics?.trackLearningOsProof?.(mission.focusId, score);
});

refs.exportProof.addEventListener('click', () => {
    const content = createProofSummary(snapshot);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `learnbyshorts-learning-proof-${snapshot.today}.txt`;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    window.Analytics?.trackLearningOsExport?.(snapshot.evidence.proofCount);
});

refs.copyCoach.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(coachText());
        refs.copyStatus.textContent = 'Copied. Paste it into the AI tool you choose.';
    } catch {
        refs.copyStatus.textContent = 'Copy was blocked. Select the prompt text manually.';
    }
});

renderAll();
renderQuestion();
renderDraft();
window.Analytics?.trackLearningOsMission?.(
    state.preferences.goal,
    state.preferences.minutes
);
