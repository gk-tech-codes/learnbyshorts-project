import assert from 'node:assert/strict';
import {
    buildDailyMission,
    calculateStreak,
    calibrationSummary,
    createProofSummary,
    deriveLearningSnapshot,
    masteryBands,
    normalizeLearningState,
    parseStoredValue,
    weeklyMissionSummary
} from '../frontend/learning-os/engine.mjs';

const now = new Date('2026-11-07T12:00:00.000Z');
const records = {
    'lbs2:oop-java-migrated': {
        completed: ['one', 'two', 'three'],
        position: 4,
        game: { xp: 55 },
        reviews: {
            objects: { due: '2026-11-07' },
            constructors: { due: '2026-11-09' }
        }
    },
    'lbs2:ai-fluency': {
        completedLevels: ['one', 'two'],
        selectedTrack: 'developer'
    },
    'lbs:interview-plan-v1': {
        scores: {
            coding: 1,
            debugging: 1,
            systems: 0,
            behavioral: 2,
            project: 1,
            ai: 2
        }
    },
    'lbs2:modern-skills': {
        activeTrack: 'ai-evals-reliability',
        completed: {
            'ai-evals-reliability': ['eval-contract', 'eval-dataset']
        }
    },
    'lbs2:learning-os': {
        preferences: { goal: 'build', minutes: 10 },
        missions: [
            { date: '2026-11-05', completedSteps: ['recall', 'focus', 'prove'], completed: true },
            { date: '2026-11-06', completedSteps: ['recall', 'focus', 'prove'], completed: true },
            { date: '2026-11-07', completedSteps: ['recall'], completed: false }
        ],
        calibration: [
            { questionId: 'verify-1', confidence: 0.9, correct: true, date: '2026-11-07' }
        ],
        proofs: [
            { id: 'proof-1', type: 'explain-back', date: '2026-11-06', score: 4 }
        ]
    }
};

assert.deepEqual(parseStoredValue('{broken'), {});
assert.equal(calculateStreak(['2026-11-05', '2026-11-06'], now), 2);
assert.equal(calculateStreak(['2026-11-05', '2026-11-06', '2026-11-07'], now), 3);

const normalized = normalizeLearningState({
    preferences: { goal: 'unknown', minutes: 900 },
    missions: [{ date: 'bad', completedSteps: ['danger'] }],
    calibration: [{ questionId: '../bad', confidence: 10, correct: 'yes' }],
    proofs: [{ id: '<script>', type: 'x' }]
});
assert.deepEqual(normalized.preferences, { goal: 'build', minutes: 10 });
assert.equal(normalized.missions.length, 0);
assert.equal(normalized.calibration.length, 0);
assert.equal(normalized.proofs.length, 0);

const snapshot = deriveLearningSnapshot(records, now);
assert.equal(snapshot.today, '2026-11-07');
assert.equal(snapshot.java.completedSteps, 4);
assert.equal(snapshot.java.dueReviews, 1);
assert.equal(snapshot.ai.completedLevels, 2);
assert.equal(snapshot.interview.hasPlan, true);
assert.equal(snapshot.modern.activeTrack, 'ai-evals-reliability');
assert.equal(snapshot.modern.percent, 50);
assert.equal(snapshot.streak, 2);
assert.equal(snapshot.evidence.proofCount, 1);

const mission = buildDailyMission(snapshot, { goal: 'build', minutes: 10 });
assert.equal(mission.steps.length, 3);
assert.equal(mission.steps.reduce((sum, step) => sum + step.minutes, 0), 10);
assert.equal(mission.steps[0].id, 'recall');
assert.equal(mission.steps[0].title, '1 Java review ready');
assert.equal(mission.steps[1].id, 'focus');
assert.match(mission.steps[1].href, /courses\/ai-evals-reliability/);
assert.equal(mission.steps[2].id, 'prove');

const calibration = calibrationSummary([
    { confidence: 0.9, correct: true },
    { confidence: 0.9, correct: false }
]);
assert.equal(calibration.attempts, 2);
assert.equal(calibration.accuracy, 50);
assert.equal(calibration.confidence, 90);
assert.equal(calibration.gap, 40);

const bands = masteryBands(snapshot);
assert.equal(bands.length, 5);
assert.ok(bands.every(band => band.percent >= 0 && band.percent <= 100));

const proof = createProofSummary(snapshot);
assert.match(proof, /completion metadata only/i);
assert.doesNotMatch(proof, /private learner note/i);

const weekly = weeklyMissionSummary(records['lbs2:learning-os'].missions, now);
assert.equal(weekly.completed, 2);
assert.equal(weekly.remaining, 1);
assert.equal(weekly.percent, 67);

console.log('Learning OS QA passed: state normalization, adaptive mission, streak, calibration, mastery, and proof export.');
