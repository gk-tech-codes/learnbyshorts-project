// ReviewScheduler: SM-2-lite spaced repetition keyed by concept.
// quality: 0=forgot, 1=hard, 2=good, 3=easy.
export class ReviewScheduler {
  constructor(items = {}) {
    this.items = items && typeof items === 'object' && !Array.isArray(items)
      ? items
      : {}; // concept -> { ef, interval, due (ISO date) }
  }

  grade(concept, quality) {
    if (typeof concept !== 'string' || !concept) return null;
    const current = this.items[concept];
    const it = current && typeof current === 'object'
      ? {
          ef: Number.isFinite(current.ef) ? Math.max(1.3, current.ef) : 2.5,
          interval: Number.isFinite(current.interval) ? Math.max(0, current.interval) : 0
        }
      : { ef: 2.5, interval: 0 };
    const grade = Number.isFinite(quality) ? Math.max(0, Math.min(3, quality)) : 0;
    if (grade <= 0) {
      it.interval = 1;
    } else {
      it.interval = it.interval === 0 ? 1 : it.interval === 1 ? 3 : Math.round(it.interval * it.ef);
      it.ef = Math.max(1.3, it.ef + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02)));
    }
    it.due = new Date(Date.now() + it.interval * 864e5).toISOString().slice(0, 10);
    this.items[concept] = it;
    return it;
  }

  // Concepts due for review today or earlier.
  due(today = new Date().toISOString().slice(0, 10)) {
    return Object.keys(this.items).filter(concept => {
      const item = this.items[concept];
      return item && typeof item === 'object' &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.due) &&
        item.due <= today;
    });
  }

  toJSON() { return this.items; }
}
