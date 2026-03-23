import { SESSION_OPTION_DEFAULTS } from '../../state/sessionOptions.js';
import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';
import {
  SETTINGS_TABS,
  renderSettingsAudioSection,
  renderSettingsControlsSection,
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

const OPTION_DEFAULTS = { ...SESSION_OPTION_DEFAULTS };

export class SettingsView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'sv-root ss-root';
    this._onSave = null;
    this._onBack = null;
    this._opts = { ...OPTION_DEFAULTS };
    this._tab = 'audio';
    this._injectStyles();
    container.appendChild(this.el);

    this._handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        this._onBack?.();
      }
    };
  }

  show(session, onSave, onBack) {
    this._onSave = onSave;
    this._onBack = onBack;
    this._opts = { ...OPTION_DEFAULTS, ...(session.options ?? {}) };
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

    this.el.querySelector('.sv-btn-primary')?.addEventListener('click', () => {
      this._onSave?.({ ...this._opts });
    });

    this.el.querySelector('.sv-btn-back')?.addEventListener('click', () => {
      this._onBack?.();
    });

    this.el.querySelector('.sv-btn-reset')?.addEventListener('click', () => {
      this._opts = { ...OPTION_DEFAULTS };
      this._render();
    });
  }

  _injectStyles() {
    if (document.getElementById(SETTINGS_VIEW_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SETTINGS_VIEW_STYLE_ID;
    style.textContent = SETTINGS_VIEW_CSS;
    document.head.appendChild(style);
  }
}
