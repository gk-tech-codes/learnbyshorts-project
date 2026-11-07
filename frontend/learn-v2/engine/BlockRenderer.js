// BlockRenderer: render a block to HTML and wire interaction.
// onResult({ xp, concept, quality, correct, next }) is called when the
// learner completes a block. quality (0-3) feeds spaced repetition.
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
    const el = this._h(`<p class="block-kicker">Code challenge</p><h2>${this._e(b.title || 'Code Challenge')}</h2><p>${this._e(b.prompt || '')}</p>
      <textarea rows="6" spellcheck="false" aria-label="Code challenge editor">${this._e(b.starter || '')}</textarea>
      <button class="primary">Check my code</button><p class="feedback"></p>`);
    el.querySelector('button').onclick = () => {
      const code = el.querySelector('textarea').value;
      const pass = (b.solutionIncludes || []).every(s => code.includes(s));
      el.querySelector('.feedback').textContent = pass
        ? '✅ Passed — your code includes the required pieces.'
        : 'Try again — check the prompt and the class or method names.';
      if (pass) done({ xp: b.xp ?? 25, concept: b.concept, correct: true, quality: 3 });
    };
    mount.append(el);
  },

  _boss(b, mount, done) {
    const el = this._h(`<p class="block-kicker">Final challenge</p><h2>Boss: ${this._e(b.title || '')}</h2>
      <p class="timer"></p><div class="q"></div>`);
    mount.append(el);
    const qs = b.questions || [];
    let i = 0, score = 0, left = b.timeLimitSec || 60;
    const timerEl = el.querySelector('.timer');
    const timer = setInterval(() => {
      timerEl.textContent = `⏱ ${--left}s`;
      if (left <= 0) finish();
    }, 1000);
    const finish = () => { clearInterval(timer); done({ xp: Math.round((b.xp ?? 50) * score / Math.max(1, qs.length)), concept: b.concept, correct: score === qs.length }); };
    const next = () => {
      if (i >= qs.length) return finish();
      this._quiz(qs[i], el.querySelector('.q'), r => { if (r.correct) score++; i++; next(); });
    };
    next();
  }
};
