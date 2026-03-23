import {
  clampSoundUnit,
  clampSoundValue,
  createStereoPanner,
  disconnectSoundNodes,
  duckBgmBus,
  fadeSfxBus,
  randomSoundSpread,
} from './soundBusRuntime.js';
import {
  canPlaySoundType,
  getDuckedBgmVolume,
} from './soundPlaybackPolicy.js';
import { ensureSoundContextPlayable } from './soundPlaybackRuntime.js';
import {
  registerSoundVoice,
  unregisterSoundVoice,
} from './soundVoiceState.js';
import {
  scheduleBeepVoice,
  scheduleChordVoice,
} from './soundVoices.js';

function canPlaySoundEffect(target, type, def) {
  const now = performance.now() / 1000;
  const canPlay = canPlaySoundType(type, {
    def,
    nowSeconds: now,
    lastPlayAt: target._lastPlayAt,
    activeVoicesByType: target._activeVoicesByType,
    activeVoiceCount: target._activeVoices.size,
    maxVoices: target._maxVoices,
  });

  if (!canPlay) {
    return false;
  }

  target._lastPlayAt.set(type, now);
  return true;
}

function registerVoice(target, voiceId, typeName) {
  registerSoundVoice(target._activeVoices, target._activeVoicesByType, voiceId, typeName);
}

function unregisterVoice(target, voiceId, typeName) {
  unregisterSoundVoice(target._activeVoices, target._activeVoicesByType, voiceId, typeName);
}

function scheduleBeep(target, options) {
  scheduleBeepVoice({
    ctx: target._ctx,
    sfxBus: target._sfxBus,
    ...options,
    createPanner: (value) => createStereoPanner(target._ctx, value),
    registerVoice: (voiceId, typeName) => registerVoice(target, voiceId, typeName),
    unregisterVoice: (voiceId, typeName) => unregisterVoice(target, voiceId, typeName),
    disconnectSafely: (...nodes) => disconnectSoundNodes(...nodes),
    randomSpread: (amount) => randomSoundSpread(amount),
  });
}

function scheduleChord(target, options) {
  scheduleChordVoice({
    ctx: target._ctx,
    sfxBus: target._sfxBus,
    ...options,
    createPanner: (value) => createStereoPanner(target._ctx, value),
    registerVoice: (voiceId, typeName) => registerVoice(target, voiceId, typeName),
    unregisterVoice: (voiceId, typeName) => unregisterVoice(target, voiceId, typeName),
    disconnectSafely: (...nodes) => disconnectSoundNodes(...nodes),
    randomSpread: (amount) => randomSoundSpread(amount),
  });
}

export function playSoundEffect(target, type, options = {}) {
  if (!target._enabled || !target._ctx) return;
  if (!ensureSoundContextPlayable(target._ctx)) return;

  const def = target._sfxDefs[type];
  if (!def) return;
  if (!canPlaySoundEffect(target, type, def)) return;

  const intensity = Number.isFinite(options.intensity) ? Math.max(0.25, options.intensity) : 1;
  const extraVolume = Number.isFinite(options.volume) ? Math.max(0, options.volume) : 1;
  const pan = clampSoundValue(options.pan ?? 0, -1, 1);
  const extraDetune = Number.isFinite(options.detune) ? options.detune : 0;

  if (def.duck > 0) {
    duckBgmBus({
      ctx: target._ctx,
      bgmBus: target._bgmBus,
      musicEnabled: target._musicEnabled,
      bgmTarget: target._getBgmBusTargetVolume(),
      duckedVolume: getDuckedBgmVolume(target._getBgmBusTargetVolume(), clampSoundUnit(def.duck)),
      amount: def.duck,
      attack: 0.02,
      hold: Math.max(0.12, def.duration + 0.12),
    });
  }

  if (def.kind === 'beep') {
    scheduleBeep(target, {
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
    scheduleChord(target, {
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

export function stopAllSoundEffects(target, fadeOut = 0.04) {
  if (!target._ctx || !target._sfxBus) return;
  fadeSfxBus({
    ctx: target._ctx,
    sfxBus: target._sfxBus,
    restoreVolume: target._getSfxBusTargetVolume(),
    fadeOut,
  });
}
