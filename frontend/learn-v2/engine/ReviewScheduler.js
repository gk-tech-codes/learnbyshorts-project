// ReviewScheduler: SM-2-lite spaced repetition keyed by concept.
// quality: 0=forgot, 1=hard, 2=good, 3=easy.
export class ReviewScheduler {
  constructor(items = {}) {
    this.items = items; // concept -> { ef, interval, due (ISO date) }
  }

  grade(concept, quality) {
    const it = this.items[concept] || { ef: 2.5, interval: 0 };
    if (quality <= 0) {
      it.interval = 1;
    } else {
      it.interval = it.interval === 0 ? 1 : it.interval === 1 ? 3 : Math.round(it.interval * it.ef);
      it.ef = Math.max(1.3, it.ef + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)));
    }
    it.due = new Date(Date.now() + it.interval * 864e5).toISOString().slice(0, 10);
    this.items[concept] = it;
    return it;
  }

  // Concepts due for review today or earlier.
  due(today = new Date().toISOString().slice(0, 10)) {
    return Object.keys(this.items).filter(c => this.items[c].due && this.items[c].due <= today);
  }

  toJSON() { return this.items; }
}
