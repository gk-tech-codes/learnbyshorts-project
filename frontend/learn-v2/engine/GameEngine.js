// GameEngine: XP, levels, streaks. Pure-ish state container.
export class GameEngine {
  constructor(state = {}) {
    const value = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
    this.xp = Number.isFinite(value.xp) && value.xp >= 0 ? Math.floor(value.xp) : 0;
    this.lastDay = /^\d{4}-\d{2}-\d{2}$/.test(value.lastDay) ? value.lastDay : null;
    this.streak = Number.isFinite(value.streak) && value.streak >= 0 ? Math.floor(value.streak) : 0;
    this.freezes = Number.isFinite(value.freezes) && value.freezes >= 0 ? Math.floor(value.freezes) : 2;
    this.badges = new Set(Array.isArray(value.badges)
      ? value.badges.filter(badge => typeof badge === 'string')
      : []);
  }

  // 100 XP per level, level grows with sqrt for a gentle curve.
  get level() { return Math.floor(Math.sqrt(this.xp / 50)) + 1; }
  get xpInLevel() { const b = 50 * (this.level - 1) ** 2; return this.xp - b; }

  award(points) {
    this.xp += Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0;
    if (this.xp >= 500) this.badges.add('rising-star');
    return this.xp;
  }

  // Call once per active day to maintain a streak.
  // Streak safety valve: a single missed day is auto-covered by a freeze
  // (if available) instead of resetting the streak — avoids the punishment
  // spiral that drives churn.
  touchDay(today = new Date().toISOString().slice(0, 10)) {
    if (this.lastDay === today) return this.streak;
    const dayMs = 864e5;
    const yest = new Date(new Date(today).getTime() - dayMs).toISOString().slice(0, 10);
    const twoAgo = new Date(new Date(today).getTime() - 2 * dayMs).toISOString().slice(0, 10);
    if (!this.lastDay || this.lastDay === yest) {
      this.streak += 1;                       // consecutive (or first) day
    } else if (this.lastDay === twoAgo && this.freezes > 0) {
      this.freezes -= 1; this.streak += 1;    // missed one day, spend a freeze
    } else {
      this.streak = 1;                        // gap too big, reset
    }
    this.lastDay = today;
    if (this.streak >= 7) this.badges.add('week-warrior');
    return this.streak;
  }

  // Manual recovery: spend a freeze to repair a just-broken streak.
  repairStreak(toValue) {
    if (this.freezes <= 0) return false;
    this.freezes -= 1; this.streak = toValue; return true;
  }

  toJSON() {
    return { xp: this.xp, lastDay: this.lastDay, streak: this.streak, freezes: this.freezes, badges: [...this.badges] };
  }
}
