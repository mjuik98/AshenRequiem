import {
  renderSettingsAudioIcon,
  renderSettingsControlsIcon,
  renderSettingsDisplayIcon,
  renderSettingsGraphicsIcon,
} from './settingsViewIcons.js';

export const SETTINGS_TABS = Object.freeze([
  { id: 'audio', label: '오디오', renderIcon: renderSettingsAudioIcon },
  { id: 'graphics', label: '그래픽', renderIcon: renderSettingsGraphicsIcon },
  { id: 'display', label: '화면', renderIcon: renderSettingsDisplayIcon },
  { id: 'controls', label: '조작', renderIcon: renderSettingsControlsIcon },
]);

const GRAPHICS_QUALITY_OPTIONS = Object.freeze([
  { id: 'low', name: '낮음', desc: '글로우 항상 비활성화' },
  { id: 'medium', name: '보통', desc: '자동 조절 (기본값)' },
  { id: 'high', name: '높음', desc: '글로우 항상 활성화' },
]);

const CONTROL_BINDINGS = Object.freeze([
  { action: '이동', key: 'W  A  S  D  /  방향키', note: '' },
  { action: '일시정지', key: 'ESC', note: '' },
  { action: '디버그 패널', key: '`  (백쿼트)', note: '' },
  { action: '확인 / 시작', key: 'Enter  /  Space', note: '' },
  { action: '터치 이동', key: '화면 왼쪽 절반 드래그', note: '모바일' },
]);

export function renderSettingsNavItem(id, activeTab) {
  const tab = SETTINGS_TABS.find((entry) => entry.id === id);
  const active = activeTab === id;
  return `
    <div class="sv-nav-item ${active ? 'sv-nav-active' : ''}"
         data-tab="${id}" role="tab" aria-selected="${active}" tabindex="${active ? 0 : -1}">
      <span class="sv-nav-icon" aria-hidden="true">${tab?.renderIcon?.() ?? ''}</span>
      <span>${tab?.label ?? id}</span>
    </div>`;
}

export function renderSettingsAudioSection(options) {
  return `
    <p class="sv-section-label">Audio</p>

    ${renderSettingsSliderRow('masterVolume', '마스터 볼륨', options.masterVolume,
      '모든 게임 음량에 적용되는 전체 볼륨')}
    ${renderSettingsSliderRow('bgmVolume', '배경음악 (BGM)', options.bgmVolume,
      '배경음악 전용 볼륨')}
    ${renderSettingsSliderRow('sfxVolume', '효과음 (SFX)', options.sfxVolume,
      '전투·레벨업 효과음 전용 볼륨')}

    <div class="sv-divider"></div>

    ${renderSettingsToggleRow('musicEnabled', 'BGM 활성화',
      '배경음악 재생 여부', options.musicEnabled)}
    ${renderSettingsToggleRow('soundEnabled', '효과음 활성화',
      '전투·레벨업 효과음 재생 여부', options.soundEnabled)}
  `;
}

export function renderSettingsGraphicsSection(options) {
  return `
    <p class="sv-section-label">Graphics</p>

    <p class="sv-field-label">렌더링 품질</p>
    <div class="sv-quality-grid" role="radiogroup" aria-label="렌더링 품질">
      ${GRAPHICS_QUALITY_OPTIONS.map((quality) => `
        <div class="sv-quality-card ${options.quality === quality.id ? 'sv-quality-active' : ''}"
             data-quality="${quality.id}" role="radio" aria-checked="${options.quality === quality.id}"
             tabindex="${options.quality === quality.id ? 0 : -1}">
          <p class="sv-quality-name">${quality.name}</p>
          <p class="sv-quality-desc">${quality.desc}</p>
        </div>
      `).join('')}
    </div>

    <div class="sv-divider"></div>

    ${renderSettingsToggleRow('glowEnabled', '발광 효과 (Glow)',
      '투사체 및 적 글로우 렌더링 (품질 "보통" 일 때 적용)', options.glowEnabled)}
  `;
}

export function renderSettingsDisplaySection(options) {
  return `
    <p class="sv-section-label">Display</p>

    ${renderSettingsToggleRow('useDevicePixelRatio', '고해상도 렌더링 (DPR)',
      'Retina / HiDPI 디스플레이 최적화 — 저장 후 캔버스 재조정', options.useDevicePixelRatio)}

    ${renderSettingsToggleRow('showFps', 'FPS 표시',
      '게임 중 디버그 패널에 프레임 수 표시', options.showFps)}

    <div class="sv-info-box">
      <p class="sv-info-text">화면 설정은 저장 즉시 적용됩니다.</p>
    </div>
  `;
}

export function renderSettingsControlsSection() {
  return `
    <p class="sv-section-label">Controls</p>

    <div class="sv-keybind-list">
      ${CONTROL_BINDINGS.map(({ action, key, note }) => `
        <div class="sv-keybind-row">
          <span class="sv-keybind-action">${action}</span>
          <span class="sv-keybind-right">
            ${note ? `<span class="sv-keybind-note-badge">${note}</span>` : ''}
            <kbd class="sv-keybind-key">${key}</kbd>
          </span>
        </div>
      `).join('')}
    </div>

    <p class="sv-controls-note">키 바인딩 커스터마이징은 추후 지원 예정입니다.</p>
  `;
}

export function renderSettingsSliderRow(key, label, value, desc = '') {
  return `
    <div class="sv-slider-row">
      <div class="sv-slider-header">
        <div>
          <span class="sv-slider-label">${label}</span>
          ${desc ? `<span class="sv-slider-desc"> — ${desc}</span>` : ''}
        </div>
        <span class="sv-slider-val" id="sv-val-${key}">${value}</span>
      </div>
      <input type="range" min="0" max="100" value="${value}" step="1"
             class="sv-slider" data-key="${key}" aria-label="${label}">
    </div>`;
}

export function renderSettingsToggleRow(key, label, desc, enabled) {
  return `
    <div class="sv-toggle-row">
      <div class="sv-toggle-info">
        <p class="sv-toggle-label">${label}</p>
        ${desc ? `<p class="sv-toggle-desc">${desc}</p>` : ''}
      </div>
      <div class="sv-switch ${enabled ? 'sv-switch-on' : ''}"
           data-key="${key}" role="switch" aria-checked="${enabled}"
           aria-label="${label}" tabindex="0">
        <div class="sv-switch-knob"></div>
      </div>
    </div>`;
}
