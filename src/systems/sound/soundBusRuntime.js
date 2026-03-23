export function clampSoundValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clampSoundUnit(value) {
  return clampSoundValue(Number(value) || 0, 0, 1);
}

export function randomSoundSpread(amount) {
  if (!amount) return 0;
  return (Math.random() * 2 - 1) * amount;
}

export function disconnectSoundNodes(...nodes) {
  for (const node of nodes) {
    if (!node) continue;
    try { node.disconnect(); } catch {}
  }
}

export function cancelScheduledSoundParam(param, time) {
  if (!param) return;
  try { param.cancelScheduledValues(time); } catch {}
}

export function rampSoundParam(param, value, time, rampSeconds) {
  if (!param) return;
  const safeValue = Math.max(0.0001, value);
  cancelScheduledSoundParam(param, time);
  param.setValueAtTime(Math.max(param.value, 0.0001), time);
  if (rampSeconds <= 0) {
    param.setValueAtTime(safeValue, time);
    return;
  }
  param.linearRampToValueAtTime(safeValue, time + rampSeconds);
}

export function syncSoundBusVolumes({
  ctx,
  masterBus,
  bgmBus,
  sfxBus,
  masterTarget,
  bgmTarget,
  sfxTarget,
  ramp = 0.03,
}) {
  if (!ctx || !masterBus || !bgmBus || !sfxBus) return;

  const time = ctx.currentTime;
  rampSoundParam(masterBus.gain, masterTarget, time, ramp);
  rampSoundParam(bgmBus.gain, bgmTarget, time, Math.max(ramp, 0.05));
  rampSoundParam(sfxBus.gain, sfxTarget, time, ramp);
}

export function duckBgmBus({
  ctx,
  bgmBus,
  musicEnabled,
  bgmTarget,
  duckedVolume,
  amount = 0.25,
  attack = 0.02,
  hold = 0.2,
}) {
  if (!ctx || !bgmBus || !musicEnabled) return;

  const time = ctx.currentTime;
  const duckTarget = duckedVolume ?? Math.max(0.0001, bgmTarget * (1 - clampSoundUnit(amount)));
  cancelScheduledSoundParam(bgmBus.gain, time);
  bgmBus.gain.setValueAtTime(Math.max(bgmBus.gain.value, 0.0001), time);
  bgmBus.gain.linearRampToValueAtTime(duckTarget, time + Math.max(0.005, attack));
  bgmBus.gain.linearRampToValueAtTime(Math.max(0.0001, bgmTarget), time + Math.max(0.03, hold));
}

export function fadeSfxBus({
  ctx,
  sfxBus,
  restoreVolume,
  fadeOut = 0.04,
}) {
  if (!ctx || !sfxBus) return;

  const time = ctx.currentTime;
  cancelScheduledSoundParam(sfxBus.gain, time);
  sfxBus.gain.setValueAtTime(Math.max(sfxBus.gain.value, 0.0001), time);
  sfxBus.gain.linearRampToValueAtTime(0.0001, time + Math.max(0.01, fadeOut));
  sfxBus.gain.linearRampToValueAtTime(Math.max(0.0001, restoreVolume), time + Math.max(0.02, fadeOut + 0.03));
}

export function createStereoPanner(ctx, pan) {
  if (!ctx || typeof ctx.createStereoPanner !== 'function') return null;

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(clampSoundValue(pan, -1, 1), ctx.currentTime);
  return panner;
}
