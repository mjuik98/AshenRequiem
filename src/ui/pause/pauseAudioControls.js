import { SESSION_OPTION_DEFAULTS } from '../../state/sessionOptions.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

export const PAUSE_AUDIO_DEFAULTS = {
  soundEnabled: SESSION_OPTION_DEFAULTS.soundEnabled,
  musicEnabled: SESSION_OPTION_DEFAULTS.musicEnabled,
  masterVolume: SESSION_OPTION_DEFAULTS.masterVolume,
  bgmVolume: SESSION_OPTION_DEFAULTS.bgmVolume,
  sfxVolume: SESSION_OPTION_DEFAULTS.sfxVolume,
};

function renderPauseSoundSlider(key, label, value) {
  return `
    <label class="pv-sound-row">
      <div class="pv-sound-row-head">
        <span>${escapeHtml(label)}</span>
        <span id="pv-sound-value-${escapeAttr(key)}">${value}</span>
      </div>
      <input
        class="pv-audio-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        value="${value}"
        data-sound-key="${escapeAttr(key)}"
        aria-label="${escapeAttr(label)}"
      />
    </label>
  `;
}

function renderPauseSoundToggle(key, label, enabled) {
  return `
    <button
      class="pv-sound-toggle${enabled ? ' active' : ''}"
      type="button"
      data-toggle-key="${escapeAttr(key)}"
      aria-pressed="${enabled}"
    >
      <span>${escapeHtml(label)}</span>
      <span class="pv-sound-toggle-pill">${enabled ? 'ON' : 'OFF'}</span>
    </button>
  `;
}

export function renderPauseSoundControls(options = PAUSE_AUDIO_DEFAULTS) {
  return `
    <div class="pv-sound-panel">
      <div class="pv-sec-label">Quick Audio</div>
      ${renderPauseSoundSlider('masterVolume', '마스터 볼륨', options.masterVolume)}
      ${renderPauseSoundSlider('bgmVolume', '배경음악 (BGM)', options.bgmVolume)}
      ${renderPauseSoundSlider('sfxVolume', '효과음 (SFX)', options.sfxVolume)}

      <div class="pv-sound-toggles">
        ${renderPauseSoundToggle('musicEnabled', '배경음악', options.musicEnabled)}
        ${renderPauseSoundToggle('soundEnabled', '효과음', options.soundEnabled)}
      </div>

      <div class="pv-sound-note">
        변경 즉시 적용됩니다.
      </div>
    </div>
  `;
}

export function buildNextPauseOptions(options, action) {
  if (!action?.key) return { ...options };
  if (action.type === 'toggle') {
    return {
      ...options,
      [action.key]: !options[action.key],
    };
  }
  if (action.type === 'slider') {
    return {
      ...options,
      [action.key]: Number(action.value),
    };
  }
  return { ...options };
}
