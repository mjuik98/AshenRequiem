/**
 * SoundSystem — Web Audio API 기반 절차적 사운드
 * 실제 오디오 파일 없이 AudioContext 로 간단한 효과음 생성
 */
export class SoundSystem {
  constructor() {
    this._ctx     = null;
    this._enabled = true;
  }

  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      console.warn('[SoundSystem] AudioContext 미지원 — 사운드 비활성화');
      this._enabled = false;
    }
  }

  play(type) {
    if (!this._enabled || !this._ctx) return;
    if (this._ctx.state === 'suspended') this._ctx.resume();

    try {
      switch (type) {
        case 'hit':     this._beep(440,  0.05, 'square',   0.08); break;
        case 'death':   this._beep(200,  0.12, 'sawtooth', 0.15); break;
        case 'levelup': this._chord([523, 659, 784], 0.2, 'sine', 0.18); break;
        case 'pickup':  this._beep(880,  0.04, 'sine',     0.06); break;
        case 'damage':  this._beep(180,  0.08, 'sawtooth', 0.1);  break;
      }
    } catch { /* 무음 처리 */ }
  }

  processEvents(events) {
    if (!this._enabled) return;
    if (events.deaths.length > 0)                                    this.play('death');
    if (events.hits.some(h => h.target?.type === 'player'))          this.play('damage');
    if (events.pickupCollected.length > 0)                           this.play('pickup');
  }

  _beep(freq, duration, type, volume) {
    const ctx  = this._ctx;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  _chord(freqs, duration, type, volume) {
    freqs.forEach((f, i) => {
      setTimeout(() => this._beep(f, duration, type, volume * 0.7), i * 60);
    });
  }

  destroy() {
    if (this._ctx) {
      this._ctx.close().catch(() => {});
      this._ctx = null;
    }
  }
}
