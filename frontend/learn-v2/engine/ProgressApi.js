// ProgressApi: thin client for the Progress Service Lambda.
// Pass { baseUrl, token } to enable cross-device sync; otherwise no-op.
export class ProgressApi {
  constructor({ baseUrl = '', token = '' } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  get enabled() { return !!(this.baseUrl && this.token); }

  _headers() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
  }

  // Returns { progress, reviews } or null on failure / when disabled.
  async load(courseId) {
    if (!this.enabled) return null;
    try {
      const r = await fetch(`${this.baseUrl}/v2/progress/${encodeURIComponent(courseId)}`, { headers: this._headers() });
      return r.ok ? r.json() : null;
    } catch { return null; }
  }

  // Persist the full progress doc; fire-and-forget from the caller.
  async save(courseId, data) {
    if (!this.enabled) return;
    await fetch(`${this.baseUrl}/v2/progress/${encodeURIComponent(courseId)}`, {
      method: 'PUT', headers: this._headers(), body: JSON.stringify(data),
    });
  }

  // Idempotent XP append (eventId dedupes server-side).
  async addXp(eventId, courseId, amount) {
    if (!this.enabled) return;
    await fetch(`${this.baseUrl}/v2/xp`, {
      method: 'POST', headers: this._headers(),
      body: JSON.stringify({ eventId, courseId, amount }),
    });
  }
}
