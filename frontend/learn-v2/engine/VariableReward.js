// VariableReward: Hook-Model variable reward layered on top of fixed XP.
// Variable-ratio reinforcement: an unpredictable bonus spikes dopamine far
// more than fixed rewards. Kept honest — small, celebratory, not manipulative.
export class VariableReward {
  constructor(rng = Math.random) { this.rng = rng; }

  // Given the base XP just earned, returns { bonus, label }.
  // ~20% chance of a surprise bonus; bonus scales with base.
  roll(baseXp) {
    if (baseXp <= 0) return { bonus: 0, label: null };
    const r = this.rng();
    if (r < 0.05) return { bonus: baseXp * 2, label: '🎉 JACKPOT! Triple XP!' };
    if (r < 0.20) return { bonus: Math.ceil(baseXp * 0.5), label: '✨ Bonus XP!' };
    return { bonus: 0, label: null };
  }
}
