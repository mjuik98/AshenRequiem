/**
 * SoundSystem — Web Audio API 기반 절차적 사운드
 *
 * CHANGE(Settings): 볼륨 조절 기능 추가
 *   - _masterVol, _bgmVol, _sfxVol 필드 추가
 *   - setVolume(master, bgm, sfx) 메서드 추가
 *   - _beep()에서 sfx × master 배율 적용
 *   - setEnabled(enabled) 메서드 추가 (NullSoundSystem 인터페이스 통일)
 *
 * CHANGE(P1-E): processEvents() 사문화 메서드 삭제 (기존)
 */
export class SoundSystem {
  constructor() {
    this._ctx          = null;
    this._enabled      = true;
    this._musicEnabled = true;
    this._bgm          = null;
    // ── 볼륨 배율 (0.0 ~ 1.0) ────────────────────────────────────────────
    this._masterVol = 0.8;   // session.options.masterVolume / 100
    this._bgmVol    = 0.6;   // session.options.bgmVolume    / 100
    this._sfxVol    = 1.0;   // session.options.sfxVolume    / 100
  }

  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      console.warn('[SoundSystem] AudioContext 미지원 — 사운드 비활성화');
      this._enabled = false;
    }
  }

  // ── 볼륨 / 활성화 ──────────────────────────────────────────────────────────

  /**
   * 마스터·BGM·SFX 볼륨 배율을 설정한다.
   * PlayScene.enter()에서 session.options 기반으로 호출된다.
   *
   * @param {number} master  0.0 ~ 1.0 (session.options.masterVolume / 100)
   * @param {number} bgm     0.0 ~ 1.0 (session.options.bgmVolume    / 100)
   * @param {number} sfx     0.0 ~ 1.0 (session.options.sfxVolume    / 100)
   */
  setVolume(master = 0.8, bgm = 0.6, sfx = 1.0) {
    this._masterVol = Math.max(0, Math.min(1, master));
    this._bgmVol    = Math.max(0, Math.min(1, bgm));
    this._sfxVol    = Math.max(0, Math.min(1, sfx));

    if (this._bgm?.gain) {
      this._bgm.gain.gain.setValueAtTime(this._getBgmOutputVolume(), this._ctx?.currentTime ?? 0);
    }
  }

  /**
   * 효과음 활성화 여부를 설정한다.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this._enabled = enabled;
  }

  setMusicEnabled(enabled) {
    this._musicEnabled = enabled !== false;

    if (!this._musicEnabled) {
      this.stopBgm();
      return;
    }

    if (this._bgm?.gain && this._ctx) {
      this._bgm.gain.gain.setValueAtTime(this._getBgmOutputVolume(), this._ctx.currentTime);
    }
  }

  get isEnabled() { return this._enabled; }

  // ── 재생 ──────────────────────────────────────────────────────────────────

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

  playBgm(id = 'default') {
    if (!this._ctx || !this._musicEnabled) return;
    if (this._ctx.state === 'suspended') this._ctx.resume();

    if (this._bgm?.id === id) return;
    this.stopBgm();

    const ctx = this._ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this._getBgmOutputVolume(), ctx.currentTime);
    gain.connect(ctx.destination);

    const baseFreqMap = {
      title: 196,
      battle: 164.81,
      boss: 130.81,
      default: 174.61,
    };
    const baseFreq = baseFreqMap[id] ?? baseFreqMap.default;

    const oscA = ctx.createOscillator();
    oscA.type = 'triangle';
    oscA.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    const oscB = ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime);

    oscA.connect(gain);
    oscB.connect(gain);
    oscA.start(ctx.currentTime);
    oscB.start(ctx.currentTime);

    this._bgm = { id, gain, oscillators: [oscA, oscB] };
  }

  stopBgm() {
    if (!this._bgm) return;

    for (const osc of this._bgm.oscillators ?? []) {
      try { osc.stop(); } catch {}
      try { osc.disconnect(); } catch {}
    }
    try { this._bgm.gain?.disconnect(); } catch {}
    this._bgm = null;
  }

  // ── 내부 ──────────────────────────────────────────────────────────────────

  _beep(freq, duration, type, volume) {
    const ctx  = this._ctx;
    if (!ctx) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // sfx 볼륨 × 마스터 볼륨 배율 적용
    const effectiveVol = volume * this._sfxVol * this._masterVol;
    gain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  _chord(freqs, duration, type, volume) {
    freqs.forEach((f, i) => {
      setTimeout(() => {
        if (!this._ctx || !this._enabled) return;
        this._beep(f, duration, type, volume * 0.7);
      }, i * 60);
    });
  }

  _getBgmOutputVolume() {
    if (!this._musicEnabled) return 0;
    return 0.04 * this._bgmVol * this._masterVol;
  }

  destroy() {
    this.stopBgm();
    if (this._ctx) {
      this._ctx.close().catch(() => {});
      this._ctx = null;
    }
  }
}
