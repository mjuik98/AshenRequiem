/**
 * SoundSystem — Web Audio API 기반 절차적 효과음
 *
 * 외부 오디오 파일 없이 순수 Web Audio API로 효과음을 생성한다.
 * 브라우저 정책상 사용자 인터랙션 전 AudioContext는 suspended 상태이므로,
 * 첫 클릭/키 입력 시 자동 resume 한다.
 *
 * processEvents(events) 를 매 프레임 호출하면 hit·death·pickup 사운드를 자동 재생한다.
 */
export class SoundSystem {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;
    this._enabled = false;
    this._masterVolume = 0.25;

    // 동일 사운드 최소 재생 간격 (초) — 프레임당 수백 번 호출 방지
    this._minInterval = 0.05;
    /** @type {Map<string, number>} soundId → 마지막 재생 시각 (ctx.currentTime) */
    this._cooldowns = new Map();
  }

  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._enabled = true;

      // 브라우저 자동재생 정책: 첫 인터랙션에서 resume
      // ③ destroy() 시 정리할 수 있도록 바인딩 참조를 인스턴스에 보관
      this._resumeHandler = () => {
        if (this._ctx && this._ctx.state === 'suspended') {
          this._ctx.resume();
        }
      };
      document.addEventListener('click',   this._resumeHandler, { once: true });
      document.addEventListener('keydown', this._resumeHandler, { once: true });
    } catch (e) {
      console.warn('SoundSystem: Web Audio API 사용 불가', e);
    }
  }

  /**
   * 매 프레임 호출 — events를 읽어 해당 사운드 재생
   * @param {{ hits, deaths, pickupCollected }} events
   */
  processEvents(events) {
    if (!this._enabled) return;

    let hasEnemyHit = false;
    let hasPlayerHit = false;

    for (let i = 0; i < events.hits.length; i++) {
      const hit = events.hits[i];
      if (hit.target?.type === 'enemy') hasEnemyHit = true;
      if (hit.target?.type === 'player') hasPlayerHit = true;
    }

    if (hasEnemyHit)  this.play('hit');
    if (hasPlayerHit) this.play('playerHit');
    if (events.deaths.length > 0)          this.play('enemyDeath');
    if (events.pickupCollected.length > 0) this.play('pickup');
  }

  /**
   * 사운드 ID로 직접 재생
   * @param {'hit'|'enemyDeath'|'playerHit'|'pickup'|'levelup'} soundId
   */
  play(soundId) {
    if (!this._enabled || !this._ctx) return;

    const now = this._ctx.currentTime;
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
    // ③ resume 리스너가 아직 발동 전이라면 정리
    if (this._resumeHandler) {
      document.removeEventListener('click',   this._resumeHandler);
      document.removeEventListener('keydown', this._resumeHandler);
      this._resumeHandler = null;
    }
    if (this._ctx) {
      this._ctx.close();
      this._ctx = null;
    }
    this._enabled = false;
  }

  // ─── 절차적 사운드 정의 ───

  /** 적 피격: 짧고 날카로운 클릭 */
  _playHit() {
    this._tone(900, 0.04, 'square', 0.12);
  }

  /** 적 사망: 하강하는 톱니파 */
  _playEnemyDeath() {
    const t = this._ctx.currentTime;
    const osc = this._makeOsc('sawtooth', 320);
    const gain = this._makeGain(this._masterVolume * 0.35);
    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  /** 플레이어 피격: 낮고 둔탁한 충격음 */
  _playPlayerHit() {
    const t = this._ctx.currentTime;
    const osc = this._makeOsc('sine', 110);
    const gain = this._makeGain(this._masterVolume * 0.55);
    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /** 픽업: 짧게 올라가는 차임 */
  _playPickup() {
    const t = this._ctx.currentTime;
    const osc = this._makeOsc('sine', 620);
    const gain = this._makeGain(this._masterVolume * 0.18);
    osc.connect(gain);
    gain.connect(this._ctx.destination);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** 레벨업: C-E-G 상승 코드 */
  _playLevelUp() {
    const t = this._ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = this._makeOsc('sine', freq);
      const gain = this._makeGain(this._masterVolume * 0.28);
      osc.connect(gain);
      gain.connect(this._ctx.destination);
      const start = t + i * 0.09;
      gain.gain.setValueAtTime(this._masterVolume * 0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  // ─── 헬퍼 ───

  _tone(frequency, duration, type = 'sine', volume = 0.2) {
    const t = this._ctx.currentTime;
    const osc = this._makeOsc(type, frequency);
    const gain = this._makeGain(volume * this._masterVolume);
    osc.connect(gain);
    gain.connect(this._ctx.destination);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  }

  _makeOsc(type, frequency) {
    const osc = this._ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    return osc;
  }

  _makeGain(value) {
    const gain = this._ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.001, value), this._ctx.currentTime);
    return gain;
  }
}
