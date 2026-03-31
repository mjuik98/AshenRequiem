/**
 * src/state/sessionOptions.js
 *
 * 세션 옵션의 기본값, 병합, 정규화, 런타임 반영을 한 곳에 모은다.
 */
import {
  DEFAULT_KEY_BINDINGS,
  normalizeKeyBindings,
} from '../input/keyBindings.js';

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
  reducedMotion:       false,
  highVisibilityHud:   false,
  largeText:           false,
  keyBindings:         DEFAULT_KEY_BINDINGS,
});

function normalizeQuality(quality) {
  return quality === 'low' || quality === 'medium' || quality === 'high'
    ? quality
    : SESSION_OPTION_DEFAULTS.quality;
}

export function normalizeSessionOptions(options = {}) {
  const merged = {
    ...SESSION_OPTION_DEFAULTS,
    ...(options ?? {}),
  };
  return {
    ...merged,
    quality: normalizeQuality(options?.quality),
    keyBindings: normalizeKeyBindings(options?.keyBindings),
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
