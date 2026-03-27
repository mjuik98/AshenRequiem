import { clampSoundUnit } from './soundBusRuntime.js';

export function createSoundSystemState({ sfxDefs, bgmDefs, rng, nowSeconds, createAudioContext } = {}) {
  return {
    _ctx: null,
    _enabled: true,
    _musicEnabled: true,
    _unlocked: false,
    _masterVol: 0.8,
    _bgmVol: 0.6,
    _sfxVol: 1.0,
    _masterBus: null,
    _bgmBus: null,
    _sfxBus: null,
    _compressor: null,
    _bgm: null,
    _lastPlayAt: new Map(),
    _activeVoices: new Set(),
    _activeVoicesByType: new Map(),
    _maxVoices: 32,
    _sfxDefs: sfxDefs,
    _bgmDefs: bgmDefs,
    _nowSeconds: typeof nowSeconds === 'function' ? nowSeconds : (() => 0),
    _createAudioContext: typeof createAudioContext === 'function' ? createAudioContext : (() => null),
    _randomSource: typeof rng === 'function' ? rng : Math.random,
  };
}

export function applySoundVolumeSettings(target, master = 0.8, bgm = 0.6, sfx = 1.0) {
  target._masterVol = clampSoundUnit(master);
  target._bgmVol = clampSoundUnit(bgm);
  target._sfxVol = clampSoundUnit(sfx);
}

export function applySoundEnabledState(target, enabled) {
  target._enabled = enabled !== false;
  return target._enabled;
}

export function applySoundMusicEnabledState(target, enabled) {
  target._musicEnabled = enabled !== false;
  return target._musicEnabled;
}

export function resetSoundSystemRuntime(target) {
  target._ctx = null;
  target._masterBus = null;
  target._bgmBus = null;
  target._sfxBus = null;
  target._compressor = null;
  target._bgm = null;
  target._unlocked = false;
  target._lastPlayAt = new Map();
  target._activeVoices = new Set();
  target._activeVoicesByType = new Map();
  target._nowSeconds = typeof target._nowSeconds === 'function' ? target._nowSeconds : (() => 0);
  target._createAudioContext = typeof target._createAudioContext === 'function' ? target._createAudioContext : (() => null);
  target._randomSource = typeof target._randomSource === 'function' ? target._randomSource : Math.random;
}
