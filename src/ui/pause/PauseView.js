import { renderActionButton } from '../shared/actionButtonTheme.js';
import {
  renderPauseHeader,
  renderPauseTabNavigation,
  renderPauseTabPanels,
} from './pauseViewSections.js';
import {
  buildPauseLoadoutItems,
  renderPauseLoadoutPanel,
} from './pauseLoadoutContent.js';
import { renderPauseStats } from './pauseStatsContent.js';
import {
  PAUSE_AUDIO_DEFAULTS,
  renderPauseSoundControls,
} from './pauseAudioControls.js';
import {
  buildPauseTooltipBindingEntries,
} from './pauseTooltipController.js';
import { bindPauseAudioControls } from './pauseAudioController.js';
import {
  applyPauseTabState,
  bindPauseLoadoutCards,
  emitPauseOptionsChange,
} from './pauseViewBindings.js';
import { bindPauseTooltipEntries } from './pauseTooltipBindings.js';
import {
  applyPauseViewShowState,
  resetPauseViewRuntime,
} from './pauseViewLifecycle.js';
import {
  ensurePauseTooltip,
  hidePauseTooltip,
  positionPauseTooltip,
  showPauseTooltip,
} from './pauseViewTooltip.js';
import {
  PAUSE_VIEW_CSS,
  PAUSE_VIEW_STYLE_ID,
} from './pauseStyles.js';
import { formatWeaponSynergyBonus } from './pauseTooltipContent.js';
import {
  formatPauseElapsedTime,
} from './pauseViewModel.js';
import { renderPauseViewShell } from './pauseViewShell.js';
import {
  bindPauseFooterActions,
  bindPauseInteractionHandlers,
} from './pauseViewInteractions.js';

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

    this._render(player, world);
    this._bindTooltips(player);
    this._bindAudioControls();
    this._bindKeyboard();

    this.el.setAttribute('aria-hidden', 'false');
    this.el.style.display = 'flex';
  }

  hide() {
    this._tooltipBinding?.dispose();
    this._tooltipBinding = null;
    this._hideTooltip();
    this._unbindKeyboard();
    this.el.setAttribute('aria-hidden', 'true');
    this.el.style.display = 'none';
    resetPauseViewRuntime(this);
  }

  isVisible() {
    return this.el.style.display !== 'none';
  }

  destroy() {
    this._tooltipBinding?.dispose();
    this._tooltipBinding = null;
    this._unbindKeyboard();
    this._tt?.remove();
    this._tt = null;
    resetPauseViewRuntime(this, { clearSelection: true });
    this.el.remove();
  }

  _render(player, world) {
    const weapons = player.weapons ?? [];
    const activeSynergyIds = new Set(player.activeSynergies ?? []);
    const synergyData = this._data?.synergyData ?? [];
    const activeSynergies = synergyData.filter((synergy) => activeSynergyIds.has(synergy.id));

    const hp = Math.ceil(player.hp ?? 0);
    const maxHp = Math.max(1, Math.ceil(player.maxHp ?? 100));
    const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const hpFillClass = hpPct <= 30 ? 'low' : hpPct <= 60 ? 'mid' : 'high';
    const hpPctColor = hpPct <= 30 ? '#e74c3c' : hpPct <= 60 ? '#e67e22' : 'rgba(255,255,255,0.55)';
    const hpFillColor = hpPct <= 30 ? '#e74c3c' : hpPct <= 60 ? '#e67e22' : '#c0392b';

    const elapsed = world?.elapsedTime ?? null;
    const killCount = world?.killCount ?? null;
    const level = player.level ?? 1;
    const timeStr = elapsed != null ? formatPauseElapsedTime(elapsed) : '--:--';
    const killStr = killCount != null ? killCount : '—';
    const loadoutPanelHtml = renderPauseLoadoutPanel({
      items: this._loadoutItems,
      selectedItemKey: this._selectedLoadoutKey,
      player,
      data: this._data,
      indexes: this._indexes,
    });
    const statsHtml = renderPauseStats({
      player,
      activeSynergies,
      session: this._session,
      formatSynergyBonus: formatWeaponSynergyBonus,
    });
    const soundControlsHtml = renderPauseSoundControls(this._pauseOptions);
    void renderActionButton;
    void renderPauseHeader;
    void renderPauseTabNavigation;
    void renderPauseTabPanels;
    void buildPauseLoadoutItems;
    this.el.innerHTML = renderPauseViewShell({
      activeTabName: this._activeTabName,
      timeStr,
      killStr,
      level,
      hp,
      maxHp,
      hpPct,
      hpFillClass,
      hpFillColor,
      hpPctColor,
      weaponCount: weapons.length,
      maxWpnSlots: player.maxWeaponSlots ?? 3,
      accessoryCount: player.accessories?.length ?? 0,
      maxAccSlots: player.maxAccessorySlots ?? 3,
      loadoutPanelHtml,
      statsHtml,
      soundControlsHtml,
      showForfeitButton: Boolean(this._onForfeit),
    });

    bindPauseFooterActions(this.el, {
      onResume: this._onResume,
      onForfeit: this._onForfeit,
      isClosingToMenu: () => this._isClosingToMenu,
    });
    bindPauseInteractionHandlers(this.el, {
      onActivateTabName: (name) => this._activateTab(name),
      onSelectLoadoutKey: (key) => this._selectLoadoutItem(key),
    });
  }

  _bindLoadoutSelection() {
    bindPauseLoadoutCards(this.el, (key) => this._selectLoadoutItem(key));
  }

  _selectLoadoutItem(selectedLoadoutKey) {
    if (!selectedLoadoutKey || this._selectedLoadoutKey === selectedLoadoutKey) return;
    this._selectedLoadoutKey = selectedLoadoutKey;
    this._renderLoadoutPanel();
  }

  _renderLoadoutPanel() {
    const panel = this.el.querySelector('#pv-tab-loadout');
    if (!panel || !this._player) return;

    panel.innerHTML = renderPauseLoadoutPanel({
      items: this._loadoutItems,
      selectedItemKey: this._selectedLoadoutKey,
      player: this._player,
      data: this._data,
      indexes: this._indexes,
    });
    this._bindLoadoutSelection();
    this._bindTooltips(this._player);
  }

  _activateTab(name) {
    if (!name) return;
    this._activeTabName = name;
    applyPauseTabState(this.el, name);
  }

  _bindAudioControls() {
    bindPauseAudioControls(this.el, () => this._pauseOptions, (nextOptions) => {
      this._pauseOptions = nextOptions;
      this._emitOptionsChange();
    });
  }

  _emitOptionsChange() {
    emitPauseOptionsChange(this._onOptionsChange, this._pauseOptions);
  }

  _bindTooltips(player) {
    this._tooltipBinding?.dispose();
    this._tooltipBinding = bindPauseTooltipEntries({
      root: this.el,
      tooltip: this._tt,
      entries: buildPauseTooltipBindingEntries({
        player,
        data: this._data,
        indexes: this._indexes,
      }),
      ensureTooltip: (tooltip, documentRef) => ensurePauseTooltip(tooltip, documentRef),
      showTooltip: showPauseTooltip,
      hideTooltip: (tooltip) => hidePauseTooltip(tooltip),
      positionTooltip: (tooltip, event) => positionPauseTooltip(tooltip, event, window),
      documentRef: document,
    });
    this._tt = this._tooltipBinding.tooltip;
  }

  _hideTooltip() {
    hidePauseTooltip(this._tt);
  }

  _positionTooltip(event) {
    positionPauseTooltip(this._tt, event, window);
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
