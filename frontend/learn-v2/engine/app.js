// app.js: wire the learning engine into a runnable demo.
import { CourseLoader } from './CourseLoader.js';
import { GameEngine } from './GameEngine.js';
import { ReviewScheduler } from './ReviewScheduler.js';
import { ProgressStore } from './ProgressStore.js';
import { Adaptive } from './Adaptive.js';
import { BlockRenderer } from './BlockRenderer.js';
import { VariableReward } from './VariableReward.js';

const $ = sel => document.querySelector(sel);

async function main() {
  const course = await CourseLoader.load('data/oop-java-migrated.json');
  const seq = CourseLoader.sequence(course, { interactionFirst: true });

  const progress = new ProgressStore(course.id);
  const isReturningLearner = progress.get().completed.length > 0;
  const game = new GameEngine(progress.get().game);
  const reviews = new ReviewScheduler(progress.get().reviews);
  const adaptive = new Adaptive();
  const reward = new VariableReward();

  game.touchDay();
  $('#title').textContent = course.title;
  document.title = `${course.title} | LearnByShorts`;

  let idx = progress.get().position || 0;
  const total = seq.length;
  const byId = Object.fromEntries(seq.map((b, i) => [b.id, i]));
  window.Analytics?.trackLessonStart?.(course.id, isReturningLearner);
  let completionTracked = false;

  // Honest "come back" trigger: surface concepts due for review.
  const dueCount = reviews.due().length;
  if (dueCount) flash(`📚 ${dueCount} concept${dueCount > 1 ? 's' : ''} ready to review`);

  function hud() {
    $('#hud').textContent =
      `Level ${game.level} · ${game.xp} XP · 🔥 ${game.streak} day streak · ` +
      `${reviews.due().length} due for review`;
    const percent = Math.min(100, Math.round(idx / total * 100));
    $('#progress-bar').style.width = `${percent}%`;
    $('#progress-percent').textContent = `${percent}%`;
    $('#progress-label').textContent =
      idx >= total ? 'Preview complete' : `Step ${idx + 1} of ${total}`;
  }

  function flash(msg) {
    const el = $('#flash'); if (!el) return;
    el.textContent = msg; el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 2200);
  }

  function step() {
    if (idx >= seq.length) {
      $('#stage').innerHTML = `
        <div class="completion-card">
          <div>
            <div class="celebration" aria-hidden="true">🎉</div>
            <p class="block-kicker">Preview complete</p>
            <h2>You learned by doing.</h2>
            <p>You earned ${game.xp} XP and reached level ${game.level}.
              Founding learners help choose and test the next interactive labs.</p>
            <a href="../index.html#pricing">See founding access · $29</a>
          </div>
        </div>`;
      if (!completionTracked) {
        window.Analytics?.trackLessonComplete?.(course.id, total, game.xp, game.level);
        completionTracked = true;
      }
      $('#stage').querySelector('a')?.addEventListener('click', () => {
        window.Analytics?.trackFoundingInterest?.('lesson_completion');
      });
      persist();
      hud();
      return;
    }
    const block = seq[idx];
    BlockRenderer.render(block, $('#stage'), result => {
      const base = result.xp || 0;
      game.award(base);
      // Variable reward layer (Hook Model): occasional surprise bonus.
      const { bonus, label } = reward.roll(base);
      if (bonus) { game.award(bonus); flash(`${label} +${bonus} XP`); }
      if (typeof result.correct === 'boolean' && block.type === 'quiz') adaptive.record(result.correct);
      if (result.concept && typeof result.quality === 'number') reviews.grade(result.concept, result.quality);
      progress.complete(block.id);
      idx = result.next != null && byId[result.next] != null ? byId[result.next] : idx + 1;
      window.Analytics?.trackLearningStep?.(course.id, block.type, Math.min(idx, total), total);
      persist();
      hud();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      step();
    });
    hud();
  }

  function persist() {
    progress.save({ position: idx, game: game.toJSON(), reviews: reviews.toJSON() });
  }

  step();
}

main().catch(e => { document.body.innerHTML = `<pre style="color:red">${e.message}</pre>`; });
