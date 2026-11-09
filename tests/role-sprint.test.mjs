import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  allocateMinutes,
  analyzeJobDescription,
  buildPlan,
  completionSummary,
  groupPlanWeeks,
  parsePublicPlanParameters,
  publicPlanParameters,
  rankTracks,
  roadmapPhase,
  scoreReadiness,
} from '../frontend/js/role-sprint-core.mjs';

const role = {
  id: 'test-role',
  name: 'Test Role',
  outcome: 'Test outcome',
  tracks: {
    coding: 5,
    debugging: 4,
    systemDesign: 5,
    aiFluency: 3,
    communication: 4,
  },
};

const content = {
  coding: fixtureTrack('Coding'),
  debugging: fixtureTrack('Debugging'),
  systemDesign: fixtureTrack('System design'),
  aiFluency: fixtureTrack('AI collaboration'),
  communication: fixtureTrack('Communication'),
};

function fixtureTrack(label) {
  return {
    label,
    icon: '✓',
    proof: `One ${label} artifact`,
    signals: [label.toLowerCase(), `${label.toLowerCase()} signal`],
    learn: [`Learn ${label}`],
    build: [`Build ${label}`],
    verify: [`Verify ${label}`],
    interview: [`Interview ${label}`],
  };
}

test('readiness is weighted and bounded', () => {
  assert.equal(
    scoreReadiness(
      {
        coding: 5,
        debugging: 5,
        systemDesign: 5,
        aiFluency: 5,
        communication: 5,
      },
      role.tracks,
    ),
    100,
  );
  assert.equal(
    scoreReadiness(
      {
        coding: 0,
        debugging: 0,
        systemDesign: 0,
        aiFluency: 0,
        communication: 0,
      },
      role.tracks,
    ),
    20,
  );
});

test('weak important tracks are ranked first', () => {
  const ranked = rankTracks(
    {
      coding: 4,
      debugging: 4,
      systemDesign: 1,
      aiFluency: 5,
      communication: 4,
    },
    role.tracks,
  );
  assert.equal(ranked[0].track, 'systemDesign');
});

test('daily time allocation preserves the requested total', () => {
  for (const minutes of [20, 45, 90, 120]) {
    const allocated = allocateMinutes(minutes);
    assert.equal(
      allocated.reduce((sum, phase) => sum + phase.allocatedMinutes, 0),
      minutes,
    );
    assert.ok(allocated.every((phase) => phase.allocatedMinutes >= 2));
  }
});

test('plan generation is deterministic and complete', () => {
  const input = {
    role,
    trackCatalog: content,
    skills: {
      coding: 3,
      debugging: 2,
      systemDesign: 2,
      aiFluency: 3,
      communication: 4,
    },
    durationDays: 30,
    minutesPerDay: 45,
  };
  const first = buildPlan(input);
  const second = buildPlan(input);
  assert.deepEqual(first, second);
  assert.equal(first.days.length, 30);
  assert.equal(first.version, 2);
  assert.equal(first.weeks.length, 5);
  assert.ok(first.days.every((day) => day.steps.length === 5));
  assert.ok(
    first.days.every(
      (day) => day.steps.reduce((sum, step) => sum + step.minutes, 0) === 45,
    ),
  );
});

test('job text is reduced to bounded skill signals without returning raw text', () => {
  const analysis = analyzeJobDescription(
    'We need system design, debugging, observability, and strong communication.',
    content,
  );
  assert.ok(analysis.totalMatches >= 3);
  assert.ok(analysis.emphasis.debugging > 0);
  assert.ok(analysis.emphasis.systemDesign > 0);
  assert.ok(analysis.emphasis.communication > 0);
  assert.equal('text' in analysis, false);
  assert.doesNotMatch(JSON.stringify(analysis), /We need/);
});

test('job signals can raise a matching track priority', () => {
  const baseline = {
    coding: 3,
    debugging: 3,
    systemDesign: 3,
    aiFluency: 3,
    communication: 3,
  };
  const ranked = rankTracks(baseline, role.tracks, { aiFluency: 4 });
  assert.equal(ranked[0].track, 'aiFluency');
  assert.equal(ranked[0].signalCount, 4);
});

test('roadmap covers all phases and groups every day once', () => {
  assert.equal(roadmapPhase(1, 30).key, 'foundation');
  assert.equal(roadmapPhase(12, 30).key, 'application');
  assert.equal(roadmapPhase(25, 30).key, 'pressure-test');
  assert.equal(roadmapPhase(30, 30).key, 'interview-ready');
  const days = Array.from({ length: 14 }, (_, index) => ({
    day: index + 1,
    focusLabel: 'Coding',
    artifact: 'One tested implementation',
    phaseKey: roadmapPhase(index + 1, 14).key,
    phaseLabel: roadmapPhase(index + 1, 14).label,
    phaseSummary: roadmapPhase(index + 1, 14).summary,
  }));
  const weeks = groupPlanWeeks(days);
  assert.equal(weeks.length, 2);
  assert.deepEqual(weeks.flatMap((week) => week.dayNumbers), days.map((day) => day.day));
  assert.match(weeks[0].phaseLabel, /Foundation/);
  assert.match(weeks[0].milestone, /Coding/);
});

test('completion summary counts full days and minutes', () => {
  const plan = buildPlan({
    role,
    trackCatalog: content,
    skills: {
      coding: 3,
      debugging: 3,
      systemDesign: 3,
      aiFluency: 3,
      communication: 3,
    },
    durationDays: 14,
    minutesPerDay: 40,
  });
  const firstDayIds = plan.days[0].steps.map((step) => step.id);
  const summary = completionSummary(plan, firstDayIds);
  assert.equal(summary.completedDays, 1);
  assert.equal(summary.completedMinutes, 40);
  assert.equal(summary.completedSteps, 5);
  assert.equal(summary.totalSteps, 70);
});

test('share parameters contain configuration but no progress or scores', () => {
  const query = publicPlanParameters({
    roleId: 'ai-engineer',
    durationDays: 30,
    minutesPerDay: 45,
  });
  assert.equal(query, 'role=ai-engineer&days=30&minutes=45');
  assert.doesNotMatch(query, /score|completed|email|code/i);
});

test('shared plan parameters are validated before overriding local defaults', () => {
  assert.deepEqual(
    parsePublicPlanParameters(
      '?role=ai-engineer&days=14&minutes=30&utm_source=share',
      ['ai-engineer', 'backend-engineer'],
    ),
    {
      roleId: 'ai-engineer',
      durationDays: 14,
      minutesPerDay: 30,
    },
  );
  assert.deepEqual(
    parsePublicPlanParameters(
      '?role=unknown&days=60&minutes=999',
      ['ai-engineer'],
    ),
    { durationDays: 60 },
  );
  assert.equal(
    parsePublicPlanParameters(
      '?role=unknown&days=365&minutes=0&utm_source=share',
      ['ai-engineer'],
    ),
    null,
  );
});

test('mobile layout constrains grid cards and the hidden duration control', () => {
  const css = readFileSync(
    new URL('../frontend/css/role-sprint.css', import.meta.url),
    'utf8',
  );
  assert.match(css, /\.sprint-card\s*\{[^}]*min-width:\s*0;/s);
  assert.match(
    css,
    /\.field select\.visually-hidden\s*\{[^}]*width:\s*1px;/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*820px\)[\s\S]*?\.sprint-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/,
  );
});

test('RoleSprint does not present incomplete proof sprints as full course recommendations', () => {
  const html = readFileSync(
    new URL('../frontend/role-sprint.html', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(html, /course-recommendations|Recommended courses/i);
  assert.match(html, /complete practice schedule/i);
  assert.match(html, /not a claim that a few cards teach an entire technical field/i);
});
