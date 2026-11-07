// BlockRenderer: render a block to HTML and wire interaction.
// onResult({ xp, concept, quality, correct, next }) is called when the
// learner completes a block. quality (0-3) feeds spaced repetition.
import { evaluateJavaChallenge } from './CodeValidator.js';

export const BlockRenderer = {
  render(block, mount, onResult) {
    mount.innerHTML = '';
    const fn = this['_' + block.type] || this._story;
    fn.call(this, block, mount, onResult);
  },

  _e(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  },

  _h(html) { const d = document.createElement('div'); d.className = 'block'; d.innerHTML = html; return d; },

  _story(b, mount, done) {
    const el = this._h(`<p class="block-kicker">Story beat</p><h2>${this._e(b.title || 'Story')}</h2>
      ${b.character ? `<p class="who">${this._e(b.character)}</p>` : ''}
      <p>${this._e(b.text || '')}</p><button class="primary">Continue</button>`);
    el.querySelector('button').onclick = () => done({ xp: b.xp ?? 10, concept: b.concept });
    mount.append(el);
  },

  _choice(b, mount, done) {
    const el = this._h(`<p class="block-kicker">Make a decision</p><h2>${this._e(b.title || 'Choose')}</h2><div class="answers"></div>`);
    const answers = el.querySelector('.answers');
    (b.options || []).forEach(o => {
      const btn = document.createElement('button');
      btn.textContent = o.text;
      btn.onclick = () => done({ xp: o.correct ? (b.xp ?? 5) : 0, concept: b.concept, next: o.next, correct: !!o.correct });
      answers.append(btn);
    });
    mount.append(el);
  },

  _recall(b, mount, done) {
    const el = this._h(`<p class="block-kicker">Active recall</p><h2>Retrieve before you reveal</h2><p><b>${this._e(b.front)}</b></p>
      <p class="back" hidden>${this._e(b.back)}</p>
      <button class="reveal primary">Show answer</button>
      <div class="grade" hidden>
        <button data-q="0">Forgot</button><button data-q="1">Hard</button>
        <button data-q="2">Good</button><button data-q="3">Easy</button>
      </div>`);
    el.querySelector('.reveal').onclick = () => {
      el.querySelector('.back').hidden = false;
      el.querySelector('.grade').hidden = false;
      el.querySelector('.reveal').hidden = true;
    };
    el.querySelectorAll('.grade button').forEach(btn => {
      btn.onclick = () => done({ xp: b.xp ?? 10, concept: b.concept, quality: +btn.dataset.q });
    });
    mount.append(el);
  },

  _quiz(b, mount, done) {
    const el = this._h(`<p class="block-kicker">Quick check</p><h2>${this._e(b.title || 'Quiz')}</h2><div class="answers"></div><p class="feedback" aria-live="polite"></p>`);
    const answers = el.querySelector('.answers');
    (b.options || []).forEach(o => {
      const btn = document.createElement('button');
      btn.textContent = o.text;
      btn.onclick = () => {
        const correct = !!o.correct;
        btn.classList.add(correct ? 'ok' : 'bad');
        el.querySelectorAll('button').forEach(option => { option.disabled = true; });
        el.querySelector('.feedback').textContent =
          correct ? 'Correct — nice retrieval.' : 'Not quite. The next story beat will reinforce it.';
        setTimeout(() => done({
          xp: correct ? (b.xp ?? 15) : 0,
          concept: b.concept,
          correct,
          quality: correct ? 2 : 0
        }), 650);
      };
      answers.append(btn);
    });
    mount.append(el);
  },

  _code(b, mount, done) {
    const el = this._h(`<p class="block-kicker">Code debugger</p><h2>${this._e(b.title || 'Code Challenge')}</h2><p>${this._e(b.prompt || '')}</p>
      <div class="code-workbench">
        <div class="code-workbench-head"><strong>Java practice file</strong><span>Private browser checks · nothing uploaded</span></div>
        <textarea rows="12" maxlength="12000" spellcheck="false" aria-label="Code challenge editor">${this._e(b.starter || '')}</textarea>
        <div class="code-actions">
          <button type="button" class="primary" data-code-action="check">Run checks</button>
          <button type="button" data-code-action="reset">Reset starter</button>
        </div>
        <div class="code-report" aria-live="polite">
          <strong data-code-summary>Fix the starter code, then run the checks.</strong>
          <p>This fast checker validates the lesson requirements and balanced Java structure. It is not a full compiler.</p>
          <ul class="code-requirements"></ul>
          <ul class="code-diagnostics" hidden></ul>
        </div>
        <button type="button" class="primary code-continue" data-code-action="continue" hidden>Continue with verified code</button>
      </div>`);
    const editor = el.querySelector('textarea');
    const runButton = el.querySelector('[data-code-action="check"]');
    const resetButton = el.querySelector('[data-code-action="reset"]');
    const continueButton = el.querySelector('[data-code-action="continue"]');
    const summary = el.querySelector('[data-code-summary]');
    const requirements = el.querySelector('.code-requirements');
    const diagnostics = el.querySelector('.code-diagnostics');
    let latestPassed = false;

    const renderReport = result => {
      requirements.replaceChildren();
      result.checks.forEach(check => {
        const item = document.createElement('li');
        item.className = check.passed ? 'ok' : 'bad';
        const label = document.createElement('strong');
        const hint = document.createElement('span');
        label.textContent = `${check.passed ? '✓' : '○'} ${check.label}`;
        hint.textContent = check.passed ? 'Requirement detected.' : check.hint;
        item.append(label, hint);
        requirements.append(item);
      });

      diagnostics.replaceChildren();
      result.diagnostics.forEach(message => {
        const item = document.createElement('li');
        item.textContent = message;
        diagnostics.append(item);
      });
      diagnostics.hidden = result.diagnostics.length === 0;
      latestPassed = result.pass;
      continueButton.hidden = !result.pass;
      runButton.disabled = result.pass;
      summary.textContent = result.pass
        ? 'All checks pass. Inspect the code once more, then continue.'
        : `${result.checks.filter(check => check.passed).length} of ${result.checks.length} requirements pass. Keep debugging.`;
      el.querySelector('.code-report').classList.toggle('is-ready', result.pass);
    };

    runButton.onclick = () => {
      renderReport(evaluateJavaChallenge(b, editor.value));
    };
    resetButton.onclick = () => {
      editor.value = b.starter || '';
      latestPassed = false;
      runButton.disabled = false;
      continueButton.hidden = true;
      requirements.replaceChildren();
      diagnostics.replaceChildren();
      diagnostics.hidden = true;
      summary.textContent = 'Starter restored. Fix the code, then run the checks.';
      el.querySelector('.code-report').classList.remove('is-ready');
      editor.focus();
    };
    editor.addEventListener('input', () => {
      if (!latestPassed) return;
      latestPassed = false;
      runButton.disabled = false;
      continueButton.hidden = true;
      summary.textContent = 'Code changed. Run the checks again before continuing.';
      el.querySelector('.code-report').classList.remove('is-ready');
    });
    continueButton.onclick = () => {
      if (!latestPassed) return;
      continueButton.disabled = true;
      done({ xp: b.xp ?? 25, concept: b.concept, correct: true, quality: 3 });
    };
    mount.append(el);
  },

  _boss(b, mount, done) {
    const el = this._h(`<p class="block-kicker">Final challenge</p><h2>Boss: ${this._e(b.title || '')}</h2>
      <p class="timer"></p><div class="q"></div>`);
    mount.append(el);
    const qs = b.questions || [];
    let i = 0, score = 0, left = b.timeLimitSec || 60, finished = false, timer;
    const timerEl = el.querySelector('.timer');
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      el.querySelectorAll('button').forEach(button => { button.disabled = true; });
      done({
        xp: Math.round((b.xp ?? 50) * score / Math.max(1, qs.length)),
        concept: b.concept,
        correct: score === qs.length
      });
    };
    const next = () => {
      if (finished) return;
      if (i >= qs.length) return finish();
      this._quiz(qs[i], el.querySelector('.q'), r => { if (r.correct) score++; i++; next(); });
    };
    timerEl.textContent = `⏱ ${left}s`;
    timer = setInterval(() => {
      left -= 1;
      timerEl.textContent = `⏱ ${Math.max(0, left)}s`;
      if (left <= 0) finish();
    }, 1000);
    next();
  }
};
