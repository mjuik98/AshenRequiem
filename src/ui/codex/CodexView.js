import { buildCodexDiscoverySummary } from './codexRecords.js';
import {
  bindCodexTabButtons,
  syncCodexTabPanels,
} from './codexViewBindings.js';
import {
  renderCodexAccessoryPanel,
  renderCodexEnemyPanel,
  renderCodexRecordsPanel,
  renderCodexWeaponPanel,
} from './codexViewControllers.js';
import { renderCodexViewShell } from './codexViewShell.js';
import {
  createCodexViewState,
  resetCodexViewState,
  setCodexActiveTab,
} from './codexViewState.js';
import { CODEX_VIEW_CSS, CODEX_VIEW_STYLE_ID } from './codexStyles.js';

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
    const discovery = buildCodexDiscoverySummary({
      session: this._session,
      gameData: this._gameData,
    });
    const totalEnemies = discovery.entries.find((entry) => entry.label === '적')?.total ?? 0;
    const totalWeapons = discovery.entries.find((entry) => entry.label === '무기')?.total ?? 0;
    const totalAccessories = discovery.entries.find((entry) => entry.label === '장신구')?.total ?? 0;

    this.el.innerHTML = renderCodexViewShell({
      discovery,
      activeTab: this._state.activeTab,
      totalEnemies,
      totalWeapons,
      totalAccessories,
    });

    this._bindTabEvents();
    this._renderPanels();

    this.el.querySelector('#cx-back-btn')
      ?.addEventListener('click', () => this._onBack?.());
  }

  _bindTabEvents() {
    bindCodexTabButtons(this.el, (tabName) => this._setActiveTab(tabName));
  }

  _setActiveTab(tabName) {
    setCodexActiveTab(this._state, tabName);
    syncCodexTabPanels(this.el, this._state.activeTab);
  }

  _showAccessoryCodex(accessoryId) {
    this._state.selectedAccessoryId = accessoryId;
    this._setActiveTab('accessory');
    this._renderPanels();
  }

  _showWeaponCodex(weaponId) {
    this._state.selectedWeaponId = weaponId;
    this._setActiveTab('weapon');
    this._renderPanels();
  }

  _renderPanels() {
    renderCodexEnemyPanel(this.el, {
      state: this._state,
      gameData: this._gameData,
      session: this._session,
    });
    renderCodexWeaponPanel(this.el, {
      state: this._state,
      gameData: this._gameData,
      session: this._session,
      onAccessoryRef: (accessoryId) => this._showAccessoryCodex(accessoryId),
    });
    renderCodexAccessoryPanel(this.el, {
      state: this._state,
      gameData: this._gameData,
      session: this._session,
      onWeaponRef: (weaponId) => this._showWeaponCodex(weaponId),
    });
    renderCodexRecordsPanel(this.el, {
      session: this._session,
      gameData: this._gameData,
    });
  }

  _injectStyles() {
    if (document.getElementById(CODEX_VIEW_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = CODEX_VIEW_STYLE_ID;
    style.textContent = CODEX_VIEW_CSS;
    document.head.appendChild(style);
  }
}
