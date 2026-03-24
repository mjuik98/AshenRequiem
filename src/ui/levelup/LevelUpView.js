/**
 * src/ui/levelup/LevelUpView.js — 레벨업 / 상자 보상 카드 선택 UI
 *
 * CHANGE: show()에 title 파라미터 추가
 *   - 레벨업: '⬆ LEVEL UP'
 *   - 상자 보상: '📦 상자 보상!'
 *   - 카드 스타일은 동일하게 유지
 */
import {
  buildLevelUpCardMarkup,
  buildLevelUpHeaderMarkup,
} from './levelUpContent.js';
import { bindLevelUpCardInteractions } from './levelUpViewInteractions.js';
import { ensureLevelUpViewStyles } from './levelUpViewStyles.js';

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

    this.el.innerHTML = buildLevelUpHeaderMarkup({
      title,
      rerollsRemaining,
      banishesRemaining,
      banishMode,
    });
    const cardsEl = this.el.querySelector('.levelup-cards');
    const toggleButton = this.el.querySelector('.levelup-mode-btn');

    toggleButton?.addEventListener('click', () => {
      this._onToggleBanishMode?.();
    });

    choices.forEach((upgrade, index) => {
      const cardShell = document.createElement('div');
      cardShell.innerHTML = buildLevelUpCardMarkup({
        upgrade,
        index,
        rerollsRemaining,
        banishMode,
      });
      const renderedShell = cardShell.firstElementChild;
      bindLevelUpCardInteractions(renderedShell, {
        index,
        upgrade,
        onPick: (selectedUpgrade, selectedIndex) => this._pick(selectedUpgrade, selectedIndex),
        onReroll: (selectedIndex) => this._onReroll?.(selectedIndex),
      });
      if (renderedShell) {
        cardsEl.appendChild(renderedShell);
      }
    });

    this.el.style.display = 'flex';
  }

  hide() {
    this.el.style.display = 'none';
    this.el.innerHTML = '';
    this._onSelect = null;
    this._onReroll = null;
    this._onToggleBanishMode = null;
  }

  _pick(upgrade, index) {
    const onSelect = this._onSelect;
    this.hide();
    if (onSelect) onSelect(upgrade, index);
  }

  destroy() { this.el.remove(); }
}
