/**
 * src/ui/levelup/LevelUpView.js — 레벨업 / 상자 보상 카드 선택 UI
 *
 * CHANGE: show()에 title 파라미터 추가
 *   - 레벨업: '⬆ LEVEL UP'
 *   - 상자 보상: '📦 상자 보상!'
 *   - 카드 스타일은 동일하게 유지
 */
import {
  disposeDialogRuntime,
  replaceDialogRuntime,
} from '../shared/dialogViewLifecycle.js';
import { bindLevelUpCardInteractions } from './levelUpViewInteractions.js';
import { ensureLevelUpViewStyles } from './levelUpViewStyles.js';
import {
  bindLevelUpViewRuntime,
  renderLevelUpViewRuntime,
} from './levelUpViewRuntime.js';

export class LevelUpView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'levelup-overlay';
    this.el.style.display = 'none';
    ensureLevelUpViewStyles();
    container.appendChild(this.el);
    this._onSelect = null;
    this._onReroll = null;
    this._onToggleBanishMode = null;
    this._dialogRuntime = null;
    this._choices = [];
    this._runtimeDisposer = bindLevelUpViewRuntime(this, {
      bindLevelUpCardInteractionsImpl: bindLevelUpCardInteractions,
    });
  }

  /**
   * @param {object} config
   */
  show(config = {}) {
    const {
      choices = [],
      onSelect = null,
      onReroll = null,
      onToggleBanishMode = null,
      title = '⬆ LEVEL UP',
      rerollsRemaining = 0,
      banishesRemaining = 0,
      banishMode = false,
    } = config;

    this._onSelect = onSelect;
    this._onReroll = onReroll;
    this._onToggleBanishMode = onToggleBanishMode;
    this._dialogRuntime = replaceDialogRuntime(this._dialogRuntime, {
      root: this.el,
      panelSelector: '.levelup-stage',
    });

    renderLevelUpViewRuntime(this, {
      choices,
      title,
      rerollsRemaining,
      banishesRemaining,
      banishMode,
    });

    this.el.style.display = 'flex';
    this._dialogRuntime.focusInitial();
  }

  hide() {
    this._dialogRuntime = disposeDialogRuntime(this._dialogRuntime);
    this.el.style.display = 'none';
    this.el.innerHTML = '';
    this._onSelect = null;
    this._onReroll = null;
    this._onToggleBanishMode = null;
    this._choices = [];
  }

  _pick(upgrade, index) {
    const onSelect = this._onSelect;
    this.hide();
    if (onSelect) onSelect(upgrade, index);
  }

  destroy() {
    this._dialogRuntime = disposeDialogRuntime(this._dialogRuntime, { restoreFocus: false });
    this._runtimeDisposer?.();
    this.el.remove();
  }
}
