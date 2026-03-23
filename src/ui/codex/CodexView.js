import {
  createCodexViewState,
  resetCodexViewState,
} from './codexViewState.js';
import { CODEX_VIEW_CSS, CODEX_VIEW_STYLE_ID } from './codexStyles.js';
import {
  activateCodexTabRuntime,
  renderCodexPanelsRuntime,
  renderCodexViewRuntime,
  showCodexAccessoryRuntime,
  showCodexWeaponRuntime,
} from './codexViewRuntime.js';

export class CodexView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'cx-root ss-root';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);

    this._onBack = null;
    /** @type {import('./codexViewState.js').CodexViewState} */
    this._state = createCodexViewState();
    this._gameData = null;
    this._session = null;

    this._handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        this._onBack?.();
      }
    };
  }

  /**
   * @param {object} gameData
   * @param {object} session
   * @param {Function} onBack
   */
  show(gameData, session, onBack) {
    this._onBack = onBack;
    this._gameData = gameData;
    this._session = session;
    resetCodexViewState(this._state);

    this._render();
    this.el.style.display = 'block';
    window.addEventListener('keydown', this._handleKeyDown, true);
  }

  destroy() {
    window.removeEventListener('keydown', this._handleKeyDown, true);
    this.el.remove();
  }

  _render() {
    renderCodexViewRuntime(this);
  }

  _bindTabEvents() {
    renderCodexViewRuntime(this);
  }

  _setActiveTab(tabName) {
    activateCodexTabRuntime(this, tabName);
  }

  _showAccessoryCodex(accessoryId) {
    showCodexAccessoryRuntime(this, accessoryId);
  }

  _showWeaponCodex(weaponId) {
    showCodexWeaponRuntime(this, weaponId);
  }

  _renderPanels() {
    renderCodexPanelsRuntime(this);
  }

  _injectStyles() {
    if (document.getElementById(CODEX_VIEW_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = CODEX_VIEW_STYLE_ID;
    style.textContent = CODEX_VIEW_CSS;
    document.head.appendChild(style);
  }
}
