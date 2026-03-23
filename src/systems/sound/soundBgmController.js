import { disconnectSoundNodes } from './soundBusRuntime.js';
import {
  ensureSoundContextPlayable,
  playBgmVoice,
  stopBgmVoice,
} from './soundPlaybackRuntime.js';
import {
  createBgmVoice,
  disposeBgmVoice,
} from './soundVoices.js';

export function playSoundBgm(target, id = 'default') {
  if (!target._ctx || !target._musicEnabled) return;
  if (!ensureSoundContextPlayable(target._ctx)) return;

  target._bgm = playBgmVoice({
    ctx: target._ctx,
    musicEnabled: target._musicEnabled,
    currentBgm: target._bgm,
    id,
    bgmDefs: target._bgmDefs,
    createBgmVoice: (bgmId, def) => createBgmVoice({
      ctx: target._ctx,
      bgmBus: target._bgmBus,
      id: bgmId,
      def,
    }),
    disposeBgmVoice: (bgm, afterSeconds) => disposeBgmVoice({
      ctx: target._ctx,
      bgm,
      afterSeconds,
      disconnectSafely: (...nodes) => disconnectSoundNodes(...nodes),
    }),
  });
}

export function stopSoundBgm(target, fadeOut = 0.12) {
  if (!target._ctx || !target._bgm) {
    target._bgm = null;
    return;
  }

  target._bgm = stopBgmVoice({
    ctx: target._ctx,
    bgm: target._bgm,
    fadeOut,
    disposeBgmVoice: (bgm, afterSeconds) => disposeBgmVoice({
      ctx: target._ctx,
      bgm,
      afterSeconds,
      disconnectSafely: (...nodes) => disconnectSoundNodes(...nodes),
    }),
  });
}
