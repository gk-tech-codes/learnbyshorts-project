// Adaptive: pick next difficulty from rolling quiz accuracy.
export class Adaptive {
  constructor(window = 5) { this.window = window; this.history = []; }

  record(correct) {
    this.history.push(correct ? 1 : 0);
    if (this.history.length > this.window) this.history.shift();
  }

  get accuracy() {
    if (!this.history.length) return 0.5;
    return this.history.reduce((a, b) => a + b, 0) / this.history.length;
  }

  // Returns target difficulty 1..5. High accuracy -> harder.
  nextDifficulty() {
    const a = this.accuracy;
    if (a >= 0.85) return 5;
    if (a >= 0.7) return 4;
    if (a >= 0.5) return 3;
    if (a >= 0.3) return 2;
    return 1;
  }
}
