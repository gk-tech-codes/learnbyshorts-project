import {
  TRACK_KEYS,
  buildPlan,
  completionSummary,
  publicPlanParameters,
} from './role-sprint-core.mjs';

const STORAGE_KEY = 'learnbyshorts:role-sprint:v1';
const CONSENT_KEY = 'learnbyshorts:analytics-consent:v1';
const MEASUREMENT_ID = 'G-5413RZXDET';
const ANALYTICS_FIELDS = Object.freeze({
  rolesprint_day_opened: ['role_id', 'day_number', 'focus_track'],
  rolesprint_step_completed: ['role_id', 'day_number', 'step_type', 'minutes'],
  rolesprint_plan_created: [
    'role_id',
    'duration_days',
    'minutes_per_day',
    'readiness_band',
    'priority_track',
  ],
  rolesprint_progress_exported: ['role_id', 'completed_days', 'completion_percent'],
  rolesprint_plan_shared: ['role_id', 'duration_days'],
});

const state = {
  catalog: null,
  plan: null,
  completed: new Set(),
  activeDay: 1,
};

const elements = {
  builder: document.querySelector('#sprint-builder'),
  role: document.querySelector('#target-role'),
  duration: document.querySelector('#duration-days'),
  minutes: document.querySelector('#minutes-per-day'),
  minutesOutput: document.querySelector('#minutes-output'),
  plan: document.querySelector('#sprint-plan'),
  empty: document.querySelector('#plan-empty'),
  title: document.querySelector('#plan-title'),
  outcome: document.querySelector('#plan-outcome'),
  readiness: document.querySelector('#readiness-score'),
  progress: document.querySelector('#progress-value'),
  progressText: document.querySelector('#progress-text'),
  focus: document.querySelector('#focus-tracks'),
  dayList: document.querySelector('#day-list'),
  mission: document.querySelector('#mission'),
  reset: document.querySelector('#reset-plan'),
  exportButton: document.querySelector('#export-progress'),
  shareButton: document.querySelector('#share-plan'),
  status: document.querySelector('#sprint-status'),
  consent: document.querySelector('#analytics-consent'),
  acceptAnalytics: document.querySelector('#accept-analytics'),
  declineAnalytics: document.querySelector('#decline-analytics'),
};

function analyticsAllowed() {
  return (
    !privacySignalActive() &&
    localStorage.getItem(CONSENT_KEY) === 'granted'
  );
}

function privacySignalActive() {
  return (
    navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1'
  );
}

function initializeAnalytics() {
  if (!analyticsAllowed()) return false;
  if (!window.dataLayer) window.dataLayer = [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
  if (!document.querySelector(`script[data-measurement-id="${MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.measurementId = MEASUREMENT_ID;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.append(script);
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: true,
      page_location: `${window.location.origin}${window.location.pathname}`,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  }
  return true;
}

function track(name, parameters = {}) {
  const allowedFields = ANALYTICS_FIELDS[name];
  if (!allowedFields || !initializeAnalytics()) return;
  const safeParameters = {};
  for (const key of allowedFields) {
    const value = parameters[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safeParameters[key] = typeof value === 'string' ? value.slice(0, 64) : value;
    }
  }
  window.gtag('event', name, safeParameters);
}

function setStatus(message) {
  elements.status.textContent = message;
}

function skillValues() {
  return Object.fromEntries(
    TRACK_KEYS.map((track) => [
      track,
      Number(document.querySelector(`[name="${track}"]`).value),
    ]),
  );
}

function selectedRole() {
  return state.catalog.roles.find((role) => role.id === elements.role.value);
}

function persist() {
  if (!state.plan) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      plan: state.plan,
      completed: [...state.completed],
      activeDay: state.activeDay,
      savedAt: new Date().toISOString(),
    }),
  );
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved?.plan?.days || saved.plan.version !== 1) return false;
    state.plan = saved.plan;
    state.completed = new Set(saved.completed || []);
    state.activeDay = Math.max(1, Math.min(saved.activeDay || 1, saved.plan.durationDays));
    return true;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function renderFocusTracks() {
  elements.focus.replaceChildren();
  state.plan.rankedTracks.slice(0, 3).forEach((item, index) => {
    const track = state.catalog.tracks[item.track];
    const chip = createTextElement(
      'span',
      'focus-chip',
      `${index + 1}. ${track.icon} ${track.label}`,
    );
    elements.focus.append(chip);
  });
}

function renderDayList() {
  elements.dayList.replaceChildren();
  state.plan.days.forEach((day) => {
    const complete = day.steps.every((step) => state.completed.has(step.id));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day-button';
    button.classList.toggle('is-active', day.day === state.activeDay);
    button.classList.toggle('is-complete', complete);
    button.setAttribute('aria-current', day.day === state.activeDay ? 'step' : 'false');
    button.dataset.day = String(day.day);
    button.append(
      createTextElement('span', 'day-number', complete ? '✓' : String(day.day)),
      createTextElement('span', 'day-focus', day.focusLabel),
    );
    button.addEventListener('click', () => {
      state.activeDay = day.day;
      persist();
      render();
      track('rolesprint_day_opened', {
        role_id: state.plan.roleId,
        day_number: day.day,
        focus_track: day.focus,
      });
    });
    elements.dayList.append(button);
  });
}

function renderMission() {
  elements.mission.replaceChildren();
  const day = state.plan.days[state.activeDay - 1];
  const heading = document.createElement('div');
  heading.className = 'mission-heading';
  heading.append(
    createTextElement('span', 'mission-icon', day.icon),
    createTextElement('h3', '', day.title),
    createTextElement('p', '', `${state.plan.minutesPerDay} focused minutes`),
  );
  elements.mission.append(heading);

  day.steps.forEach((step) => {
    const item = document.createElement('label');
    item.className = 'mission-step';
    item.classList.toggle('is-complete', state.completed.has(step.id));

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = state.completed.has(step.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        state.completed.add(step.id);
        track('rolesprint_step_completed', {
          role_id: state.plan.roleId,
          day_number: day.day,
          step_type: step.type,
          minutes: step.minutes,
        });
      } else {
        state.completed.delete(step.id);
      }
      persist();
      render();
    });

    const copy = document.createElement('span');
    copy.className = 'step-copy';
    copy.append(
      createTextElement('span', 'step-label', `${step.label} · ${step.minutes} min`),
      createTextElement('span', 'step-instruction', step.instruction),
    );
    item.append(checkbox, copy);
    elements.mission.append(item);
  });

  const disclosure = createTextElement(
    'p',
    'practice-disclosure',
    'This is a learner-owned practice log, not a certification or independently verified credential.',
  );
  elements.mission.append(disclosure);
}

function renderProgress() {
  const summary = completionSummary(state.plan, state.completed);
  elements.progress.style.width = `${summary.completionPercent}%`;
  elements.progress.parentElement.setAttribute('aria-valuenow', String(summary.completionPercent));
  elements.progressText.textContent =
    `${summary.completedDays}/${summary.totalDays} days · ` +
    `${summary.completedMinutes} focused minutes · ${summary.completionPercent}%`;
}

function render() {
  if (!state.plan) {
    elements.plan.hidden = true;
    elements.empty.hidden = false;
    return;
  }
  elements.empty.hidden = true;
  elements.plan.hidden = false;
  elements.title.textContent = `${state.plan.durationDays}-day ${state.plan.roleName} sprint`;
  elements.outcome.textContent = state.plan.outcome;
  elements.readiness.textContent = `${state.plan.startingReadiness}%`;
  renderFocusTracks();
  renderProgress();
  renderDayList();
  renderMission();
}

function applyQueryDefaults() {
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role');
  const days = params.get('days');
  const minutes = params.get('minutes');
  if (state.catalog.roles.some((item) => item.id === role)) elements.role.value = role;
  if (['14', '30', '60'].includes(days)) {
    const durationChoice = document.querySelector(`[name="duration"][value="${days}"]`);
    if (durationChoice) durationChoice.checked = true;
    elements.duration.value = days;
  }
  if (minutes && Number(minutes) >= 20 && Number(minutes) <= 120) {
    elements.minutes.value = String(Number(minutes));
  }
  elements.minutesOutput.textContent = `${elements.minutes.value} minutes`;
}

function createPlan(event) {
  event.preventDefault();
  const role = selectedRole();
  const skills = skillValues();
  state.plan = buildPlan({
    role,
    trackCatalog: state.catalog.tracks,
    skills,
    durationDays: Number(document.querySelector('[name="duration"]:checked').value),
    minutesPerDay: Number(elements.minutes.value),
  });
  state.completed = new Set();
  state.activeDay = 1;
  persist();
  render();
  elements.plan.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus('Your private plan is ready and saved only in this browser.');
  track('rolesprint_plan_created', {
    role_id: role.id,
    duration_days: state.plan.durationDays,
    minutes_per_day: state.plan.minutesPerDay,
    readiness_band: Math.floor(state.plan.startingReadiness / 20) * 20,
    priority_track: state.plan.rankedTracks[0].track,
  });
}

function resetPlan() {
  state.plan = null;
  state.completed = new Set();
  state.activeDay = 1;
  persist();
  render();
  setStatus('Plan removed from this browser.');
}

function exportProgress() {
  if (!state.plan) return;
  const summary = completionSummary(state.plan, state.completed);
  const payload = {
    schema: 'learnbyshorts-practice-log-v1',
    exportedAt: new Date().toISOString(),
    plan: {
      roleId: state.plan.roleId,
      roleName: state.plan.roleName,
      durationDays: state.plan.durationDays,
      minutesPerDay: state.plan.minutesPerDay,
      startingReadiness: state.plan.startingReadiness,
    },
    progress: summary,
    completedStepIds: [...state.completed].sort(),
    disclosure: 'Learner-owned practice log; not an independently verified credential.',
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `learnbyshorts-${state.plan.roleId}-practice-log.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus('Practice log exported. It contains no notes, code, email, or account data.');
  track('rolesprint_progress_exported', {
    role_id: state.plan.roleId,
    completed_days: summary.completedDays,
    completion_percent: summary.completionPercent,
  });
}

async function sharePlan() {
  if (!state.plan) return;
  const query = publicPlanParameters({
    roleId: state.plan.roleId,
    durationDays: state.plan.durationDays,
    minutesPerDay: state.plan.minutesPerDay,
  });
  const url = `${window.location.origin}${window.location.pathname}?${query}`;
  try {
    await navigator.clipboard.writeText(url);
    setStatus('A public plan link was copied. It contains no scores or progress.');
  } catch {
    setStatus(`Copy this public plan link: ${url}`);
  }
  track('rolesprint_plan_shared', {
    role_id: state.plan.roleId,
    duration_days: state.plan.durationDays,
  });
}

function setupConsent() {
  const saved = localStorage.getItem(CONSENT_KEY);
  if (privacySignalActive()) {
    localStorage.setItem(CONSENT_KEY, 'denied');
    elements.consent.hidden = true;
  } else {
    elements.consent.hidden = saved === 'granted' || saved === 'denied';
    if (saved === 'granted') initializeAnalytics();
  }
  elements.acceptAnalytics.addEventListener('click', () => {
    const granted = !privacySignalActive();
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
    if (granted) initializeAnalytics();
    elements.consent.hidden = true;
    setStatus(
      granted
        ? 'Product analytics enabled. No code, answers, scores, or identity fields are sent.'
        : 'Analytics remains disabled because your browser requested no tracking.',
    );
  });
  elements.declineAnalytics.addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    elements.consent.hidden = true;
    setStatus('Analytics remains disabled.');
  });
}

async function init() {
  const response = await fetch('data/role-sprints.json', { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Role catalog unavailable (${response.status})`);
  state.catalog = await response.json();
  state.catalog.roles.forEach((role) => {
    const option = document.createElement('option');
    option.value = role.id;
    option.textContent = role.name;
    elements.role.append(option);
  });
  applyQueryDefaults();
  elements.minutes.addEventListener('input', () => {
    elements.minutesOutput.textContent = `${elements.minutes.value} minutes`;
  });
  document.querySelectorAll('[name="duration"]').forEach((choice) => {
    choice.addEventListener('change', () => {
      elements.duration.value = choice.value;
    });
  });
  elements.builder.addEventListener('submit', createPlan);
  elements.reset.addEventListener('click', resetPlan);
  elements.exportButton.addEventListener('click', exportProgress);
  elements.shareButton.addEventListener('click', sharePlan);
  setupConsent();
  restore();
  render();
}

init().catch((error) => {
  setStatus('RoleSprint could not start. Please refresh and try again.');
  console.error(error);
});
