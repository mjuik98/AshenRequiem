import { normalizeSessionOptions } from '../../state/sessionOptions.js';

export function applySessionOptionsToRuntime(
  options = {},
  {
    soundSystem = null,
    renderer = null,
    accessibilityRuntime = null,
    inputManager = null,
  } = {},
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

  if (typeof accessibilityRuntime?.applyOptions === 'function') {
    accessibilityRuntime.applyOptions(normalized);
  }

  if (typeof inputManager?.configureKeyBindings === 'function') {
    inputManager.configureKeyBindings(normalized.keyBindings);
  }

  return normalized;
}
