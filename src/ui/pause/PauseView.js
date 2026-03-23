import {
  PAUSE_AUDIO_DEFAULTS,
} from './pauseAudioControls.js';
import {
  applyPauseTabState,
} from './pauseViewBindings.js';
import {
  applyPauseViewShowState,
  resetPauseViewRuntime,
} from './pauseViewLifecycle.js';
import {
  PAUSE_VIEW_CSS,
  PAUSE_VIEW_STYLE_ID,
} from './pauseStyles.js';
import {
  bindPauseViewRuntime,
  disposePauseViewRuntime,
  refreshPauseLoadoutPanelRuntime,
  renderPauseViewRuntime,
} from './pauseViewRuntime.js';

export class PauseView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'pv-overlay';
    this.el.style.display = 'none';
    this.el.setAttribute('aria-hidden', 'true');

    this._onResume = null;
    this._onForfeit = null;
    this._onOptionsChange = null;
    this._onKeyDown = null;
    this._tt = null;
    this._ttHideTimer = null;
    this._tooltipBinding = null;
    this._data = null;
    this._indexes = null;
    this._player = null;
    this._world = null;
    this._session = null;
    this._loadoutItems = [];
    this._selectedLoadoutKey = null;
    this._pauseOptions = { ...PAUSE_AUDIO_DEFAULTS };
    this._activeTabName = 'loadout';
    this._isClosingToMenu = false;

    this._injectStyles();
    container.appendChild(this.el);
  }

  show({
    player,
    data,
    onResume,
    onForfeit = null,
    onOptionsChange = null,
    world = null,
    session = null,
  }) {
    applyPauseViewShowState(this, {
      player,
      data,
      onResume,
      onForfeit,
      onOptionsChange,
      world,
      session,
    });

    renderPauseViewRuntime(this);
    bindPauseViewRuntime(this);
    this._bindKeyboard();

    this.el.setAttribute('aria-hidden', 'false');
    this.el.style.display = 'flex';
  }

  hide() {
    disposePauseViewRuntime(this);
    this._unbindKeyboard();
    this.el.setAttribute('aria-hidden', 'true');
    this.el.style.display = 'none';
    resetPauseViewRuntime(this);
  }

  isVisible() {
    return this.el.style.display !== 'none';
  }

  destroy() {
    disposePauseViewRuntime(this);
    this._unbindKeyboard();
    this._tt?.remove();
    this._tt = null;
    resetPauseViewRuntime(this, { clearSelection: true });
    this.el.remove();
  }

  _render() {
    renderPauseViewRuntime(this);
  }

  _selectLoadoutItem(selectedLoadoutKey) {
    if (!selectedLoadoutKey || this._selectedLoadoutKey === selectedLoadoutKey) return;
    this._selectedLoadoutKey = selectedLoadoutKey;
    this._renderLoadoutPanel();
  }

  _renderLoadoutPanel() {
    refreshPauseLoadoutPanelRuntime(this);
  }

  _activateTab(name) {
    if (!name) return;
    this._activeTabName = name;
    applyPauseTabState(this.el, name);
  }

  _bindKeyboard() {
    this._onKeyDown = () => {
      if (!this.isVisible()) return;
    };
    window.addEventListener('keydown', this._onKeyDown);
  }

  _unbindKeyboard() {
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
  }

  _injectStyles() {
    if (document.getElementById(PAUSE_VIEW_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = PAUSE_VIEW_STYLE_ID;
    style.textContent = PAUSE_VIEW_CSS;
    document.head.appendChild(style);
  }
}
