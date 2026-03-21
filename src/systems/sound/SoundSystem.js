/**
 * SoundSystem — Web Audio API 기반 절차적 사운드 엔진 (리팩터링 버전)
 *
 * 개선 사항
 * - master / bgm / sfx 버스 구조
 * - compressor + limiter 성격의 마스터 다이내믹 제어
 * - click/pop 방지를 위한 envelope(attack/release)
 * - AudioContext 시간축 기반 정밀 스케줄링
 * - 타입별 쿨다운 / 동시 발음 수 제한
 * - StereoPanner 기반 위치감 부여
 * - 중요 SFX 재생 시 BGM ducking
 * - BGM crossfade 전환
 * - 노드 정리(cleanup) 강화
 * - 사용자 입력 후 오디오 활성화를 위한 unlock() 제공
 *
 * 기존 호환 메서드
 * - init()
 * - setVolume(master, bgm, sfx)
 * - setEnabled(enabled)
 * - setMusicEnabled(enabled)
 * - play(type, options?)
 * - playBgm(id = 'default')
 * - stopBgm(fadeOut = 0.12)
 * - destroy()
 */
export class SoundSystem {
  constructor() {
    this._ctx = null;

    this._enabled = true;
    this._musicEnabled = true;
    this._unlocked = false;

    // 사용자 옵션 볼륨 (0.0 ~ 1.0)
    this._masterVol = 0.8;
    this._bgmVol = 0.6;
    this._sfxVol = 1.0;

    // 버스
    this._masterBus = null;
    this._bgmBus = null;
    this._sfxBus = null;
    this._compressor = null;

    // 현재 BGM 상태
    this._bgm = null;

    // 동시 발음 / 중복 제어
    this._lastPlayAt = new Map();
    this._activeVoices = new Set();
    this._activeVoicesByType = new Map();
    this._maxVoices = 32;

    // 기본 효과음 정의
    this._sfxDefs = {
      hit: {
        kind: 'beep',
        freq: 440,
        duration: 0.05,
        type: 'square',
        volume: 0.08,
        cooldown: 0.018,
        maxPolyphony: 6,
        randomDetune: 0.03,
        randomVolume: 0.08,
        duck: 0,
      },
      death: {
        kind: 'beep',
        freq: 200,
        duration: 0.14,
        type: 'sawtooth',
        volume: 0.16,
        cooldown: 0.08,
        maxPolyphony: 2,
        randomDetune: 0.02,
        randomVolume: 0.05,
        duck: 0.2,
      },
      levelup: {
        kind: 'chord',
        freqs: [523.25, 659.25, 783.99],
        duration: 0.20,
        type: 'sine',
        volume: 0.18,
        cooldown: 0.25,
        maxPolyphony: 1,
        randomDetune: 0.01,
        randomVolume: 0.03,
        step: 0.06,
        duck: 0.45,
      },
      pickup: {
        kind: 'beep',
        freq: 880,
        duration: 0.04,
        type: 'sine',
        volume: 0.06,
        cooldown: 0.025,
        maxPolyphony: 4,
        randomDetune: 0.05,
        randomVolume: 0.10,
        duck: 0,
      },
      damage: {
        kind: 'beep',
        freq: 180,
        duration: 0.08,
        type: 'sawtooth',
        volume: 0.10,
        cooldown: 0.06,
        maxPolyphony: 3,
        randomDetune: 0.025,
        randomVolume: 0.05,
        duck: 0.12,
      },
    };

    // 기본 BGM 정의
    this._bgmDefs = {
      title: {
        baseFreq: 196.0,
        interval: 1.5,
        waveA: 'triangle',
        waveB: 'sine',
        lfoRate: 0.08,
        lfoDepth: 5,
      },
      battle: {
        baseFreq: 164.81,
        interval: 1.5,
        waveA: 'triangle',
        waveB: 'square',
        lfoRate: 0.11,
        lfoDepth: 7,
      },
      boss: {
        baseFreq: 130.81,
        interval: 1.498,
        waveA: 'sawtooth',
        waveB: 'triangle',
        lfoRate: 0.16,
        lfoDepth: 10,
      },
      default: {
        baseFreq: 174.61,
        interval: 1.5,
        waveA: 'triangle',
        waveB: 'sine',
        lfoRate: 0.09,
        lfoDepth: 6,
      },
    };
  }

  init() {
    if (this._ctx) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this._ctx = new AudioCtx();
      this._createAudioGraph();
      this._syncVolumes(0);
    } catch {
      console.warn('[SoundSystem] AudioContext 미지원 — 사운드 비활성화');
      this._enabled = false;
      this._ctx = null;
    }
  }

  /**
   * 브라우저 autoplay 정책 대응용.
   * 클릭/키입력 같은 사용자 액션에서 한 번 호출하면 좋다.
   */
  async unlock() {
    if (!this._ctx) this.init();
    if (!this._ctx) return false;

    try {
      if (this._ctx.state === 'suspended') {
        await this._ctx.resume();
      }
      this._unlocked = this._ctx.state === 'running';
      return this._unlocked;
    } catch {
      return false;
    }
  }

  // ── 볼륨 / 활성화 ───────────────────────────────────────────────────────

  setVolume(master = 0.8, bgm = 0.6, sfx = 1.0) {
    this._masterVol = this._clamp01(master);
    this._bgmVol = this._clamp01(bgm);
    this._sfxVol = this._clamp01(sfx);

    if (!this._ctx) return;
    this._syncVolumes(0.03);
  }

  setEnabled(enabled) {
    this._enabled = enabled !== false;
    if (!this._ctx) return;

    const t = this._ctx.currentTime;
    const target = this._enabled ? this._masterVol : 0;
    this._safeParamCancel(this._masterBus?.gain, t);
    this._masterBus?.gain.setValueAtTime(this._masterBus.gain.value, t);
    this._masterBus?.gain.linearRampToValueAtTime(target, t + 0.03);
  }

  setMusicEnabled(enabled) {
    this._musicEnabled = enabled !== false;
    if (!this._ctx || !this._bgmBus) return;

    const t = this._ctx.currentTime;
    const target = this._getBgmBusTargetVolume();
    this._safeParamCancel(this._bgmBus.gain, t);
    this._bgmBus.gain.setValueAtTime(this._bgmBus.gain.value, t);
    this._bgmBus.gain.linearRampToValueAtTime(target, t + 0.08);

    if (!this._musicEnabled) {
      this.stopBgm(0.12);
    }
  }

  get isEnabled() {
    return this._enabled;
  }

  // ── 재생 API ───────────────────────────────────────────────────────────

  /**
   * @param {string} type
   * @param {{ pan?: number, intensity?: number, detune?: number, volume?: number }} [options]
   */
  play(type, options = {}) {
    if (!this._enabled || !this._ctx) return;
    if (!this._ensurePlayable()) return;

    const def = this._sfxDefs[type];
    if (!def) return;
    if (!this._canPlayType(type, def)) return;

    const intensity = Number.isFinite(options.intensity) ? Math.max(0.25, options.intensity) : 1;
    const extraVolume = Number.isFinite(options.volume) ? Math.max(0, options.volume) : 1;
    const pan = this._clamp(options.pan ?? 0, -1, 1);
    const extraDetune = Number.isFinite(options.detune) ? options.detune : 0;

    if (def.duck > 0) {
      this._duckBgm(def.duck, 0.02, Math.max(0.12, def.duration + 0.12));
    }

    if (def.kind === 'beep') {
      this._beep({
        typeName: type,
        freq: def.freq,
        duration: def.duration,
        wave: def.type,
        volume: def.volume * extraVolume,
        pan,
        intensity,
        randomDetune: def.randomDetune,
        randomVolume: def.randomVolume,
        extraDetune,
      });
      return;
    }

    if (def.kind === 'chord') {
      this._chord({
        typeName: type,
        freqs: def.freqs,
        duration: def.duration,
        wave: def.type,
        volume: def.volume * extraVolume,
        pan,
        intensity,
        step: def.step ?? 0.06,
        randomDetune: def.randomDetune,
        randomVolume: def.randomVolume,
        extraDetune,
      });
    }
  }

  playBgm(id = 'default') {
    if (!this._ctx || !this._musicEnabled) return;
    if (!this._ensurePlayable()) return;
    if (this._bgm?.id === id) return;

    const def = this._bgmDefs[id] ?? this._bgmDefs.default;
    const next = this._createBgmVoice(id, def);
    if (!next) return;

    const t = this._ctx.currentTime;
    const fadeIn = 0.45;
    const fadeOut = 0.35;
    const targetGain = 1.0;

    next.output.gain.setValueAtTime(0.0001, t);
    next.output.gain.exponentialRampToValueAtTime(targetGain, t + fadeIn);

    const prev = this._bgm;
    this._bgm = next;

    if (prev?.output) {
      this._safeParamCancel(prev.output.gain, t);
      prev.output.gain.setValueAtTime(Math.max(prev.output.gain.value, 0.0001), t);
      prev.output.gain.exponentialRampToValueAtTime(0.0001, t + fadeOut);
      this._disposeBgm(prev, fadeOut + 0.02);
    }
  }

  stopBgm(fadeOut = 0.12) {
    if (!this._ctx || !this._bgm) {
      this._bgm = null;
      return;
    }

    const bgm = this._bgm;
    this._bgm = null;

    const t = this._ctx.currentTime;
    if (bgm.output?.gain) {
      this._safeParamCancel(bgm.output.gain, t);
      bgm.output.gain.setValueAtTime(Math.max(bgm.output.gain.value, 0.0001), t);
      bgm.output.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.01, fadeOut));
    }

    this._disposeBgm(bgm, Math.max(0.02, fadeOut) + 0.02);
  }

  stopAllSfx(fadeOut = 0.04) {
    if (!this._ctx || !this._sfxBus) return;

    const t = this._ctx.currentTime;
    const restore = this._getSfxBusTargetVolume();

    this._safeParamCancel(this._sfxBus.gain, t);
    this._sfxBus.gain.setValueAtTime(Math.max(this._sfxBus.gain.value, 0.0001), t);
    this._sfxBus.gain.linearRampToValueAtTime(0.0001, t + Math.max(0.01, fadeOut));
    this._sfxBus.gain.linearRampToValueAtTime(restore, t + Math.max(0.02, fadeOut + 0.03));
  }

  // ── 내부 오디오 그래프 ──────────────────────────────────────────────────

  _createAudioGraph() {
    const ctx = this._ctx;
    if (!ctx) return;

    this._masterBus = ctx.createGain();
    this._bgmBus = ctx.createGain();
    this._sfxBus = ctx.createGain();
    this._compressor = ctx.createDynamicsCompressor();

    // 너무 큰 피크를 부드럽게 눌러주는 설정
    this._compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    this._compressor.knee.setValueAtTime(18, ctx.currentTime);
    this._compressor.ratio.setValueAtTime(8, ctx.currentTime);
    this._compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this._compressor.release.setValueAtTime(0.15, ctx.currentTime);

    this._bgmBus.connect(this._masterBus);
    this._sfxBus.connect(this._masterBus);
    this._masterBus.connect(this._compressor);
    this._compressor.connect(ctx.destination);
  }

  _syncVolumes(ramp = 0.03) {
    if (!this._ctx || !this._masterBus || !this._bgmBus || !this._sfxBus) return;

    const t = this._ctx.currentTime;

    this._rampParam(this._masterBus.gain, this._enabled ? this._masterVol : 0, t, ramp);
    this._rampParam(this._bgmBus.gain, this._getBgmBusTargetVolume(), t, Math.max(ramp, 0.05));
    this._rampParam(this._sfxBus.gain, this._getSfxBusTargetVolume(), t, ramp);
  }

  _getBgmBusTargetVolume() {
    if (!this._musicEnabled) return 0.0001;
    return Math.max(0.0001, this._bgmVol);
  }

  _getSfxBusTargetVolume() {
    return Math.max(0.0001, this._sfxVol);
  }

  _ensurePlayable() {
    if (!this._ctx) return false;
    if (this._ctx.state === 'closed') return false;

    // suspended 상태여도 사용자 입력 직후라면 브라우저가 허용해 줄 수 있음.
    // 다만 실패해도 예외 전파 없이 조용히 빠진다.
    if (this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
    return true;
  }

  _canPlayType(type, def) {
    const now = performance.now() / 1000;
    const cooldown = def.cooldown ?? 0;
    const lastAt = this._lastPlayAt.get(type) ?? -Infinity;

    if (now - lastAt < cooldown) {
      return false;
    }

    const activeCount = this._activeVoicesByType.get(type) ?? 0;
    if (activeCount >= (def.maxPolyphony ?? 4)) {
      return false;
    }

    if (this._activeVoices.size >= this._maxVoices) {
      return false;
    }

    this._lastPlayAt.set(type, now);
    return true;
  }

  _beep({
    typeName,
    freq,
    duration,
    wave,
    volume,
    pan = 0,
    intensity = 1,
    randomDetune = 0,
    randomVolume = 0,
    extraDetune = 0,
    startTime = null,
  }) {
    const ctx = this._ctx;
    if (!ctx || !this._sfxBus) return;

    const t = startTime ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = this._createPanner(pan);

    const voiceId = Symbol(typeName);
    this._registerVoice(voiceId, typeName);

    const detuneMul = 1 + this._randomSpread(randomDetune);
    const volMul = 1 + this._randomSpread(randomVolume);
    const effectiveFreq = Math.max(20, freq * detuneMul * (1 + extraDetune));
    const effectiveVol = Math.max(0.0001, volume * intensity * volMul);

    const attack = Math.min(0.005, duration * 0.25);
    const release = Math.min(0.05, Math.max(0.015, duration * 0.45));
    const sustainEnd = Math.max(t + attack, t + duration - release);
    const stopAt = t + duration + 0.01;

    osc.type = wave;
    osc.frequency.setValueAtTime(effectiveFreq, t);

    // 아주 짧은 pitch drop / rise를 섞으면 단조로운 반복음을 줄이는 데 도움이 된다.
    osc.frequency.linearRampToValueAtTime(effectiveFreq * 0.995, t + Math.min(0.02, duration * 0.5));

    osc.connect(gain);
    if (panner) {
      gain.connect(panner);
      panner.connect(this._sfxBus);
    } else {
      gain.connect(this._sfxBus);
    }

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(effectiveVol, t + attack);
    gain.gain.setValueAtTime(effectiveVol, sustainEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.start(t);
    osc.stop(stopAt);

    osc.onended = () => {
      this._unregisterVoice(voiceId, typeName);
      this._disconnectSafely(osc, gain, panner);
    };
  }

  _chord({
    typeName,
    freqs,
    duration,
    wave,
    volume,
    pan = 0,
    intensity = 1,
    step = 0.06,
    randomDetune = 0,
    randomVolume = 0,
    extraDetune = 0,
  }) {
    const ctx = this._ctx;
    if (!ctx) return;

    const start = ctx.currentTime;
    freqs.forEach((freq, index) => {
      this._beep({
        typeName,
        freq,
        duration,
        wave,
        volume: volume * 0.72,
        pan,
        intensity,
        randomDetune,
        randomVolume,
        extraDetune,
        startTime: start + index * step,
      });
    });
  }

  _createBgmVoice(id, def) {
    const ctx = this._ctx;
    if (!ctx || !this._bgmBus) return null;

    const output = ctx.createGain();
    const toneGainA = ctx.createGain();
    const toneGainB = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(id === 'boss' ? 1100 : 1800, ctx.currentTime);
    filter.Q.setValueAtTime(0.5, ctx.currentTime);

    output.connect(filter);
    filter.connect(this._bgmBus);

    const oscA = ctx.createOscillator();
    oscA.type = def.waveA;
    oscA.frequency.setValueAtTime(def.baseFreq, ctx.currentTime);

    const oscB = ctx.createOscillator();
    oscB.type = def.waveB;
    oscB.frequency.setValueAtTime(def.baseFreq * def.interval, ctx.currentTime);

    toneGainA.gain.setValueAtTime(0.55, ctx.currentTime);
    toneGainB.gain.setValueAtTime(0.25, ctx.currentTime);

    oscA.connect(toneGainA);
    oscB.connect(toneGainB);
    toneGainA.connect(output);
    toneGainB.connect(output);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(def.lfoRate, ctx.currentTime);
    lfoDepth.gain.setValueAtTime(def.lfoDepth, ctx.currentTime);
    lfo.connect(lfoDepth);
    lfoDepth.connect(oscA.frequency);

    oscA.start(ctx.currentTime);
    oscB.start(ctx.currentTime);
    lfo.start(ctx.currentTime);

    return {
      id,
      output,
      filter,
      lfo,
      lfoDepth,
      oscillators: [oscA, oscB],
      gains: [toneGainA, toneGainB],
    };
  }

  _disposeBgm(bgm, afterSeconds = 0.02) {
    if (!this._ctx || !bgm) return;
    const stopAt = this._ctx.currentTime + Math.max(0.01, afterSeconds);

    for (const osc of bgm.oscillators ?? []) {
      try { osc.stop(stopAt); } catch {}
    }
    try { bgm.lfo?.stop(stopAt); } catch {}

    const delayMs = Math.ceil((afterSeconds + 0.05) * 1000);
    window.setTimeout(() => {
      this._disconnectSafely(
        ...(bgm.oscillators ?? []),
        ...(bgm.gains ?? []),
        bgm.lfo,
        bgm.lfoDepth,
        bgm.filter,
        bgm.output,
      );
    }, delayMs);
  }

  _duckBgm(amount = 0.25, attack = 0.02, hold = 0.2) {
    if (!this._ctx || !this._bgmBus || !this._musicEnabled) return;

    const t = this._ctx.currentTime;
    const currentTarget = this._getBgmBusTargetVolume();
    const ducked = Math.max(0.0001, currentTarget * (1 - this._clamp01(amount)));

    this._safeParamCancel(this._bgmBus.gain, t);
    this._bgmBus.gain.setValueAtTime(Math.max(this._bgmBus.gain.value, 0.0001), t);
    this._bgmBus.gain.linearRampToValueAtTime(ducked, t + Math.max(0.005, attack));
    this._bgmBus.gain.linearRampToValueAtTime(currentTarget, t + Math.max(0.03, hold));
  }

  _createPanner(pan) {
    const ctx = this._ctx;
    if (!ctx || typeof ctx.createStereoPanner !== 'function') return null;

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(this._clamp(pan, -1, 1), ctx.currentTime);
    return panner;
  }

  _registerVoice(voiceId, typeName) {
    this._activeVoices.add(voiceId);
    this._activeVoicesByType.set(typeName, (this._activeVoicesByType.get(typeName) ?? 0) + 1);
  }

  _unregisterVoice(voiceId, typeName) {
    this._activeVoices.delete(voiceId);
    const current = this._activeVoicesByType.get(typeName) ?? 0;
    const next = Math.max(0, current - 1);
    if (next === 0) {
      this._activeVoicesByType.delete(typeName);
    } else {
      this._activeVoicesByType.set(typeName, next);
    }
  }

  _rampParam(param, value, time, rampSeconds) {
    if (!param) return;
    const safeValue = Math.max(0.0001, value);
    this._safeParamCancel(param, time);
    param.setValueAtTime(Math.max(param.value, 0.0001), time);
    if (rampSeconds <= 0) {
      param.setValueAtTime(safeValue, time);
      return;
    }
    param.linearRampToValueAtTime(safeValue, time + rampSeconds);
  }

  _safeParamCancel(param, time) {
    if (!param) return;
    try { param.cancelScheduledValues(time); } catch {}
  }

  _disconnectSafely(...nodes) {
    for (const node of nodes) {
      if (!node) continue;
      try { node.disconnect(); } catch {}
    }
  }

  _randomSpread(amount) {
    if (!amount) return 0;
    return (Math.random() * 2 - 1) * amount;
  }

  _clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  _clamp01(value) {
    return this._clamp(Number(value) || 0, 0, 1);
  }

  destroy() {
    this.stopBgm(0.05);
    this._activeVoices.clear();
    this._activeVoicesByType.clear();

    if (this._ctx) {
      try { this._masterBus?.disconnect(); } catch {}
      try { this._bgmBus?.disconnect(); } catch {}
      try { this._sfxBus?.disconnect(); } catch {}
      try { this._compressor?.disconnect(); } catch {}

      this._ctx.close().catch(() => {});
    }

    this._ctx = null;
    this._masterBus = null;
    this._bgmBus = null;
    this._sfxBus = null;
    this._compressor = null;
    this._bgm = null;
    this._unlocked = false;
  }
}
