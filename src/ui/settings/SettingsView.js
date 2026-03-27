import {
  SESSION_OPTION_DEFAULTS,
} from '../../state/sessionOptions.js';
import {
  normalizeSessionOptions,
} from '../../state/sessionOptions.js';
import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';
import {
  SETTINGS_TABS,
  renderSettingsAudioSection,
  renderSettingsControlsSection,
  renderSettingsDataSection,
  renderSettingsDisplaySection,
  renderSettingsGraphicsSection,
  renderSettingsNavItem,
} from './settingsViewSections.js';
import {
  SETTINGS_VIEW_CSS,
  SETTINGS_VIEW_STYLE_ID,
} from './settingsViewStyles.js';

/**
 * SettingsView — 설정 화면 DOM UI
 *
 * show(session, onSave, onBack) 호출로 초기화.
 * 사용자 조작은 내부 _opts에 즉시 반영되어 탭 전환 시에도 값이 유지된다.
 * 저장 버튼 클릭 시 onSave(newOptions) 콜백으로 최종값 전달.
 */

const OPTION_DEFAULTS = normalizeSessionOptions(SESSION_OPTION_DEFAULTS);

export class SettingsView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'sv-root ss-root';
    this._onSave = null;
    this._onBack = null;
    this._handlers = {};
    this._opts = normalizeSessionOptions();
    this._tab = 'audio';
    this._dataState = {
      importText: '',
      statusText: '',
      detailLines: [],
    };
    this._injectStyles();
    container.appendChild(this.el);

    this._handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        this._onBack?.();
      }
    };
  }

  show(session, onSave, onBack) {
    const handlers = this._normalizeHandlers(onSave, onBack);
    this._onSave = handlers.onSave;
    this._onBack = handlers.onBack;
    this._handlers = handlers;
    this._opts = normalizeSessionOptions(session.options ?? {});
    this._render();
    window.addEventListener('keydown', this._handleKeyDown, true);
  }

  refresh(session) {
    this._opts = normalizeSessionOptions(session.options ?? {});
    this._render();
  }

  destroy() {
    window.removeEventListener('keydown', this._handleKeyDown, true);
    this.el.remove();
  }

  _render() {
    this.el.innerHTML = `
      <div class="sv-panel ss-panel">

        ${renderSubscreenHeader({
          headerClass: 'sv-header',
          leftClass: 'sv-header-left',
          headingClass: 'sv-heading',
          runeClass: 'sv-rune',
          titleClass: 'sv-title',
          subtitleClass: 'sv-subtitle',
          titleTag: 'h2',
          rune: '⚙',
          title: 'Settings',
          subtitle: '오디오, 그래픽, 화면 옵션을 조정합니다.',
        })}

        <div class="sv-body">

          <nav class="sv-sidenav" aria-label="설정 탭">
            ${SETTINGS_TABS.map((tab) => renderSettingsNavItem(tab.id, this._tab)).join('')}
          </nav>

          <div class="sv-content ss-scroll" role="tabpanel">
            ${this._renderActiveSection()}
          </div>

        </div>

        ${renderSubscreenFooter({
          footerClass: 'sv-footer',
          backButtonClass: 'sv-btn sv-btn-back',
          beforeBack: `
            <button class="sv-btn sv-btn-reset" type="button">기본값 초기화</button>
            <div class="sv-footer-right">
          `,
          afterBack: `
              <button class="sv-btn sv-btn-primary" type="button">저장하고 닫기</button>
            </div>
          `,
        })}

      </div>
    `;
    this._bindEvents();
  }

  _renderActiveSection() {
    if (this._tab === 'audio') return renderSettingsAudioSection(this._opts);
    if (this._tab === 'graphics') return renderSettingsGraphicsSection(this._opts);
    if (this._tab === 'display') return renderSettingsDisplaySection(this._opts);
    if (this._tab === 'data') return renderSettingsDataSection(this._dataState);
    return renderSettingsControlsSection(this._opts);
  }

  _bindEvents() {
    this.el.querySelectorAll('.sv-nav-item').forEach((item, index, list) => {
      const activate = () => {
        this._tab = item.dataset.tab;
        this._render();
      };
      item.addEventListener('click', activate);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
          return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault();
          list[(index + 1) % list.length]?.focus();
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault();
          list[(index - 1 + list.length) % list.length]?.focus();
        }
      });
    });

    this.el.querySelectorAll('.sv-slider').forEach((slider) => {
      slider.addEventListener('input', () => {
        const key = slider.dataset.key;
        this._opts[key] = Number(slider.value);
        const valueEl = this.el.querySelector(`#sv-val-${key}`);
        if (valueEl) valueEl.textContent = slider.value;
      });
    });

    this.el.querySelectorAll('.sv-switch').forEach((toggleEl) => {
      const toggle = () => {
        const key = toggleEl.dataset.key;
        this._opts[key] = !this._opts[key];
        toggleEl.classList.toggle('sv-switch-on', this._opts[key]);
        toggleEl.setAttribute('aria-checked', String(this._opts[key]));
      };
      toggleEl.addEventListener('click', toggle);
      toggleEl.addEventListener('keydown', (event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          toggle();
        }
      });
    });

    this.el.querySelectorAll('.sv-binding-select').forEach((selectEl) => {
      selectEl.addEventListener('change', () => {
        const action = selectEl.dataset.bindingAction;
        const slotIndex = Number(selectEl.dataset.bindingSlot ?? 0);
        const keyBindings = {
          ...(this._opts.keyBindings ?? {}),
          [action]: [...(this._opts.keyBindings?.[action] ?? [])],
        };
        keyBindings[action][slotIndex] = selectEl.value;
        keyBindings[action] = keyBindings[action].filter(Boolean);
        this._opts = normalizeSessionOptions({
          ...this._opts,
          keyBindings,
        });
      });
    });

    this.el.querySelectorAll('.sv-quality-card').forEach((card, index, list) => {
      const select = () => {
        this._opts.quality = card.dataset.quality;
        this.el.querySelectorAll('.sv-quality-card').forEach((qualityCard) => {
          const active = qualityCard.dataset.quality === this._opts.quality;
          qualityCard.classList.toggle('sv-quality-active', active);
          qualityCard.setAttribute('aria-checked', String(active));
          qualityCard.tabIndex = active ? 0 : -1;
        });
      };
      card.addEventListener('click', select);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select();
          return;
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          list[(index + 1) % list.length]?.focus();
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          list[(index - 1 + list.length) % list.length]?.focus();
        }
      });
    });

    const dataTextarea = this.el.querySelector('.sv-data-textarea');
    if (dataTextarea) {
      dataTextarea.value = this._dataState.importText;
      dataTextarea.addEventListener('input', () => {
        this._dataState.importText = dataTextarea.value;
      });
    }

    this.el.querySelector('[data-action="export-session"]')?.addEventListener('click', () => {
      const snapshot = this._handlers.onExport?.();
      if (typeof snapshot === 'string') {
        this._dataState.importText = snapshot;
        this._dataState.statusText = '현재 세션 스냅샷을 내보냈습니다.';
        this._dataState.detailLines = [];
        this._render();
      }
    });

    this.el.querySelector('[data-action="inspect-storage"]')?.addEventListener('click', () => {
      const result = this._handlers.onInspect?.();
      this._applyDataResult(result, '저장소 슬롯 상태를 분석했습니다.');
    });

    this.el.querySelector('[data-action="preview-import"]')?.addEventListener('click', () => {
      const result = this._handlers.onPreviewImport?.(this._dataState.importText);
      this._applyDataResult(result, '세션 스냅샷 미리보기를 생성했습니다.');
    });

    this.el.querySelector('[data-action="restore-backup"]')?.addEventListener('click', () => {
      const result = this._handlers.onRestoreBackup?.();
      this._applyDataResult(result, 'backup 슬롯으로부터 세션을 복구했습니다.');
    });

    this.el.querySelector('[data-action="import-session"]')?.addEventListener('click', () => {
      const result = this._handlers.onImport?.(this._dataState.importText);
      this._applyDataResult(result, '세션 스냅샷을 가져왔습니다.');
    });

    this.el.querySelector('[data-action="reset-session"]')?.addEventListener('click', () => {
      const result = this._handlers.onReset?.();
      this._applyDataResult(result, '진행 데이터를 초기화했습니다.');
    });

    this.el.querySelector('.sv-btn-primary')?.addEventListener('click', () => {
      this._onSave?.({ ...this._opts });
    });

    this.el.querySelector('.sv-btn-back')?.addEventListener('click', () => {
      this._onBack?.();
    });

    this.el.querySelector('.sv-btn-reset')?.addEventListener('click', () => {
      this._opts = normalizeSessionOptions(OPTION_DEFAULTS);
      this._render();
    });
  }

  _normalizeHandlers(onSave, onBack) {
    if (typeof onSave === 'function' || typeof onBack === 'function') {
      return {
        onSave,
        onBack,
        onExport: null,
        onInspect: null,
        onPreviewImport: null,
        onImport: null,
        onReset: null,
        onRestoreBackup: null,
      };
    }

    const handlers = onSave ?? {};
    return {
      onSave: handlers.onSave ?? null,
      onBack: handlers.onBack ?? null,
      onExport: handlers.onExport ?? null,
      onInspect: handlers.onInspect ?? null,
      onPreviewImport: handlers.onPreviewImport ?? null,
      onImport: handlers.onImport ?? null,
      onReset: handlers.onReset ?? null,
      onRestoreBackup: handlers.onRestoreBackup ?? null,
    };
  }

  _applyDataResult(result, fallbackStatus) {
    if (!result) return;

    if (typeof result.snapshot === 'string') {
      this._dataState.importText = result.snapshot;
    }

    this._dataState.statusText = result.message ?? fallbackStatus;
    this._dataState.detailLines = Array.isArray(result.detailLines) ? [...result.detailLines] : [];

    if (result.options) {
      this._opts = normalizeSessionOptions(result.options);
    }

    this._render();
  }

  _injectStyles() {
    if (document.getElementById(SETTINGS_VIEW_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SETTINGS_VIEW_STYLE_ID;
    style.textContent = SETTINGS_VIEW_CSS;
    document.head.appendChild(style);
  }
}
