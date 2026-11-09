const TRACK_KEYS = Object.freeze([
  'coding',
  'debugging',
  'systemDesign',
  'aiFluency',
  'communication',
]);

const PHASES = Object.freeze([
  { key: 'learn', label: 'Learn', minutes: 0.2 },
  { key: 'build', label: 'Build', minutes: 0.42 },
  { key: 'ai', label: 'Use AI', minutes: 0.13 },
  { key: 'verify', label: 'Verify alone', minutes: 0.13 },
  { key: 'interview', label: 'Interview drill', minutes: 0.12 },
]);

const ROADMAP_PHASES = Object.freeze([
  { key: 'foundation', label: 'Foundation', through: 0.25, summary: 'Expose gaps and rebuild the core signal.' },
  { key: 'application', label: 'Application', through: 0.65, summary: 'Build realistic proof under constraints.' },
  { key: 'pressure-test', label: 'Pressure test', through: 0.9, summary: 'Verify alone and answer skeptical follow-ups.' },
  { key: 'interview-ready', label: 'Interview ready', through: 1, summary: 'Tighten decisions, stories, and delivery.' },
]);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

function stableNumber(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function itemFor(items, seed) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items[stableNumber(seed) % items.length];
}

function safeSignalCounts(jobSignals) {
  return Object.fromEntries(
    TRACK_KEYS.map((track) => [track, clamp(jobSignals?.[track] ?? 0, 0, 12)]),
  );
}

export function scoreReadiness(skills, roleTracks) {
  let weightedScore = 0;
  let totalWeight = 0;
  for (const track of TRACK_KEYS) {
    const weight = clamp(roleTracks?.[track] ?? 1, 1, 5);
    const value = clamp(skills?.[track] ?? 1, 1, 5);
    weightedScore += weight * value;
    totalWeight += weight * 5;
  }
  return Math.round((weightedScore / totalWeight) * 100);
}

export function rankTracks(skills, roleTracks, jobSignals = {}) {
  const signals = safeSignalCounts(jobSignals);
  return TRACK_KEYS
    .map((track) => {
      const skill = clamp(skills?.[track] ?? 1, 1, 5);
      const importance = clamp(roleTracks?.[track] ?? 1, 1, 5);
      const signalCount = signals[track];
      return {
        track,
        skill,
        importance,
        signalCount,
        gap: importance * (6 - skill) + Math.min(signalCount, 4) * 2,
      };
    })
    .sort((left, right) => right.gap - left.gap || left.track.localeCompare(right.track));
}

export function allocateMinutes(totalMinutes) {
  const safeTotal = Math.round(clamp(totalMinutes, 20, 120));
  const allocation = PHASES.map((phase) => ({
    ...phase,
    allocatedMinutes: Math.max(2, Math.round(safeTotal * phase.minutes)),
  }));
  const difference = safeTotal - allocation.reduce((sum, phase) => sum + phase.allocatedMinutes, 0);
  allocation[1].allocatedMinutes += difference;
  return allocation;
}

export function roadmapPhase(day, durationDays) {
  const progress = clamp(day, 1, durationDays) / Math.max(1, durationDays);
  return ROADMAP_PHASES.find((phase) => progress <= phase.through) || ROADMAP_PHASES.at(-1);
}

export function analyzeJobDescription(text, trackCatalog) {
  const source = String(text || '').slice(0, 12000).toLocaleLowerCase('en-US');
  const emphasis = Object.fromEntries(TRACK_KEYS.map((track) => [track, 0]));
  const tracks = [];

  for (const track of TRACK_KEYS) {
    const terms = Array.isArray(trackCatalog?.[track]?.signals) ? trackCatalog[track].signals : [];
    const matches = terms
      .filter((term) => {
        const normalized = String(term).toLocaleLowerCase('en-US').trim();
        if (!normalized) return false;
        if (normalized.includes(' ') || /[+#.]/.test(normalized)) return source.includes(normalized);
        const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'u').test(source);
      })
      .slice(0, 4);
    emphasis[track] = matches.length;
    if (matches.length > 0) tracks.push({ track, count: matches.length, terms: matches });
  }

  return {
    totalMatches: tracks.reduce((sum, track) => sum + track.count, 0),
    emphasis,
    tracks: tracks.sort((left, right) => right.count - left.count),
  };
}

export function buildDay({
  day,
  durationDays,
  role,
  trackCatalog,
  skills,
  jobSignals,
  minutesPerDay,
}) {
  if (!role?.id || !role?.tracks) throw new Error('A valid role is required');
  const ranked = rankTracks(skills, role.tracks, jobSignals);
  const focus = ranked[(day - 1) % Math.min(3, ranked.length)].track;
  const track = trackCatalog?.[focus];
  if (!track) throw new Error(`Missing track content: ${focus}`);

  const allocation = Object.fromEntries(
    allocateMinutes(minutesPerDay).map((phase) => [phase.key, phase.allocatedMinutes]),
  );
  const phase = roadmapPhase(day, durationDays);
  const seed = `${role.id}:${focus}:${day}`;
  const buildInstruction = itemFor(track.build, `${seed}:build`);
  const aiPrompt = [
    `Act as a skeptical ${role.name} interviewer.`,
    `I am practicing this ${track.label.toLowerCase()} task: ${buildInstruction}`,
    'Do not produce the finished answer.',
    'Ask me three questions about assumptions, offer one materially different approach, and give me one adversarial test I must run.',
  ].join(' ');

  return {
    day,
    focus,
    focusLabel: track.label,
    icon: track.icon,
    title: `${track.label} proof`,
    phaseKey: phase.key,
    phaseLabel: phase.label,
    phaseSummary: phase.summary,
    artifact: track.proof || 'one inspectable artifact you can explain',
    why: ranked.find((item) => item.track === focus)?.signalCount > 0
      ? `The target role and pasted job signals both emphasize ${track.label.toLowerCase()}.`
      : `${track.label} is one of the largest gaps between this role and your self-assessed starting point.`,
    aiPrompt,
    steps: [
      { id: `d${day}-learn`, type: 'learn', label: 'Learn', minutes: allocation.learn, instruction: itemFor(track.learn, `${seed}:learn`) },
      { id: `d${day}-build`, type: 'build', label: 'Build', minutes: allocation.build, instruction: buildInstruction },
      { id: `d${day}-ai`, type: 'ai', label: 'Use AI', minutes: allocation.ai, instruction: 'Use the critique prompt below. Keep the decisions and final implementation yours.' },
      { id: `d${day}-verify`, type: 'verify', label: 'Verify alone', minutes: allocation.verify, instruction: itemFor(track.verify, `${seed}:verify`) },
      { id: `d${day}-interview`, type: 'interview', label: 'Interview drill', minutes: allocation.interview, instruction: itemFor(track.interview, `${seed}:interview`) },
    ],
  };
}

export function groupPlanWeeks(days) {
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    const weekDays = days.slice(index, index + 7);
    const phases = [...new Map(
      weekDays.map((day) => [day.phaseKey, {
        key: day.phaseKey,
        label: day.phaseLabel,
        summary: day.phaseSummary,
      }]),
    ).values()];
    const focusLabels = [...new Set(weekDays.map((day) => day.focusLabel))];
    weeks.push({
      week: weeks.length + 1,
      startDay: weekDays[0].day,
      endDay: weekDays.at(-1).day,
      phaseKey: phases[0].key,
      phaseLabel: phases.map((phase) => phase.label).join(' → '),
      phaseSummary: phases.map((phase) => phase.summary).join(' '),
      focusLabels,
      milestone: `Keep one inspectable artifact for each focus: ${focusLabels.join(', ')}.`,
      dayNumbers: weekDays.map((day) => day.day),
    });
  }
  return weeks;
}

export function buildPlan({
  role,
  trackCatalog,
  skills,
  jobSignals = {},
  durationDays = 30,
  minutesPerDay = 45,
}) {
  const days = Math.round(clamp(durationDays, 7, 90));
  const safeMinutes = Math.round(clamp(minutesPerDay, 20, 120));
  const rankedTracks = rankTracks(skills, role.tracks, jobSignals);
  const planDays = Array.from({ length: days }, (_, index) =>
    buildDay({
      day: index + 1,
      durationDays: days,
      role,
      trackCatalog,
      skills,
      jobSignals,
      minutesPerDay: safeMinutes,
    }),
  );
  return {
    version: 2,
    roleId: role.id,
    roleName: role.name,
    outcome: role.outcome,
    durationDays: days,
    minutesPerDay: safeMinutes,
    startingReadiness: scoreReadiness(skills, role.tracks),
    rankedTracks,
    jobSignalCounts: safeSignalCounts(jobSignals),
    days: planDays,
    weeks: groupPlanWeeks(planDays),
  };
}

export function completionSummary(plan, completedStepIds) {
  const completed = new Set(completedStepIds || []);
  const allSteps = plan.days.flatMap((day) => day.steps);
  const completedSteps = allSteps.filter((step) => completed.has(step.id));
  const completedDays = plan.days.filter((day) => day.steps.every((step) => completed.has(step.id))).length;
  const completedMinutes = completedSteps.reduce((sum, step) => sum + step.minutes, 0);
  return {
    completedSteps: completedSteps.length,
    totalSteps: allSteps.length,
    completedDays,
    totalDays: plan.durationDays,
    completedMinutes,
    completionPercent: allSteps.length ? Math.round((completedSteps.length / allSteps.length) * 100) : 0,
  };
}

export function publicPlanParameters({ roleId, durationDays, minutesPerDay }) {
  const params = new URLSearchParams();
  params.set('role', roleId);
  params.set('days', String(Math.round(clamp(durationDays, 7, 90))));
  params.set('minutes', String(Math.round(clamp(minutesPerDay, 20, 120))));
  return params.toString();
}

export function parsePublicPlanParameters(search, validRoleIds = []) {
  const params = search instanceof URLSearchParams
    ? search
    : new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const validRoles = new Set(validRoleIds);
  const configuration = {};
  const roleId = params.get('role');
  if (roleId && validRoles.has(roleId)) configuration.roleId = roleId;
  const durationDays = params.get('days');
  if (['14', '30', '60'].includes(durationDays)) configuration.durationDays = Number(durationDays);
  const minutesPerDay = params.get('minutes');
  if (minutesPerDay && /^\d{2,3}$/.test(minutesPerDay) && Number(minutesPerDay) >= 20 && Number(minutesPerDay) <= 120) {
    configuration.minutesPerDay = Number(minutesPerDay);
  }
  return Object.keys(configuration).length > 0 ? configuration : null;
}

export { TRACK_KEYS };
