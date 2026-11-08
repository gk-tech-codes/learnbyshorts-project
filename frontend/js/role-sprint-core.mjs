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

export function rankTracks(skills, roleTracks) {
  return TRACK_KEYS
    .map((track) => {
      const skill = clamp(skills?.[track] ?? 1, 1, 5);
      const importance = clamp(roleTracks?.[track] ?? 1, 1, 5);
      return {
        track,
        skill,
        importance,
        gap: importance * (6 - skill),
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

export function buildDay({
  day,
  role,
  trackCatalog,
  skills,
  minutesPerDay,
}) {
  if (!role?.id || !role?.tracks) throw new Error('A valid role is required');
  const ranked = rankTracks(skills, role.tracks);
  const focus = ranked[(day - 1) % Math.min(3, ranked.length)].track;
  const track = trackCatalog?.[focus];
  if (!track) throw new Error(`Missing track content: ${focus}`);

  const allocation = Object.fromEntries(
    allocateMinutes(minutesPerDay).map((phase) => [phase.key, phase.allocatedMinutes]),
  );

  const seed = `${role.id}:${focus}:${day}`;
  return {
    day,
    focus,
    focusLabel: track.label,
    icon: track.icon,
    title: `Day ${day}: ${track.label}`,
    steps: [
      {
        id: `d${day}-learn`,
        type: 'learn',
        label: 'Learn',
        minutes: allocation.learn,
        instruction: itemFor(track.learn, `${seed}:learn`),
      },
      {
        id: `d${day}-build`,
        type: 'build',
        label: 'Build',
        minutes: allocation.build,
        instruction: itemFor(track.build, `${seed}:build`),
      },
      {
        id: `d${day}-ai`,
        type: 'ai',
        label: 'Use AI',
        minutes: allocation.ai,
        instruction: `Ask an AI assistant to critique your approach. Require it to identify assumptions, propose a different approach, and give you a test—not a final answer.`,
      },
      {
        id: `d${day}-verify`,
        type: 'verify',
        label: 'Verify alone',
        minutes: allocation.verify,
        instruction: itemFor(track.verify, `${seed}:verify`),
      },
      {
        id: `d${day}-interview`,
        type: 'interview',
        label: 'Interview drill',
        minutes: allocation.interview,
        instruction: itemFor(track.interview, `${seed}:interview`),
      },
    ],
  };
}

export function buildPlan({
  role,
  trackCatalog,
  skills,
  durationDays = 30,
  minutesPerDay = 45,
}) {
  const days = Math.round(clamp(durationDays, 7, 90));
  return {
    version: 1,
    roleId: role.id,
    roleName: role.name,
    outcome: role.outcome,
    durationDays: days,
    minutesPerDay: Math.round(clamp(minutesPerDay, 20, 120)),
    startingReadiness: scoreReadiness(skills, role.tracks),
    rankedTracks: rankTracks(skills, role.tracks),
    days: Array.from({ length: days }, (_, index) =>
      buildDay({
        day: index + 1,
        role,
        trackCatalog,
        skills,
        minutesPerDay,
      }),
    ),
  };
}

export function completionSummary(plan, completedStepIds) {
  const completed = new Set(completedStepIds || []);
  const allSteps = plan.days.flatMap((day) => day.steps);
  const completedSteps = allSteps.filter((step) => completed.has(step.id));
  const completedDays = plan.days.filter((day) =>
    day.steps.every((step) => completed.has(step.id)),
  ).length;
  const completedMinutes = completedSteps.reduce((sum, step) => sum + step.minutes, 0);
  return {
    completedSteps: completedSteps.length,
    totalSteps: allSteps.length,
    completedDays,
    totalDays: plan.durationDays,
    completedMinutes,
    completionPercent: allSteps.length
      ? Math.round((completedSteps.length / allSteps.length) * 100)
      : 0,
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
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const validRoles = new Set(validRoleIds);
  const configuration = {};

  const roleId = params.get('role');
  if (roleId && validRoles.has(roleId)) configuration.roleId = roleId;

  const durationDays = params.get('days');
  if (['14', '30', '60'].includes(durationDays)) {
    configuration.durationDays = Number(durationDays);
  }

  const minutesPerDay = params.get('minutes');
  if (
    minutesPerDay &&
    /^\d{2,3}$/.test(minutesPerDay) &&
    Number(minutesPerDay) >= 20 &&
    Number(minutesPerDay) <= 120
  ) {
    configuration.minutesPerDay = Number(minutesPerDay);
  }

  return Object.keys(configuration).length > 0 ? configuration : null;
}

export { TRACK_KEYS };
