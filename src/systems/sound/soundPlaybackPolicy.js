export function getBgmTargetVolume(musicEnabled, bgmVolume) {
  if (!musicEnabled) return 0.0001;
  return Math.max(0.0001, Number(bgmVolume) || 0);
}

export function getSfxTargetVolume(sfxVolume) {
  return Math.max(0.0001, Number(sfxVolume) || 0);
}

export function getDuckedBgmVolume(currentTarget, amount = 0.25) {
  const safeTarget = Math.max(0.0001, Number(currentTarget) || 0);
  const clampedAmount = Math.min(1, Math.max(0, Number(amount) || 0));
  return Math.max(0.0001, safeTarget * (1 - clampedAmount));
}

export function canPlaySoundType(
  type,
  {
    def = {},
    nowSeconds,
    lastPlayAt,
    activeVoicesByType,
    activeVoiceCount,
    maxVoices,
  } = {},
) {
  const cooldown = def.cooldown ?? 0;
  const lastAt = lastPlayAt?.get(type) ?? -Infinity;

  if (nowSeconds - lastAt < cooldown) {
    return false;
  }

  const activeCount = activeVoicesByType?.get(type) ?? 0;
  if (activeCount >= (def.maxPolyphony ?? 4)) {
    return false;
  }

  if (activeVoiceCount >= maxVoices) {
    return false;
  }

  return true;
}
