/**
 * src/state/sessionOptions.js
 *
 * 세션 옵션의 기본값, 병합, 정규화, 런타임 반영을 한 곳에 모은다.
 */

export const SESSION_OPTION_DEFAULTS = Object.freeze({
  soundEnabled:        true,
  musicEnabled:        true,
  masterVolume:        80,
  bgmVolume:           60,
  sfxVolume:           100,
  quality:             'medium',
  glowEnabled:         true,
  showFps:             false,
  useDevicePixelRatio: true,
});

function normalizeQuality(quality) {
  return quality === 'low' || quality === 'medium' || quality === 'high'
    ? quality
    : SESSION_OPTION_DEFAULTS.quality;
}

export function normalizeSessionOptions(options = {}) {
  return {
    ...SESSION_OPTION_DEFAULTS,
    ...(options ?? {}),
    quality: normalizeQuality(options?.quality),
  };
}

export function mergeSessionOptions(base = {}, patch = {}) {
  return normalizeSessionOptions({
    ...(base ?? {}),
    ...(patch ?? {}),
  });
}

export function getEffectiveDevicePixelRatio(
  options = {},
  devicePixelRatio = 1,
  defaultUseDevicePixelRatio = SESSION_OPTION_DEFAULTS.useDevicePixelRatio,
) {
  const useDevicePixelRatio =
    options?.useDevicePixelRatio ?? defaultUseDevicePixelRatio;
  return useDevicePixelRatio ? (devicePixelRatio || 1) : 1;
}

export function applySessionOptionsToRuntime(
  options = {},
  { soundSystem = null, renderer = null } = {},
) {
  const normalized = normalizeSessionOptions(options);

  if (typeof soundSystem?.setEnabled === 'function') {
    soundSystem.setEnabled(normalized.soundEnabled);
  }

  if (typeof soundSystem?.setMusicEnabled === 'function') {
    soundSystem.setMusicEnabled(normalized.musicEnabled);
  }

  if (typeof soundSystem?.setVolume === 'function') {
    soundSystem.setVolume(
      normalized.masterVolume / 100,
      normalized.bgmVolume / 100,
      normalized.sfxVolume / 100,
    );
  }

  if (typeof renderer?.setGlowEnabled === 'function') {
    renderer.setGlowEnabled(normalized.glowEnabled);
  }

  if (typeof renderer?.setQualityPreset === 'function') {
    renderer.setQualityPreset(normalized.quality);
  }

  return normalized;
}
