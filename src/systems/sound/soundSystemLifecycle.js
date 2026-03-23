import { createSoundGraph, disconnectSoundGraph } from './soundGraph.js';
import { resetSoundSystemRuntime } from './soundSystemState.js';

function defaultAudioContextFactory() {
  const AudioCtx = globalThis.window?.AudioContext || globalThis.window?.webkitAudioContext;
  return AudioCtx ? new AudioCtx() : null;
}

export function initSoundSystemContext(target, {
  createAudioContext = defaultAudioContextFactory,
  createGraph = createSoundGraph,
  warn = (...args) => console.warn(...args),
} = {}) {
  if (target._ctx) return target._ctx;

  try {
    const ctx = createAudioContext();
    if (!ctx) {
      throw new Error('AudioContext unsupported');
    }

    target._ctx = ctx;
    const graph = createGraph(ctx);
    target._masterBus = graph.masterBus;
    target._bgmBus = graph.bgmBus;
    target._sfxBus = graph.sfxBus;
    target._compressor = graph.compressor;
    target._syncVolumes(0);
    return target._ctx;
  } catch {
    warn('[SoundSystem] AudioContext 미지원 - 사운드 비활성화');
    target._enabled = false;
    target._ctx = null;
    return null;
  }
}

export async function unlockSoundSystemContext(target, {
  initContext = () => initSoundSystemContext(target),
} = {}) {
  if (!target._ctx) {
    initContext();
  }
  if (!target._ctx) return false;

  try {
    if (target._ctx.state === 'suspended') {
      await target._ctx.resume();
    }
    target._unlocked = target._ctx.state === 'running';
    return target._unlocked;
  } catch {
    return false;
  }
}

export function destroySoundSystemContext(target, {
  disconnectGraph = disconnectSoundGraph,
  resetRuntime = resetSoundSystemRuntime,
} = {}) {
  target.stopBgm(0.05);
  target._activeVoices.clear();
  target._activeVoicesByType.clear();

  if (target._ctx) {
    disconnectGraph({
      masterBus: target._masterBus,
      bgmBus: target._bgmBus,
      sfxBus: target._sfxBus,
      compressor: target._compressor,
    });

    target._ctx.close().catch(() => {});
  }

  resetRuntime(target);
}
