// ProgressStore: localStorage-first persistence; optional API sync hook.
export class ProgressStore {
  constructor(courseId, apiSync = null) {
    this.key = `lbs2:${courseId}`;
    this.apiSync = apiSync; // async (data) => void  (e.g. Progress Lambda)
    this.data = this._load();
  }

  _load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || this._empty(); }
    catch { return this._empty(); }
  }

  _empty() { return { completed: [], position: 0, game: {}, reviews: {} }; }

  get() { return this.data; }

  complete(blockId) {
    if (!this.data.completed.includes(blockId)) this.data.completed.push(blockId);
  }

  save(patch = {}) {
    Object.assign(this.data, patch);
    localStorage.setItem(this.key, JSON.stringify(this.data));
    if (this.apiSync) Promise.resolve(this.apiSync(this.data)).catch(() => {});
  }
}
