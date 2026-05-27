class SoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Lazy initialize to bypass browser autoplay blocks
    this.isEnabled = localStorage.getItem("system_sfx_enabled") !== "false";
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem("system_sfx_enabled", String(this.isEnabled));
    return this.isEnabled;
  }

  getEnabled() {
    return this.isEnabled;
  }

  playClick() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playStrike() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initCtx();
      
      // Slash: high-pass white noise / frequency down-sweep sweep
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.16);

      sub.type = "sine";
      sub.frequency.setValueAtTime(90, ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      sub.start();
      osc.stop(ctx.currentTime + 0.16);
      sub.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }

  playStatAlloc() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.06, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.22);
      });
    } catch (e) {}
  }

  playQuestComplete() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // Clean tech melody: C5 -> E5 -> G5 -> C6
      const introNotes = [
        { f: 523.25, t: 0.1 },
        { f: 659.25, t: 0.18 },
        { f: 783.99, t: 0.26 },
        { f: 1046.50, t: 0.34 }
      ];

      introNotes.forEach((n) => {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = n.f;

        subOsc.type = "sine";
        subOsc.frequency.value = n.f * 1.5; // Sweet overtone

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + 0.35);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1800;

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.t);
        subOsc.start(now + n.t);
        osc.stop(now + n.t + 0.35);
        subOsc.stop(now + n.t + 0.35);
      });
    } catch (e) {}
  }

  playLevelUp() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // Sub Bass hit
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(90, now);
      sub.frequency.exponentialRampToValueAtTime(35, now + 1.1);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start();
      sub.stop(now + 1.1);

      // Fast ascending synth sweep
      const notes = [261.63, 311.13, 392.00, 466.16, 523.25, 622.25, 783.99, 932.33, 1046.50, 1244.51, 1567.98];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.value = freq;

        const startTime = now + (idx * 0.07);

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2200;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch (e) {}
  }
}

export const sfx = new SoundEngine();
