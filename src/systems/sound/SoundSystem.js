/**
 * SoundSystem — Web Audio API 기반 절차적 효과음
 * 외부 오디오 파일 없이 순수 Web Audio API로 효과음을 생성한다.
 */
export class SoundSystem {
  constructor() {
    this._ctx = null;
    this._enabled = false;
    this._masterVolume = 0.25;
    this._minInterval = 0.05;
    this._cooldowns = new Map();
  }

  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._enabled = true;
      this._resumeHandler = () => {
        if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
      };
      document.addEventListener('click',   this._resumeHandler, { once: true });
      document.addEventListener('keydown', this._resumeHandler, { once: true });
    } catch (e) {
      console.warn('SoundSystem: Web Audio API 사용 불가', e);
    }
  }

  processEvents(events) {
    if (!this._enabled) return;
    let hasEnemyHit = false, hasPlayerHit = false;
    for (let i = 0; i < events.hits.length; i++) {
      const hit = events.hits[i];
      if (hit.target?.type === 'enemy')  hasEnemyHit  = true;
      if (hit.target?.type === 'player') hasPlayerHit = true;
    }
    if (hasEnemyHit)                       this.play('hit');
    if (hasPlayerHit)                      this.play('playerHit');
    if (events.deaths.length > 0)          this.play('enemyDeath');
    if (events.pickupCollected.length > 0) this.play('pickup');
  }

  play(soundId) {
    if (!this._enabled || !this._ctx) return;
    const now  = this._ctx.currentTime;
    const last = this._cooldowns.get(soundId) || 0;
    if (now - last < this._minInterval) return;
    this._cooldowns.set(soundId, now);
    switch (soundId) {
      case 'hit':        this._playHit();        break;
      case 'enemyDeath': this._playEnemyDeath(); break;
      case 'playerHit':  this._playPlayerHit();  break;
      case 'pickup':     this._playPickup();      break;
      case 'levelup':    this._playLevelUp();     break;
    }
  }

  destroy() {
    if (this._resumeHandler) {
      document.removeEventListener('click',   this._resumeHandler);
      document.removeEventListener('keydown', this._resumeHandler);
      this._resumeHandler = null;
    }
    if (this._ctx) { this._ctx.close(); this._ctx = null; }
    this._enabled = false;
  }

  _playHit() { this._tone(900, 0.04, 'square', 0.12); }

  _playEnemyDeath() {
    const t = this._ctx.currentTime;
    const osc = this._makeOsc('sawtooth', 320);
    const gain = this._makeGain(this._masterVolume * 0.35);
    osc.connect(gain); gain.connect(this._ctx.destination);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t); osc.stop(t + 0.18);
  }

  _playPlayerHit() {
    const t = this._ctx.currentTime;
    const osc = this._makeOsc('sine', 110);
    const gain = this._makeGain(this._masterVolume * 0.55);
    osc.connect(gain); gain.connect(this._ctx.destination);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.start(t); osc.stop(t + 0.22);
  }

  _playPickup() {
    const t = this._ctx.currentTime;
    const osc = this._makeOsc('sine', 620);
    const gain = this._makeGain(this._masterVolume * 0.18);
    osc.connect(gain); gain.connect(this._ctx.destination);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
  }

  _playLevelUp() {
    const t = this._ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc  = this._makeOsc('sine', freq);
      const gain = this._makeGain(this._masterVolume * 0.28);
      osc.connect(gain); gain.connect(this._ctx.destination);
      const start = t + i * 0.09;
      gain.gain.setValueAtTime(this._masterVolume * 0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.start(start); osc.stop(start + 0.45);
    });
  }

  _tone(frequency, duration, type = 'sine', volume = 0.2) {
    const t    = this._ctx.currentTime;
    const osc  = this._makeOsc(type, frequency);
    const gain = this._makeGain(volume * this._masterVolume);
    osc.connect(gain); gain.connect(this._ctx.destination);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t); osc.stop(t + duration);
  }

  _makeOsc(type, frequency) {
    const osc = this._ctx.createOscillator();
    osc.type = type; osc.frequency.value = frequency;
    return osc;
  }

  _makeGain(value) {
    const gain = this._ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.001, value), this._ctx.currentTime);
    return gain;
  }
}
