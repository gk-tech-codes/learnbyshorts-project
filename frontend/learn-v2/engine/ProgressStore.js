// ProgressStore: localStorage-first persistence; optional API sync hook.
export class ProgressStore {
  constructor(courseId, apiSync = null) {
    this.key = `lbs2:${courseId}`;
    this.apiSync = apiSync; // async (data) => void  (e.g. Progress Lambda)
    this.data = this._load();
  }

  _load() {
    try { return this._normalize(JSON.parse(localStorage.getItem(this.key))); }
    catch { return this._empty(); }
  }

  _empty() { return { completed: [], position: 0, game: {}, reviews: {} }; }

  _normalize(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return this._empty();
    return {
      completed: Array.isArray(value.completed)
        ? [...new Set(value.completed.filter(item => typeof item === 'string'))]
        : [],
      position: Number.isInteger(value.position) && value.position >= 0 ? value.position : 0,
      game: value.game && typeof value.game === 'object' && !Array.isArray(value.game)
        ? value.game
        : {},
      reviews: value.reviews && typeof value.reviews === 'object' && !Array.isArray(value.reviews)
        ? value.reviews
        : {}
    };
  }

  get() { return this.data; }

  complete(blockId) {
    if (!this.data.completed.includes(blockId)) this.data.completed.push(blockId);
  }

  save(patch = {}) {
    Object.assign(this.data, patch);
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch {
      return false;
    }
    if (this.apiSync) Promise.resolve(this.apiSync(this.data)).catch(() => {});
    return true;
  }
}
