import { cloneSoundBgmDefs, cloneSoundSfxDefs } from './soundDefinitions.js';
import {
  cancelScheduledSoundParam,
  syncSoundBusVolumes,
} from './soundBusRuntime.js';
import {
  getBgmTargetVolume,
  getSfxTargetVolume,
} from './soundPlaybackPolicy.js';
import {
  applySoundEnabledState,
  applySoundMusicEnabledState,
  applySoundVolumeSettings,
  createSoundSystemState,
} from './soundSystemState.js';
import {
  destroySoundSystemContext,
  initSoundSystemContext,
  unlockSoundSystemContext,
} from './soundSystemLifecycle.js';
import {
  stopAllSoundEffects,
} from './soundPlaybackController.js';
import { playSoundBgm, stopSoundBgm } from './soundBgmController.js';
import { playSoundEffect } from './soundSfxController.js';

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
    Object.assign(this, createSoundSystemState({
      sfxDefs: cloneSoundSfxDefs(),
      bgmDefs: cloneSoundBgmDefs(),
    }));
  }

  init() {
    initSoundSystemContext(this);
  }

  /**
   * 브라우저 autoplay 정책 대응용.
   * 클릭/키입력 같은 사용자 액션에서 한 번 호출하면 좋다.
   */
  async unlock() {
    return unlockSoundSystemContext(this, {
      initContext: () => this.init(),
    });
  }

  // ── 볼륨 / 활성화 ───────────────────────────────────────────────────────

  setVolume(master = 0.8, bgm = 0.6, sfx = 1.0) {
    applySoundVolumeSettings(this, master, bgm, sfx);

    if (!this._ctx) return;
    this._syncVolumes(0.03);
  }

  setEnabled(enabled) {
    applySoundEnabledState(this, enabled);
    if (!this._ctx) return;

    const t = this._ctx.currentTime;
    const target = this._enabled ? this._masterVol : 0;
    cancelScheduledSoundParam(this._masterBus?.gain, t);
    this._masterBus?.gain.setValueAtTime(this._masterBus.gain.value, t);
    this._masterBus?.gain.linearRampToValueAtTime(target, t + 0.03);
  }

  setMusicEnabled(enabled) {
    applySoundMusicEnabledState(this, enabled);
    if (!this._ctx || !this._bgmBus) return;

    const t = this._ctx.currentTime;
    const target = this._getBgmBusTargetVolume();
    cancelScheduledSoundParam(this._bgmBus.gain, t);
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
    playSoundEffect(this, type, options);
  }

  playBgm(id = 'default') {
    playSoundBgm(this, id);
  }

  stopBgm(fadeOut = 0.12) {
    stopSoundBgm(this, fadeOut);
  }

  stopAllSfx(fadeOut = 0.04) {
    stopAllSoundEffects(this, fadeOut);
  }

  // ── 내부 오디오 그래프 ──────────────────────────────────────────────────

  _syncVolumes(ramp = 0.03) {
    syncSoundBusVolumes({
      ctx: this._ctx,
      masterBus: this._masterBus,
      bgmBus: this._bgmBus,
      sfxBus: this._sfxBus,
      masterTarget: this._enabled ? this._masterVol : 0,
      bgmTarget: this._getBgmBusTargetVolume(),
      sfxTarget: this._getSfxBusTargetVolume(),
      ramp,
    });
  }

  _getBgmBusTargetVolume() {
    return getBgmTargetVolume(this._musicEnabled, this._bgmVol);
  }

  _getSfxBusTargetVolume() {
    return getSfxTargetVolume(this._sfxVol);
  }

  destroy() {
    destroySoundSystemContext(this);
  }
}
