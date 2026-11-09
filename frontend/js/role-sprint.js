import {
  TRACK_KEYS,
  analyzeJobDescription,
  buildPlan,
  completionSummary,
  parsePublicPlanParameters,
  publicPlanParameters,
} from './role-sprint-core.mjs';

const STORAGE_KEY = 'learnbyshorts:role-sprint:v2';
const CONSENT_KEY = 'learnbyshorts:analytics-consent:v1';
const MEASUREMENT_ID = 'G-5413RZXDET';
const SKILL_LEVELS = Object.freeze({
  1: 'Starting',
  2: 'Learning',
  3: 'Can practice',
  4: 'Can explain',
  5: 'Can lead',
});
const ANALYTICS_FIELDS = Object.freeze({
  rolesprint_day_opened: ['role_id', 'day_number', 'focus_track'],
  rolesprint_step_completed: ['role_id', 'day_number', 'step_type', 'minutes'],
  rolesprint_plan_created: [
    'role_id',
    'duration_days',
    'minutes_per_day',
    'readiness_band',
    'priority_track',
    'job_signals_used',
  ],
  rolesprint_progress_exported: ['role_id', 'completed_days', 'completion_percent'],
  rolesprint_plan_shared: ['role_id', 'duration_days'],
});

const state = {
  catalog: null,
  plan: null,
  completed: new Set(),
  activeDay: 1,
  activeView: 'overview',
};

const elements = {
  builder: document.querySelector('#sprint-builder'),
  role: document.querySelector('#target-role'),
  roleOutcome: document.querySelector('#role-outcome'),
  jobDescription: document.querySelector('#job-description'),
  jobSignalSummary: document.querySelector('#job-signal-summary'),
  jobSignalChips: document.querySelector('#job-signal-chips'),
  duration: document.querySelector('#duration-days'),
  minutes: document.querySelector('#minutes-per-day'),
  minutesOutput: document.querySelector('#minutes-output'),
  plan: document.querySelector('#sprint-plan'),
  empty: document.querySelector('#plan-empty'),
  title: document.querySelector('#plan-title'),
  outcome: document.querySelector('#plan-outcome'),
  readiness: document.querySelector('#readiness-score'),
  metricPace: document.querySelector('#metric-pace'),
  metricHours: document.querySelector('#metric-hours'),
  metricMilestones: document.querySelector('#metric-milestones'),
  progress: document.querySelector('#progress-value'),
  progressPercent: document.querySelector('#progress-percent'),
  progressText: document.querySelector('#progress-text'),
  focus: document.querySelector('#focus-tracks'),
  roadmap: document.querySelector('#roadmap-weeks'),
  mission: document.querySelector('#mission'),
  activeWeekLabel: document.querySelector('#active-week-label'),
  activeDayLabel: document.querySelector('#active-day-label'),
  previousDay: document.querySelector('#previous-day'),
  nextDay: document.querySelector('#next-day'),
  startFirstMission: document.querySelector('#start-first-mission'),
  reset: document.querySelector('#reset-plan'),
  exportButton: document.querySelector('#export-progress'),
  shareButton: document.querySelector('#share-plan'),
  status: document.querySelector('#sprint-status'),
  consent: document.querySelector('#analytics-consent'),
  acceptAnalytics: document.querySelector('#accept-analytics'),
  declineAnalytics: document.querySelector('#decline-analytics'),
};

function privacySignalActive() {
  return (
    navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1'
  );
}

function analyticsAllowed() {
  return !privacySignalActive() && localStorage.getItem(CONSENT_KEY) === 'granted';
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

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function setStatus(message) {
  elements.status.textContent = message;
}

function selectedRole() {
  return state.catalog.roles.find((role) => role.id === elements.role.value);
}

function skillValues() {
  return Object.fromEntries(
    TRACK_KEYS.map((track) => [
      track,
      Number(document.querySelector(`[name="${track}"]`).value),
    ]),
  );
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
      activeView: state.activeView,
      savedAt: new Date().toISOString(),
    }),
  );
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved?.plan?.days || !saved?.plan?.weeks || saved.plan.version !== 2) return false;
    state.plan = saved.plan;
    state.completed = new Set(saved.completed || []);
    state.activeDay = Math.max(1, Math.min(saved.activeDay || 1, saved.plan.durationDays));
    state.activeView = ['overview', 'today', 'roadmap'].includes(saved.activeView)
      ? saved.activeView
      : 'overview';
    return true;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

function dayIsComplete(day) {
  return day.steps.every((step) => state.completed.has(step.id));
}

function formatHours(minutes) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hours`;
}

function renderRoleOutcome() {
  const role = selectedRole();
  elements.roleOutcome.textContent = role
    ? role.outcome
    : 'Pick the closest role. You can tune the roadmap with a job description below.';
}

function renderSkillLabels() {
  const outputIds = {
    coding: '#skill-coding-output',
    debugging: '#skill-debugging-output',
    systemDesign: '#skill-system-design-output',
    aiFluency: '#skill-ai-output',
    communication: '#skill-communication-output',
  };
  for (const trackKey of TRACK_KEYS) {
    const input = document.querySelector(`[name="${trackKey}"]`);
    document.querySelector(outputIds[trackKey]).textContent = SKILL_LEVELS[input.value];
  }
}

function currentJobAnalysis() {
  return analyzeJobDescription(elements.jobDescription.value, state.catalog.tracks);
}

function renderJobSignals() {
  const value = elements.jobDescription.value.trim();
  if (!value) {
    elements.jobSignalSummary.hidden = true;
    elements.jobSignalChips.replaceChildren();
    return;
  }
  const analysis = currentJobAnalysis();
  elements.jobSignalSummary.hidden = false;
  elements.jobSignalChips.replaceChildren();
  if (analysis.totalMatches === 0) {
    elements.jobSignalChips.append(
      createTextElement('span', 'signal-chip is-neutral', 'No supported signals yet · role defaults will be used'),
    );
    return;
  }
  analysis.tracks.forEach((result) => {
    const track = state.catalog.tracks[result.track];
    const chip = createTextElement(
      'span',
      'signal-chip',
      `${track.icon} ${track.label} · ${result.terms.join(', ')}`,
    );
    elements.jobSignalChips.append(chip);
  });
}

function renderPriorities() {
  elements.focus.replaceChildren();
  state.plan.rankedTracks.slice(0, 3).forEach((item, index) => {
    const track = state.catalog.tracks[item.track];
    const card = document.createElement('article');
    card.className = 'priority-card';
    const top = document.createElement('div');
    top.append(
      createTextElement('span', 'priority-rank', String(index + 1).padStart(2, '0')),
      createTextElement('span', 'priority-icon', track.icon),
    );
    const signalCopy = item.signalCount > 0
      ? `${item.signalCount} matching job signal${item.signalCount === 1 ? '' : 's'} increased this priority.`
      : `Role importance ${item.importance}/5 · your starting level ${item.skill}/5.`;
    card.append(
      top,
      createTextElement('h4', '', track.label),
      createTextElement('p', '', signalCopy),
      createTextElement('strong', '', `Finish with ${track.proof.toLowerCase()}.`),
    );
    elements.focus.append(card);
  });
}

function renderProgress() {
  const summary = completionSummary(state.plan, state.completed);
  elements.progress.style.width = `${summary.completionPercent}%`;
  elements.progress.parentElement.setAttribute('aria-valuenow', String(summary.completionPercent));
  elements.progressPercent.textContent = `${summary.completionPercent}%`;
  elements.progressText.textContent =
    `${summary.completedDays}/${summary.totalDays} days complete · ${summary.completedMinutes} focused minutes`;
}

function openDay(dayNumber, { announce = true } = {}) {
  state.activeDay = Math.max(1, Math.min(dayNumber, state.plan.durationDays));
  state.activeView = 'today';
  persist();
  render();
  if (announce) {
    const day = state.plan.days[state.activeDay - 1];
    track('rolesprint_day_opened', {
      role_id: state.plan.roleId,
      day_number: day.day,
      focus_track: day.focus,
    });
  }
}

function renderRoadmap() {
  elements.roadmap.replaceChildren();
  state.plan.weeks.forEach((week) => {
    const card = document.createElement('article');
    card.className = `roadmap-week phase-${week.phaseKey}`;
    const header = document.createElement('div');
    const headingCopy = document.createElement('div');
    headingCopy.append(
      createTextElement('span', 'roadmap-phase', `Week ${week.week} · ${week.phaseLabel}`),
      createTextElement('h4', '', week.phaseSummary),
    );
    const weekComplete = week.dayNumbers.every((dayNumber) =>
      dayIsComplete(state.plan.days[dayNumber - 1]),
    );
    header.append(
      headingCopy,
      createTextElement('span', `week-state${weekComplete ? ' is-complete' : ''}`, weekComplete ? 'Complete' : `Days ${week.startDay}–${week.endDay}`),
    );
    card.append(header, createTextElement('p', 'week-milestone', `Milestone · ${week.milestone}`));

    const dayGrid = document.createElement('div');
    dayGrid.className = 'roadmap-day-grid';
    week.dayNumbers.forEach((dayNumber) => {
      const day = state.plan.days[dayNumber - 1];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'roadmap-day';
      button.classList.toggle('is-complete', dayIsComplete(day));
      button.classList.toggle('is-active', dayNumber === state.activeDay);
      button.setAttribute('aria-label', `Open day ${dayNumber}: ${day.focusLabel}`);
      button.append(
        createTextElement('span', '', dayIsComplete(day) ? '✓' : String(dayNumber)),
        createTextElement('small', '', day.focusLabel),
      );
      button.addEventListener('click', () => openDay(dayNumber));
      dayGrid.append(button);
    });
    card.append(dayGrid);
    elements.roadmap.append(card);
  });
}

function copyText(text, successMessage) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => setStatus(successMessage))
      .catch(() => setStatus('Copy was blocked by the browser. Select the prompt and copy it manually.'));
    return;
  }
  setStatus('Clipboard access is unavailable. Select the prompt and copy it manually.');
}

function renderMission() {
  elements.mission.replaceChildren();
  const day = state.plan.days[state.activeDay - 1];
  const week = Math.ceil(day.day / 7);
  elements.activeWeekLabel.textContent = `Week ${week} · ${day.phaseLabel}`;
  elements.activeDayLabel.textContent = `Day ${day.day} of ${state.plan.durationDays}`;
  elements.previousDay.disabled = day.day === 1;
  elements.nextDay.disabled = day.day === state.plan.durationDays;

  const heading = document.createElement('div');
  heading.className = 'mission-heading';
  const title = document.createElement('div');
  title.append(
    createTextElement('span', 'mission-phase', `${day.icon} ${day.phaseLabel}`),
    createTextElement('h3', '', day.title),
    createTextElement('p', '', `${state.plan.minutesPerDay} focused minutes · ${day.why}`),
  );
  heading.append(title, createTextElement('span', 'mission-count', `${day.day}/${state.plan.durationDays}`));
  elements.mission.append(heading);

  const proof = document.createElement('div');
  proof.className = 'proof-target';
  proof.append(
    createTextElement('span', '', 'Proof to keep'),
    createTextElement('strong', '', day.artifact),
  );
  elements.mission.append(proof);

  const stepList = document.createElement('div');
  stepList.className = 'mission-steps';
  day.steps.forEach((step, index) => {
    const item = document.createElement('div');
    item.className = 'mission-step';
    item.classList.toggle('is-complete', state.completed.has(step.id));
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = step.id;
    checkbox.checked = state.completed.has(step.id);
    const label = document.createElement('label');
    label.htmlFor = step.id;
    const stepTopline = document.createElement('span');
    stepTopline.className = 'step-topline';
    stepTopline.append(
      createTextElement('strong', '', `${index + 1} · ${step.label}`),
      createTextElement('span', '', `${step.minutes} min`),
    );
    label.append(stepTopline, createTextElement('span', 'step-instruction', step.instruction));
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
      const finishedDay = dayIsComplete(day);
      persist();
      render();
      if (finishedDay) {
        setStatus(
          day.day === state.plan.durationDays
            ? 'Sprint complete. Export your practice log and review the proof you created.'
            : `Day ${day.day} complete. Your next mission is ready.`,
        );
      }
    });
    item.append(checkbox, label);

    if (step.type === 'ai') {
      const prompt = document.createElement('div');
      prompt.className = 'ai-prompt';
      prompt.append(
        createTextElement('span', '', 'AI critique prompt'),
        createTextElement('p', '', day.aiPrompt),
      );
      const copyButton = createTextElement('button', '', 'Copy prompt');
      copyButton.type = 'button';
      copyButton.addEventListener('click', () =>
        copyText(day.aiPrompt, 'AI critique prompt copied. Do not paste confidential information into an AI tool.'),
      );
      prompt.append(copyButton);
      item.append(prompt);
    }
    stepList.append(item);
  });
  elements.mission.append(stepList);

  const footer = document.createElement('div');
  footer.className = 'mission-footer';
  footer.append(
    createTextElement(
      'p',
      'practice-disclosure',
      'Learner-owned practice log. It is not a certification or independently verified credential.',
    ),
  );
  const nextAction = createTextElement(
    'button',
    'mission-next',
    day.day === state.plan.durationDays ? 'Review full roadmap →' : 'Open next day →',
  );
  nextAction.type = 'button';
  nextAction.addEventListener('click', () => {
    if (day.day === state.plan.durationDays) {
      switchView('roadmap');
    } else {
      openDay(day.day + 1);
    }
  });
  footer.append(nextAction);
  elements.mission.append(footer);
}

function switchView(view, { focus = false } = {}) {
  state.activeView = view;
  document.querySelectorAll('[data-plan-view]').forEach((tab) => {
    const selected = tab.dataset.planView === view;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  document.querySelectorAll('.plan-panel').forEach((panel) => {
    panel.hidden = panel.id !== `plan-${view}`;
  });
  persist();
}

function render() {
  if (!state.plan) {
    elements.plan.hidden = true;
    elements.empty.hidden = false;
    return;
  }
  elements.empty.hidden = true;
  elements.plan.hidden = false;
  elements.title.textContent = `${state.plan.durationDays}-day ${state.plan.roleName} roadmap`;
  elements.outcome.textContent = state.plan.outcome;
  elements.readiness.textContent = `${state.plan.startingReadiness}%`;
  elements.metricPace.textContent = `${state.plan.minutesPerDay} min/day`;
  elements.metricHours.textContent = formatHours(state.plan.durationDays * state.plan.minutesPerDay);
  elements.metricMilestones.textContent = String(state.plan.weeks.length);
  renderPriorities();
  renderProgress();
  renderRoadmap();
  renderMission();
  switchView(state.activeView);
}

function applyQueryDefaults() {
  const configuration = parsePublicPlanParameters(
    window.location.search,
    state.catalog.roles.map((role) => role.id),
  );
  if (!configuration) {
    elements.minutesOutput.textContent = `${elements.minutes.value} min/day`;
    return false;
  }
  if (configuration.roleId) elements.role.value = configuration.roleId;
  if (configuration.durationDays) {
    const durationChoice = document.querySelector(`[name="duration"][value="${configuration.durationDays}"]`);
    if (durationChoice) durationChoice.checked = true;
    elements.duration.value = String(configuration.durationDays);
  }
  if (configuration.minutesPerDay) elements.minutes.value = String(configuration.minutesPerDay);
  elements.minutesOutput.textContent = `${elements.minutes.value} min/day`;
  renderRoleOutcome();
  return true;
}

function createPlan(event) {
  event.preventDefault();
  const role = selectedRole();
  if (!role) {
    setStatus('Choose a target role to build the roadmap.');
    elements.role.focus();
    return;
  }
  const jobAnalysis = currentJobAnalysis();
  state.plan = buildPlan({
    role,
    trackCatalog: state.catalog.tracks,
    skills: skillValues(),
    jobSignals: jobAnalysis.emphasis,
    durationDays: Number(document.querySelector('[name="duration"]:checked').value),
    minutesPerDay: Number(elements.minutes.value),
  });
  state.completed = new Set();
  state.activeDay = 1;
  state.activeView = 'overview';
  elements.jobDescription.value = '';
  elements.jobSignalSummary.hidden = true;
  elements.jobSignalChips.replaceChildren();
  persist();
  render();
  elements.plan.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus(
    jobAnalysis.totalMatches > 0
      ? `Roadmap ready. ${jobAnalysis.totalMatches} job signals were applied; the original text was discarded.`
      : 'Your private roadmap is ready and saved only in this browser.',
  );
  track('rolesprint_plan_created', {
    role_id: role.id,
    duration_days: state.plan.durationDays,
    minutes_per_day: state.plan.minutesPerDay,
    readiness_band: Math.floor(state.plan.startingReadiness / 20) * 20,
    priority_track: state.plan.rankedTracks[0].track,
    job_signals_used: jobAnalysis.totalMatches > 0,
  });
}

function resetPlan() {
  state.plan = null;
  state.completed = new Set();
  state.activeDay = 1;
  state.activeView = 'overview';
  persist();
  render();
  elements.builder.reset();
  elements.duration.value = '30';
  elements.minutesOutput.textContent = '45 min/day';
  renderRoleOutcome();
  renderSkillLabels();
  renderJobSignals();
  elements.builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus('The roadmap and its progress were removed from this browser.');
}

function exportProgress() {
  if (!state.plan) return;
  const summary = completionSummary(state.plan, state.completed);
  const payload = {
    schema: 'learnbyshorts-practice-log-v2',
    exportedAt: new Date().toISOString(),
    plan: {
      roleId: state.plan.roleId,
      roleName: state.plan.roleName,
      durationDays: state.plan.durationDays,
      minutesPerDay: state.plan.minutesPerDay,
      startingReadiness: state.plan.startingReadiness,
      priorityTracks: state.plan.rankedTracks.slice(0, 3).map((item) => item.track),
      detectedJobSignalCounts: state.plan.jobSignalCounts,
    },
    progress: summary,
    completedStepIds: [...state.completed].sort(),
    disclosure: 'Learner-owned practice log; not an independently verified credential.',
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `learnbyshorts-${state.plan.roleId}-practice-log.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  setStatus('Practice log exported. It contains no job text, notes, code, email, or account data.');
  track('rolesprint_progress_exported', {
    role_id: state.plan.roleId,
    completed_days: summary.completedDays,
    completion_percent: summary.completionPercent,
  });
}

function sharePlan() {
  if (!state.plan) return;
  const query = publicPlanParameters({
    roleId: state.plan.roleId,
    durationDays: state.plan.durationDays,
    minutesPerDay: state.plan.minutesPerDay,
  });
  const url = `${window.location.origin}${window.location.pathname}?${query}`;
  copyText(url, 'A public plan link was copied. It contains no job text, scores, or progress.');
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
        ? 'Product analytics enabled. Job text, code, answers, scores, and identity fields are never sent.'
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

  const sharedConfigurationLoaded = applyQueryDefaults();
  elements.role.addEventListener('change', renderRoleOutcome);
  elements.jobDescription.addEventListener('input', renderJobSignals);
  elements.minutes.addEventListener('input', () => {
    elements.minutesOutput.textContent = `${elements.minutes.value} min/day`;
  });
  TRACK_KEYS.forEach((trackKey) => {
    document.querySelector(`[name="${trackKey}"]`).addEventListener('input', renderSkillLabels);
  });
  document.querySelectorAll('[name="duration"]').forEach((choice) => {
    choice.addEventListener('change', () => {
      elements.duration.value = choice.value;
    });
  });
  document.querySelectorAll('[data-plan-view]').forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.dataset.planView));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const tabs = [...document.querySelectorAll('[data-plan-view]')];
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const index = (tabs.indexOf(tab) + direction + tabs.length) % tabs.length;
      switchView(tabs[index].dataset.planView, { focus: true });
    });
  });
  elements.previousDay.addEventListener('click', () => openDay(state.activeDay - 1));
  elements.nextDay.addEventListener('click', () => openDay(state.activeDay + 1));
  elements.startFirstMission.addEventListener('click', () => openDay(1));
  elements.builder.addEventListener('submit', createPlan);
  elements.reset.addEventListener('click', resetPlan);
  elements.exportButton.addEventListener('click', exportProgress);
  elements.shareButton.addEventListener('click', sharePlan);
  setupConsent();
  renderSkillLabels();
  if (!sharedConfigurationLoaded) restore();
  render();
  if (sharedConfigurationLoaded) {
    setStatus('Shared plan settings loaded. Review your baseline, then generate a fresh private roadmap.');
  }
}

init().catch((error) => {
  setStatus('RoleSprint could not start. Please refresh and try again.');
  console.error(error);
});
