import {
  renderSettingsAudioIcon,
  renderSettingsControlsIcon,
  renderSettingsDataIcon,
  renderSettingsDisplayIcon,
  renderSettingsGraphicsIcon,
} from './settingsViewIcons.js';
import {
  formatKeyBindingLabel,
  normalizeKeyBindings,
} from '../../input/keyBindings.js';

export const SETTINGS_TABS = Object.freeze([
  { id: 'audio', label: '오디오', renderIcon: renderSettingsAudioIcon },
  { id: 'graphics', label: '그래픽', renderIcon: renderSettingsGraphicsIcon },
  { id: 'display', label: '화면', renderIcon: renderSettingsDisplayIcon },
  { id: 'controls', label: '조작', renderIcon: renderSettingsControlsIcon },
  { id: 'data', label: '데이터', renderIcon: renderSettingsDataIcon },
]);

const GRAPHICS_QUALITY_OPTIONS = Object.freeze([
  { id: 'low', name: '낮음', desc: '글로우 항상 비활성화' },
  { id: 'medium', name: '보통', desc: '자동 조절 (기본값)' },
  { id: 'high', name: '높음', desc: '글로우 항상 활성화' },
]);

const KEY_BINDING_ROWS = Object.freeze([
  { action: 'moveUp', label: '이동 위', slots: 2 },
  { action: 'moveDown', label: '이동 아래', slots: 2 },
  { action: 'moveLeft', label: '이동 왼쪽', slots: 2 },
  { action: 'moveRight', label: '이동 오른쪽', slots: 2 },
  { action: 'pause', label: '일시정지', slots: 1 },
  { action: 'confirm', label: '확인 / 시작', slots: 2 },
  { action: 'debug', label: '디버그 패널', slots: 1 },
]);

const KEY_BINDING_OPTIONS = Object.freeze([
  { value: '', label: '비움' },
  { value: 'w', label: 'W' },
  { value: 'a', label: 'A' },
  { value: 's', label: 'S' },
  { value: 'd', label: 'D' },
  { value: 'i', label: 'I' },
  { value: 'j', label: 'J' },
  { value: 'k', label: 'K' },
  { value: 'l', label: 'L' },
  { value: 'p', label: 'P' },
  { value: 'f', label: 'F' },
  { value: 'tab', label: 'Tab' },
  { value: 'enter', label: 'Enter' },
  { value: 'space', label: 'Space' },
  { value: 'escape', label: 'ESC' },
  { value: 'backquote', label: '`' },
  { value: 'arrowup', label: 'Arrow Up' },
  { value: 'arrowdown', label: 'Arrow Down' },
  { value: 'arrowleft', label: 'Arrow Left' },
  { value: 'arrowright', label: 'Arrow Right' },
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

    <div class="sv-divider"></div>

    ${renderSettingsToggleRow('reducedMotion', '모션 감소',
      '결과/알림/HUD의 애니메이션을 축소합니다.', options.reducedMotion)}

    ${renderSettingsToggleRow('highVisibilityHud', 'HUD 가독성 강화',
      '전투 HUD 대비를 높여 정보 확인을 쉽게 합니다.', options.highVisibilityHud)}

    ${renderSettingsToggleRow('largeText', '큰 글씨 UI',
      'HUD와 오버레이 텍스트를 조금 더 크게 표시합니다.', options.largeText)}

    <div class="sv-info-box">
      <p class="sv-info-text">화면 설정은 저장 즉시 적용됩니다.</p>
    </div>
  `;
}

function renderKeyBindingSelect(action, slotIndex, value = '') {
  return `
    <label class="sv-binding-slot">
      <span class="sv-binding-slot-label">${slotIndex === 0 ? '기본' : '보조'}</span>
      <select class="sv-binding-select" data-binding-action="${action}" data-binding-slot="${slotIndex}">
        ${KEY_BINDING_OPTIONS.map((option) => `
          <option value="${option.value}" ${option.value === value ? 'selected' : ''}>${option.label}</option>
        `).join('')}
      </select>
    </label>
  `;
}

export function renderSettingsControlsSection(options = {}) {
  const bindings = normalizeKeyBindings(options?.keyBindings);
  return `
    <p class="sv-section-label">Controls</p>

    <div class="sv-binding-list">
      ${KEY_BINDING_ROWS.map(({ action, label, slots }) => `
        <div class="sv-binding-row">
          <span class="sv-keybind-action">${label}</span>
          <span class="sv-keybind-right">
            ${Array.from({ length: slots }, (_, slotIndex) => renderKeyBindingSelect(action, slotIndex, bindings[action]?.[slotIndex] ?? '')).join('')}
          </span>
        </div>
      `).join('')}
    </div>

    <div class="sv-info-box">
      <p class="sv-info-text">키 바인딩은 저장 즉시 다음 입력부터 적용됩니다.</p>
    </div>

    <div class="sv-keybind-row">
      <span class="sv-keybind-action">터치 이동</span>
      <span class="sv-keybind-right">
        <span class="sv-keybind-note-badge">모바일</span>
        <kbd class="sv-keybind-key">${formatKeyBindingLabel('arrowleft')} / 화면 왼쪽 절반 드래그</kbd>
      </span>
    </div>
  `;
}

export function renderSettingsDataSection({ importText = '', statusText = '', detailLines = [] } = {}) {
  return `
    <p class="sv-section-label">Data</p>

    <div class="sv-data-box">
      <div class="sv-data-copy">
        <p class="sv-data-title">세이브 데이터</p>
        <p class="sv-data-desc">현재 진행 데이터를 JSON 스냅샷으로 내보내거나 가져옵니다.</p>
      </div>
      <div class="sv-data-actions">
        <button class="sv-btn sv-data-btn" type="button" data-action="inspect-storage">저장소 분석</button>
        <button class="sv-btn sv-data-btn" type="button" data-action="preview-import">가져오기 미리보기</button>
        <button class="sv-btn sv-data-btn" type="button" data-action="restore-backup">백업 복구</button>
        <button class="sv-btn sv-data-btn" type="button" data-action="export-session">내보내기</button>
        <button class="sv-btn sv-data-btn" type="button" data-action="import-session">가져오기</button>
        <button class="sv-btn sv-data-btn sv-data-btn-danger" type="button" data-action="reset-session">진행 초기화</button>
      </div>
    </div>

    <label class="sv-field-label" for="sv-data-textarea">세션 스냅샷</label>
    <textarea
      id="sv-data-textarea"
      class="sv-data-textarea"
      data-key="importText"
      spellcheck="false"
      placeholder="여기에 세이브 JSON을 붙여 넣으면 가져오기가 실행됩니다."
    >${importText}</textarea>

    <div class="sv-info-box">
      <p class="sv-info-text">${statusText || '가져오기 전에는 현재 스냅샷을 먼저 내보내 백업해 두는 것을 권장합니다.'}</p>
      ${detailLines.length > 0 ? `
        <ul class="sv-detail-list">
          ${detailLines.map((line) => `<li>${line}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
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
