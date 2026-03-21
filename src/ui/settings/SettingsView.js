/**
 * SettingsView — 설정 화면 DOM UI
 *
 * show(session, onSave, onBack) 호출로 초기화.
 * 사용자 조작은 내부 _opts에 즉시 반영되어 탭 전환 시에도 값이 유지된다.
 * 저장 버튼 클릭 시 onSave(newOptions) 콜백으로 최종값 전달.
 *
 * FIX: .sv-root에 pointer-events: auto 추가
 *   Before: #ui-container의 pointer-events:none을 상속하여
 *           div 기반 인터랙티브 요소(탭, 토글, 품질카드, input[range])가
 *           모두 클릭/조작 불가 상태였음.
 *           (button 요소는 index.html의 '#ui-container button' 셀렉터로
 *            pointer-events:auto가 적용되어 예외적으로 동작했지만,
 *            div/input 요소는 차단됨)
 *   After:  .sv-root에 pointer-events:auto를 명시하여 모든 설정 컨트롤 정상화
 */

/** 기본 설정값 — 초기화 및 누락 필드 보완에 사용 */
const OPTION_DEFAULTS = {
  soundEnabled:        true,
  musicEnabled:        true,
  showFps:             false,
  masterVolume:        80,
  bgmVolume:           60,
  sfxVolume:           100,
  quality:             'medium',
  glowEnabled:         true,
  useDevicePixelRatio: true,
};

export class SettingsView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'sv-root';
    this._onSave = null;
    this._onBack = null;
    this._opts   = { ...OPTION_DEFAULTS };
    this._tab    = 'audio';
    this._injectStyles();
    container.appendChild(this.el);

    this._handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this._onBack?.();
      }
    };
  }

  /**
   * @param {import('../../state/createSessionState.js').SessionState} session
   * @param {(opts: object) => void} onSave
   * @param {() => void} onBack
   */
  show(session, onSave, onBack) {
    this._onSave = onSave;
    this._onBack = onBack;
    this._opts   = { ...OPTION_DEFAULTS, ...(session.options ?? {}) };
    this._render();
    window.addEventListener('keydown', this._handleKeyDown, true);
  }

  refresh(session) {
    this._opts = { ...OPTION_DEFAULTS, ...(session.options ?? {}) };
    this._render();
  }

  destroy() { 
    window.removeEventListener('keydown', this._handleKeyDown, true);
    this.el.remove(); 
  }

  // ── 렌더링 ──────────────────────────────────────────────────────────────────

  _render() {
    this.el.innerHTML = `
      <div class="sv-panel">

        <header class="sv-header">
          <div class="sv-header-left">
            <div class="sv-rune" aria-hidden="true">⚙</div>
            <div class="sv-heading">
              <h2 class="sv-title">Settings</h2>
              <p class="sv-subtitle">오디오, 그래픽, 화면 옵션을 조정합니다.</p>
            </div>
          </div>
          <span class="sv-header-note">저장 후 메인 화면으로 복귀</span>
        </header>

        <div class="sv-body">

          <nav class="sv-sidenav" aria-label="설정 탭">
            ${this._navItem('audio',    '오디오', _svgAudio())}
            ${this._navItem('graphics', '그래픽', _svgGraphics())}
            ${this._navItem('display',  '화면',   _svgDisplay())}
            ${this._navItem('controls', '조작',   _svgControls())}
          </nav>

          <div class="sv-content" role="tabpanel">
            ${this._tab === 'audio'    ? this._renderAudio()    : ''}
            ${this._tab === 'graphics' ? this._renderGraphics() : ''}
            ${this._tab === 'display'  ? this._renderDisplay()  : ''}
            ${this._tab === 'controls' ? this._renderControls() : ''}
          </div>

        </div>

        <footer class="sv-footer">
          <button class="sv-btn sv-btn-reset" type="button">기본값 초기화</button>
          <div class="sv-footer-right">
            <button class="sv-btn sv-btn-back" type="button">← 메인 화면으로</button>
            <button class="sv-btn sv-btn-primary" type="button">저장하고 닫기</button>
          </div>
        </footer>

      </div>
    `;
    this._bindEvents();
  }

  _navItem(id, label, iconHtml) {
    const active = this._tab === id;
    return `
      <div class="sv-nav-item ${active ? 'sv-nav-active' : ''}"
           data-tab="${id}" role="tab" aria-selected="${active}" tabindex="${active ? 0 : -1}">
        <span class="sv-nav-icon" aria-hidden="true">${iconHtml}</span>
        <span>${label}</span>
      </div>`;
  }

  // ── 오디오 탭 ───────────────────────────────────────────────────────────────

  _renderAudio() {
    return `
      <p class="sv-section-label">Audio</p>

      ${this._sliderRow('masterVolume', '마스터 볼륨', this._opts.masterVolume,
        '모든 게임 음량에 적용되는 전체 볼륨')}
      ${this._sliderRow('bgmVolume', '배경음악 (BGM)', this._opts.bgmVolume,
        '배경음악 전용 볼륨')}
      ${this._sliderRow('sfxVolume', '효과음 (SFX)', this._opts.sfxVolume,
        '전투·레벨업 효과음 전용 볼륨')}

      <div class="sv-divider"></div>

      ${this._toggleRow('musicEnabled', 'BGM 활성화',
        '배경음악 재생 여부',   this._opts.musicEnabled)}
      ${this._toggleRow('soundEnabled', '효과음 활성화',
        '전투·레벨업 효과음 재생 여부', this._opts.soundEnabled)}
    `;
  }

  // ── 그래픽 탭 ───────────────────────────────────────────────────────────────

  _renderGraphics() {
    const qOpts = [
      { id: 'low',    name: '낮음',   desc: '글로우 항상 비활성화' },
      { id: 'medium', name: '보통',   desc: '자동 조절 (기본값)'   },
      { id: 'high',   name: '높음',   desc: '글로우 항상 활성화'   },
    ];
    return `
      <p class="sv-section-label">Graphics</p>

      <p class="sv-field-label">렌더링 품질</p>
      <div class="sv-quality-grid" role="radiogroup" aria-label="렌더링 품질">
        ${qOpts.map(q => `
          <div class="sv-quality-card ${this._opts.quality === q.id ? 'sv-quality-active' : ''}"
               data-quality="${q.id}" role="radio" aria-checked="${this._opts.quality === q.id}"
               tabindex="${this._opts.quality === q.id ? 0 : -1}">
            <p class="sv-quality-name">${q.name}</p>
            <p class="sv-quality-desc">${q.desc}</p>
          </div>
        `).join('')}
      </div>

      <div class="sv-divider"></div>

      ${this._toggleRow('glowEnabled', '발광 효과 (Glow)',
        '투사체 및 적 글로우 렌더링 (품질 "보통" 일 때 적용)', this._opts.glowEnabled)}
    `;
  }

  // ── 화면 탭 ─────────────────────────────────────────────────────────────────

  _renderDisplay() {
    return `
      <p class="sv-section-label">Display</p>

      ${this._toggleRow('useDevicePixelRatio', '고해상도 렌더링 (DPR)',
        'Retina / HiDPI 디스플레이 최적화 — 저장 후 캔버스 재조정', this._opts.useDevicePixelRatio)}

      ${this._toggleRow('showFps', 'FPS 표시',
        '게임 중 디버그 패널에 프레임 수 표시', this._opts.showFps)}

      <div class="sv-info-box">
        <p class="sv-info-text">화면 설정은 저장 즉시 적용됩니다.</p>
      </div>
    `;
  }

  // ── 조작 탭 ─────────────────────────────────────────────────────────────────

  _renderControls() {
    const bindings = [
      { action: '이동',         key: 'W  A  S  D  /  방향키',   note: '' },
      { action: '일시정지',     key: 'ESC',                      note: '' },
      { action: '디버그 패널',  key: '`  (백쿼트)',              note: '' },
      { action: '확인 / 시작',  key: 'Enter  /  Space',          note: '' },
      { action: '터치 이동',    key: '화면 왼쪽 절반 드래그',    note: '모바일' },
    ];
    return `
      <p class="sv-section-label">Controls</p>

      <div class="sv-keybind-list">
        ${bindings.map(({ action, key, note }) => `
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

  // ── 공통 컴포넌트 ────────────────────────────────────────────────────────────

  _sliderRow(key, label, value, desc = '') {
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

  _toggleRow(key, label, desc, on) {
    return `
      <div class="sv-toggle-row">
        <div class="sv-toggle-info">
          <p class="sv-toggle-label">${label}</p>
          ${desc ? `<p class="sv-toggle-desc">${desc}</p>` : ''}
        </div>
        <div class="sv-switch ${on ? 'sv-switch-on' : ''}"
             data-key="${key}" role="switch" aria-checked="${on}"
             aria-label="${label}" tabindex="0">
          <div class="sv-switch-knob"></div>
        </div>
      </div>`;
  }

  // ── 이벤트 바인딩 ────────────────────────────────────────────────────────────

  _bindEvents() {
    // 탭 전환
    this.el.querySelectorAll('.sv-nav-item').forEach((item, index, list) => {
      const activate = () => {
        this._tab = item.dataset.tab;
        this._render();
      };
      item.addEventListener('click', activate);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
          return;
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          list[(index + 1) % list.length]?.focus();
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          list[(index - 1 + list.length) % list.length]?.focus();
        }
      });
    });

    // 볼륨 슬라이더 — 실시간 업데이트
    this.el.querySelectorAll('.sv-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const key = slider.dataset.key;
        this._opts[key] = Number(slider.value);
        const valEl = this.el.querySelector(`#sv-val-${key}`);
        if (valEl) valEl.textContent = slider.value;
      });
    });

    // 토글 스위치
    this.el.querySelectorAll('.sv-switch').forEach(sw => {
      const toggle = () => {
        const key = sw.dataset.key;
        this._opts[key] = !this._opts[key];
        sw.classList.toggle('sv-switch-on', this._opts[key]);
        sw.setAttribute('aria-checked', String(this._opts[key]));
      };
      sw.addEventListener('click', toggle);
      sw.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
      });
    });

    // 품질 카드
    this.el.querySelectorAll('.sv-quality-card').forEach((card, index, list) => {
      const select = () => {
        this._opts.quality = card.dataset.quality;
        this.el.querySelectorAll('.sv-quality-card').forEach(c => {
          const active = c.dataset.quality === this._opts.quality;
          c.classList.toggle('sv-quality-active', active);
          c.setAttribute('aria-checked', String(active));
          c.tabIndex = active ? 0 : -1;
        });
      };
      card.addEventListener('click', select);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
          return;
        }

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          list[(index + 1) % list.length]?.focus();
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          list[(index - 1 + list.length) % list.length]?.focus();
        }
      });
    });

    // 저장
    this.el.querySelector('.sv-btn-primary')?.addEventListener('click', () => {
      this._onSave?.({ ...this._opts });
    });

    // 메인 화면 복귀
    this.el.querySelector('.sv-btn-back')?.addEventListener('click', () => {
      this._onBack?.();
    });

    // 기본값 초기화
    this.el.querySelector('.sv-btn-reset')?.addEventListener('click', () => {
      this._opts = { ...OPTION_DEFAULTS };
      this._render();
    });
  }

  // ── 스타일 주입 ──────────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('sv-styles')) return;
    const s = document.createElement('style');
    s.id = 'sv-styles';
    s.textContent = `
      .sv-root {
        position: absolute; inset: 0;
        background: radial-gradient(circle at 50% 18%, #110d1a 0%, #060810 55%, #020104 100%);
        display: flex; align-items: center; justify-content: center;
        z-index: 50; font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
        color: rgba(244,237,224,0.9); padding: 16px; overflow-y: auto;
        /* FIX: #ui-container의 pointer-events:none 상속 차단
           Before: div/input 기반 컨트롤(탭, 토글, 슬라이더, 품질카드)이 모두 클릭 불가
           After:  모든 설정 컨트롤 정상 동작 */
        pointer-events: auto;
      }
      .sv-panel {
        width: min(720px, calc(100vw - 32px));
        background: rgba(10,7,18,0.96);
        border: 1px solid rgba(212,175,106,0.28);
        border-radius: 20px; padding: 28px 32px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.55),
                    inset 0 1px 0 rgba(255,255,255,0.03);
        animation: sv-enter 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      @keyframes sv-enter {
        from { opacity: 0; transform: scale(0.93) translateY(10px); }
        to   { opacity: 1; transform: scale(1)    translateY(0);    }
      }

      /* 헤더 */
      .sv-header {
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
        padding-bottom: 18px; margin-bottom: 20px;
        border-bottom: 1px solid rgba(212,175,106,0.14);
      }
      .sv-header-left { display: flex; align-items: center; gap: 12px; }
      .sv-rune {
        width: 34px; height: 34px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        background: rgba(212,175,106,0.14);
        border: 1px solid rgba(212,175,106,0.3);
        font-size: 16px;
        flex-shrink: 0;
      }
      .sv-heading { min-width: 0; }
      .sv-title {
        margin: 0; font-size: 15px; font-weight: 600;
        letter-spacing: 3px; color: #d4af6a; text-transform: uppercase;
      }
      .sv-subtitle {
        margin: 6px 0 0;
        font-size: 12px;
        color: rgba(244,237,224,0.5);
      }
      .sv-header-note {
        font-size: 11px; padding: 4px 10px; border-radius: 999px;
        background: rgba(212,175,106,0.1); border: 1px solid rgba(212,175,106,0.22);
        color: rgba(212,175,106,0.74); white-space: nowrap;
      }

      /* 바디 레이아웃 */
      .sv-body {
        display: grid; grid-template-columns: 124px 1fr; gap: 0;
        min-height: 280px;
      }

      /* 사이드 네비게이션 */
      .sv-sidenav {
        padding-right: 16px;
        border-right: 1px solid rgba(255,255,255,0.06);
        display: flex; flex-direction: column; gap: 3px;
      }
      .sv-nav-item {
        display: flex; align-items: center; gap: 9px;
        padding: 9px 11px; border-radius: 8px; cursor: pointer;
        font-size: 12px; color: rgba(244,237,224,0.4);
        border: 1px solid transparent;
        transition: color 0.15s, background 0.15s, border-color 0.15s;
        outline: none;
      }
      .sv-nav-item:hover { color: rgba(244,237,224,0.7); background: rgba(255,255,255,0.04); }
      .sv-nav-item:focus-visible { box-shadow: 0 0 0 2px rgba(199,163,93,0.45); }
      .sv-nav-active {
        color: #c9a86c !important;
        background: rgba(199,163,93,0.1) !important;
        border-color: rgba(199,163,93,0.25) !important;
      }
      .sv-nav-icon { display: flex; align-items: center; flex-shrink: 0; }

      /* 콘텐츠 영역 */
      .sv-content { padding-left: 22px; }
      .sv-section-label {
        font-size: 10px; font-weight: 500; letter-spacing: 2.5px;
        color: rgba(199,163,93,0.55); text-transform: uppercase;
        margin: 0 0 14px;
      }
      .sv-divider {
        border: none; border-top: 0.5px solid rgba(255,255,255,0.07);
        margin: 14px 0;
      }
      .sv-field-label { font-size: 12px; color: rgba(244,237,224,0.5); margin-bottom: 9px; }

      /* 슬라이더 행 */
      .sv-slider-row { margin-bottom: 16px; }
      .sv-slider-header {
        display: flex; justify-content: space-between; align-items: baseline;
        margin-bottom: 7px; gap: 8px;
      }
      .sv-slider-label { font-size: 13px; color: rgba(244,237,224,0.8); }
      .sv-slider-desc  { font-size: 11px; color: rgba(244,237,224,0.3); }
      .sv-slider-val   {
        font-size: 12px; font-weight: 500; color: #c9a86c;
        min-width: 28px; text-align: right; flex-shrink: 0;
      }
      .sv-slider {
        width: 100%; cursor: pointer; accent-color: #c9a86c;
        height: 4px;
      }

      /* 토글 행 */
      .sv-toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 13px; margin-bottom: 8px;
        background: rgba(255,255,255,0.025);
        border: 0.5px solid rgba(255,255,255,0.08);
        border-radius: 8px; gap: 12px;
      }
      .sv-toggle-info { flex: 1; min-width: 0; }
      .sv-toggle-label { margin: 0; font-size: 13px; color: rgba(244,237,224,0.8); }
      .sv-toggle-desc  { margin: 2px 0 0; font-size: 11px; color: rgba(244,237,224,0.35);
                         line-height: 1.4; }

      /* 토글 스위치 */
      .sv-switch {
        width: 40px; height: 22px; flex-shrink: 0;
        background: rgba(50,45,70,0.8);
        border-radius: 11px; position: relative; cursor: pointer;
        border: 0.5px solid rgba(255,255,255,0.08);
        transition: background 0.18s; outline: none;
      }
      .sv-switch:focus-visible { box-shadow: 0 0 0 2px rgba(199,163,93,0.5); }
      .sv-switch-on {
        background: rgba(199,163,93,0.65) !important;
        border-color: rgba(199,163,93,0.4) !important;
      }
      .sv-switch-knob {
        width: 18px; height: 18px; background: #e8e0d0; border-radius: 50%;
        position: absolute; top: 2px; left: 2px;
        transition: left 0.18s cubic-bezier(0.34,1.56,0.64,1);
        box-shadow: 0 1px 3px rgba(0,0,0,0.35);
      }
      .sv-switch-on .sv-switch-knob { left: 20px; }

      /* 품질 그리드 */
      .sv-quality-grid {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 6px;
      }
      .sv-quality-card {
        padding: 11px 9px; border-radius: 8px; text-align: center; cursor: pointer;
        border: 0.5px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.025);
        transition: all 0.15s; outline: none;
      }
      .sv-quality-card:hover   { background: rgba(255,255,255,0.055); }
      .sv-quality-card:focus-visible { box-shadow: 0 0 0 2px rgba(199,163,93,0.45); }
      .sv-quality-active {
        border: 1px solid rgba(199,163,93,0.45) !important;
        background: rgba(199,163,93,0.1) !important;
      }
      .sv-quality-name { margin: 0; font-size: 13px; color: rgba(244,237,224,0.65); }
      .sv-quality-active .sv-quality-name { color: #c9a86c; }
      .sv-quality-desc { margin: 4px 0 0; font-size: 10px; color: rgba(244,237,224,0.3); }
      .sv-quality-active .sv-quality-desc { color: rgba(199,163,93,0.55); }

      /* 화면 탭 정보 박스 */
      .sv-info-box {
        margin-top: 12px; padding: 9px 13px;
        background: rgba(199,163,93,0.05);
        border: 0.5px solid rgba(199,163,93,0.15);
        border-radius: 7px;
      }
      .sv-info-text { margin: 0; font-size: 11px; color: rgba(199,163,93,0.6); }

      /* 키 바인딩 */
      .sv-keybind-list { display: flex; flex-direction: column; gap: 6px; }
      .sv-keybind-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 13px;
        background: rgba(255,255,255,0.025);
        border: 0.5px solid rgba(255,255,255,0.07);
        border-radius: 7px;
      }
      .sv-keybind-action { font-size: 13px; color: rgba(244,237,224,0.5); }
      .sv-keybind-right  { display: flex; align-items: center; gap: 7px; }
      .sv-keybind-note-badge {
        font-size: 10px; color: rgba(199,163,93,0.65);
        background: rgba(199,163,93,0.1); border: 0.5px solid rgba(199,163,93,0.2);
        border-radius: 4px; padding: 2px 7px;
      }
      .sv-keybind-key {
        font-size: 11px; font-weight: 500; color: #c9a86c;
        background: rgba(199,163,93,0.08);
        border: 0.5px solid rgba(199,163,93,0.25);
        border-radius: 5px; padding: 3px 10px;
        font-family: 'Segoe UI', monospace;
      }
      .sv-controls-note {
        margin: 12px 0 0; font-size: 11px; color: rgba(244,237,224,0.25);
        text-align: center;
      }

      /* 하단 푸터 */
      .sv-footer {
        display: flex; align-items: center; justify-content: space-between;
        padding-top: 18px; margin-top: 18px;
        border-top: 1px solid rgba(255,255,255,0.05);
      }
      .sv-footer-right { display: flex; gap: 10px; }
      .sv-btn {
        padding: 10px 20px; border-radius: 9px; font-size: 13px;
        cursor: pointer; letter-spacing: 0.3px;
        transition: transform 0.15s, opacity 0.15s;
      }
      .sv-btn:hover:not(:disabled) { transform: translateY(-1px); }
      .sv-btn:active:not(:disabled) { transform: scale(0.98); }
      .sv-btn-reset {
        background: transparent;
        border: 0.5px solid rgba(199,163,93,0.18);
        color: rgba(244,237,224,0.38);
      }
      .sv-btn-back {
        background: transparent;
        border: 0.5px solid rgba(199,163,93,0.28);
        color: rgba(244,237,224,0.6);
      }
      .sv-btn-primary {
        background: linear-gradient(135deg, rgba(199,163,93,0.18), rgba(199,163,93,0.07));
        border: 1px solid rgba(199,163,93,0.45);
        color: #c9a86c;
      }

      /* 반응형 */
      @media (max-width: 560px) {
        .sv-panel { padding: 22px 18px; }
        .sv-header { flex-direction: column; align-items: stretch; }
        .sv-header-note { align-self: flex-start; }
        .sv-body { grid-template-columns: 1fr; }
        .sv-sidenav {
          flex-direction: row; flex-wrap: wrap;
          padding-right: 0; border-right: none;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 12px; margin-bottom: 14px; gap: 4px;
        }
        .sv-content { padding-left: 0; }
        .sv-footer  { flex-direction: column; gap: 10px; }
        .sv-footer-right { justify-content: stretch; }
        .sv-btn-back, .sv-btn-primary { flex: 1; text-align: center; }
      }
      @media (prefers-reduced-motion: reduce) {
        .sv-panel { animation: none; }
        .sv-switch-knob { transition: none; }
      }
    `;
    document.head.appendChild(s);
  }
}

// ── SVG 아이콘 헬퍼 ─────────────────────────────────────────────────────────

function _svgAudio() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block">
    <path d="M3 5.5h2l3-3v11l-3-3H3V5.5z" fill="currentColor"/>
    <path d="M11 6c.7.7 1.1 1.7 1.1 2s-.4 1.3-1.1 2" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M13 4c1.3 1.3 2 3 2 4s-.7 2.7-2 4" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function _svgGraphics() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block">
    <rect x="1" y="2.5" width="14" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
    <path d="M5 13.5h6M8 11.5v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="8" cy="7" r="2" stroke="currentColor" stroke-width="1.2"/>
  </svg>`;
}

function _svgDisplay() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block">
    <rect x="1" y="1.5" width="14" height="13" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
    <path d="M1 5h14" stroke="currentColor" stroke-width="1.2"/>
    <path d="M3 8.5h4M3 11h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;
}

function _svgControls() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="display:block">
    <rect x="1" y="4" width="14" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="5" cy="8" r="1.5" fill="currentColor"/>
    <path d="M11 6.5v3M9.5 8h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;
}
