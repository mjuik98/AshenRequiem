import { cancelScheduledSoundParam } from './soundBusRuntime.js';

export function ensureSoundContextPlayable(ctx) {
  if (!ctx) return false;
  if (ctx.state === 'closed') return false;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  return true;
}

export function playBgmVoice({
  ctx,
  musicEnabled,
  currentBgm,
  id = 'default',
  bgmDefs = {},
  createBgmVoice = () => null,
  disposeBgmVoice = () => {},
}) {
  if (!ctx || !musicEnabled) return currentBgm ?? null;
  if (currentBgm?.id === id) return currentBgm;

  const definition = bgmDefs[id] ?? bgmDefs.default;
  const nextBgm = createBgmVoice(id, definition);
  if (!nextBgm) return currentBgm ?? null;

  const time = ctx.currentTime;
  const fadeIn = 0.45;
  const fadeOut = 0.35;
  nextBgm.output.gain.setValueAtTime(0.0001, time);
  nextBgm.output.gain.exponentialRampToValueAtTime(1.0, time + fadeIn);

  if (currentBgm?.output) {
    cancelScheduledSoundParam(currentBgm.output.gain, time);
    currentBgm.output.gain.setValueAtTime(Math.max(currentBgm.output.gain.value, 0.0001), time);
    currentBgm.output.gain.exponentialRampToValueAtTime(0.0001, time + fadeOut);
    disposeBgmVoice(currentBgm, fadeOut + 0.02);
  }

  return nextBgm;
}

export function stopBgmVoice({
  ctx,
  bgm,
  fadeOut = 0.12,
  disposeBgmVoice = () => {},
}) {
  if (!ctx || !bgm) return null;

  const time = ctx.currentTime;
  if (bgm.output?.gain) {
    cancelScheduledSoundParam(bgm.output.gain, time);
    bgm.output.gain.setValueAtTime(Math.max(bgm.output.gain.value, 0.0001), time);
    bgm.output.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.01, fadeOut));
  }

  disposeBgmVoice(bgm, Math.max(0.02, fadeOut) + 0.02);
  return null;
}
