import { renderActionButton } from '../shared/actionButtonTheme.js';
import {
  renderPauseHeader,
  renderPauseTabNavigation,
  renderPauseTabPanels,
} from './pauseViewSections.js';
import {
  buildPauseLoadoutItems,
  getDefaultPauseSelection,
  normalizePauseSynergyRequirementId,
  renderPauseLoadoutPanel,
} from './pauseLoadoutContent.js';
import { renderPauseStats } from './pauseStatsContent.js';
import {
  PAUSE_AUDIO_DEFAULTS,
  buildNextPauseOptions,
  renderPauseSoundControls,
} from './pauseAudioControls.js';
import {
  buildPauseTooltipBindingEntries,
  computePauseTooltipPosition,
} from './pauseTooltipController.js';
import {
  PAUSE_VIEW_CSS,
  PAUSE_VIEW_STYLE_ID,
} from './pauseStyles.js';
import { formatWeaponSynergyBonus } from './pauseTooltipContent.js';

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
    clearTimeout(this._ttHideTimer);
    this._isClosingToMenu = false;
    this._onResume = onResume;
    this._onForfeit = onForfeit;
    this._onOptionsChange = onOptionsChange;
    this._data = data;
    this._indexes = this._buildIndexes(data);
    this._player = player;
    this._world = world;
    this._session = session;
    this._loadoutItems = buildPauseLoadoutItems({ player });
    this._selectedLoadoutKey = this._resolveSelectedLoadoutKey(this._loadoutItems);
    this._pauseOptions = {
      ...PAUSE_AUDIO_DEFAULTS,
      ...(session?.options ?? {}),
    };
    this._activeTabName = 'loadout';

    this._render(player, world);
    this._bindTooltips(player);
    this._bindAudioControls();
    this._bindKeyboard();

    this.el.setAttribute('aria-hidden', 'false');
    this.el.style.display = 'flex';
  }

  hide() {
    clearTimeout(this._ttHideTimer);
    this._hideTooltip();
    this._unbindKeyboard();
    this.el.setAttribute('aria-hidden', 'true');
    this.el.style.display = 'none';
    this._onResume = null;
    this._onForfeit = null;
    this._onOptionsChange = null;
    this._player = null;
    this._world = null;
    this._session = null;
    this._loadoutItems = [];
    this._pauseOptions = { ...PAUSE_AUDIO_DEFAULTS };
    this._activeTabName = 'loadout';
    this._isClosingToMenu = false;
  }

  isVisible() {
    return this.el.style.display !== 'none';
  }

  destroy() {
    clearTimeout(this._ttHideTimer);
    this._unbindKeyboard();
    this._tt?.remove();
    this._tt = null;
    this._data = null;
    this._indexes = null;
    this._player = null;
    this._world = null;
    this._session = null;
    this._loadoutItems = [];
    this._selectedLoadoutKey = null;
    this._pauseOptions = { ...PAUSE_AUDIO_DEFAULTS };
    this._isClosingToMenu = false;
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
    const timeStr = elapsed != null ? formatTime(elapsed) : '--:--';
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
    const forfeitButton = this._onForfeit
      ? renderActionButton({
          className: 'pv-btn-forfeit',
          id: 'pv-forfeit-btn',
          label: '전투 포기',
          tone: 'danger',
          ariaLabel: '전투 포기',
        })
      : '';
    const resumeButton = renderActionButton({
      className: 'pv-btn-resume',
      id: 'pv-resume-btn',
      label: '재개',
      tone: 'accent',
      ariaLabel: '게임 재개 (ESC)',
      leading: '<span class="pv-btn-arrow" aria-hidden="true"></span>',
      trailing: '<kbd class="pv-kbd">ESC</kbd>',
      stretch: true,
    });

    this.el.innerHTML = `
      <div class="pv-backdrop"></div>
      <div class="pv-panel" role="dialog" aria-label="일시정지 메뉴">
        ${renderPauseHeader({
          timeStr,
          killStr,
          level,
          hp,
          maxHp,
          hpPct,
          hpFillClass,
          hpFillColor,
          hpPctColor,
        })}
        ${renderPauseTabNavigation({
          activeTabName: this._activeTabName,
          weaponCount: weapons.length,
          maxWpnSlots: player.maxWeaponSlots ?? 3,
          accessoryCount: player.accessories?.length ?? 0,
          maxAccSlots: player.maxAccessorySlots ?? 3,
        })}
        ${renderPauseTabPanels({
          activeTabName: this._activeTabName,
          loadoutPanelHtml,
          statsHtml,
          soundControlsHtml,
        })}
        <footer class="pv-footer">
          ${forfeitButton}
          ${resumeButton}
        </footer>
      </div>
    `;

    const resumeBtn = this.el.querySelector('#pv-resume-btn');
    resumeBtn?.addEventListener('click', () => {
      if (this._isClosingToMenu) return;
      this._onResume?.();
    });

    const forfeitBtn = this.el.querySelector('#pv-forfeit-btn');
    forfeitBtn?.addEventListener('click', () => {
      if (this._isClosingToMenu) return;
      this._onForfeit?.();
    });

    this._bindTabs();
    this._bindLoadoutSelection();
  }

  _bindTabs() {
    const tabs = [...this.el.querySelectorAll('.pv-tab')];
    if (tabs.length === 0) return;

    tabs.forEach((tab, index) => {
      const activate = () => this._activateTab(tab.dataset.tabName);
      tab.addEventListener('click', activate);
      tab.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
          return;
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          tabs[(index + 1) % tabs.length]?.focus();
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          tabs[(index - 1 + tabs.length) % tabs.length]?.focus();
        }

        if (event.key === 'Home') {
          event.preventDefault();
          tabs[0]?.focus();
        }

        if (event.key === 'End') {
          event.preventDefault();
          tabs[tabs.length - 1]?.focus();
        }
      });
    });
  }

  _bindLoadoutSelection() {
    this.el.querySelectorAll('.pv-slot-card[data-loadout-key]').forEach((card) => {
      const key = card.dataset.loadoutKey;
      if (!key) return;

      card.addEventListener('click', () => this._selectLoadoutItem(key));
      card.addEventListener('focus', () => this._selectLoadoutItem(key));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this._selectLoadoutItem(key);
        }
      });
    });
  }

  _selectLoadoutItem(selectedLoadoutKey) {
    if (!selectedLoadoutKey || this._selectedLoadoutKey === selectedLoadoutKey) return;
    this._selectedLoadoutKey = selectedLoadoutKey;
    this._renderLoadoutPanel();
  }

  _resolveSelectedLoadoutKey(items) {
    if (!Array.isArray(items) || items.length === 0) return null;
    if (this._selectedLoadoutKey) {
      const current = items.find((item) => item.selectionKey === this._selectedLoadoutKey);
      if (current) return current.selectionKey;
    }

    return (
      items.find((item) => item.kind === 'weapon' || item.kind === 'accessory')?.selectionKey
      ?? getDefaultPauseSelection({ player: this._player })?.selectionKey
      ?? items[0]?.selectionKey
      ?? null
    );
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

    this.el.querySelectorAll('.pv-tab').forEach((tab) => {
      const active = tab.dataset.tabName === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    this.el.querySelectorAll('.pv-tab-content').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `pv-tab-${name}`);
    });
  }

  _bindAudioControls() {
    this.el.querySelectorAll('.pv-audio-slider').forEach((input) => {
      input.addEventListener('input', (event) => {
        const key = event.currentTarget.dataset.soundKey;
        const value = Number(event.currentTarget.value);
        this._pauseOptions = buildNextPauseOptions(this._pauseOptions, {
          type: 'slider',
          key,
          value,
        });
        const valueEl = this.el.querySelector(`#pv-sound-value-${key}`);
        if (valueEl) valueEl.textContent = String(value);
        this._emitOptionsChange();
      });
    });

    this.el.querySelectorAll('.pv-sound-toggle').forEach((button) => {
      button.addEventListener('click', (event) => {
        const key = event.currentTarget.dataset.toggleKey;
        this._pauseOptions = buildNextPauseOptions(this._pauseOptions, {
          type: 'toggle',
          key,
        });
        event.currentTarget.classList.toggle('active', this._pauseOptions[key]);
        event.currentTarget.setAttribute('aria-pressed', String(this._pauseOptions[key]));
        const pill = event.currentTarget.querySelector('.pv-sound-toggle-pill');
        if (pill) pill.textContent = this._pauseOptions[key] ? 'ON' : 'OFF';
        this._emitOptionsChange();
      });
    });
  }

  _emitOptionsChange() {
    this._onOptionsChange?.({ ...this._pauseOptions });
  }

  _buildIndexes(data) {
    const weaponById = new Map((data?.weaponData ?? []).map((weapon) => [weapon?.id, weapon]));
    const accessoryById = new Map((data?.accessoryData ?? []).map((accessory) => [accessory?.id, accessory]));
    const synergiesByWeaponId = new Map();
    const synergiesByAccessoryId = new Map();

    for (const synergy of data?.synergyData ?? []) {
      for (const requirement of synergy?.requires ?? []) {
        const id = normalizePauseSynergyRequirementId(requirement);
        if (!id) continue;

        if (weaponById.has(id)) {
          const list = synergiesByWeaponId.get(id) ?? [];
          list.push(synergy);
          synergiesByWeaponId.set(id, list);
        }

        if (accessoryById.has(id)) {
          const list = synergiesByAccessoryId.get(id) ?? [];
          list.push(synergy);
          synergiesByAccessoryId.set(id, list);
        }
      }
    }

    return { weaponById, accessoryById, synergiesByWeaponId, synergiesByAccessoryId };
  }

  _bindTooltips(player) {
    if (!this._tt) {
      this._tt = document.createElement('div');
      this._tt.className = 'pv-tooltip';
      this._tt.style.display = 'none';
      document.body.appendChild(this._tt);
    }

    const showTip = (element, buildContent, event) => {
      clearTimeout(this._ttHideTimer);
      const html = buildContent(element);
      if (!html?.trim()) return;
      this._tt.innerHTML = html;
      this._tt.style.display = 'block';
      this._positionTooltip(event);
    };
    const hideTip = () => {
      this._ttHideTimer = setTimeout(() => this._hideTooltip(), 80);
    };

    buildPauseTooltipBindingEntries({
      player,
      data: this._data,
      indexes: this._indexes,
    }).forEach(({ selector, buildContent }) => {
      this.el.querySelectorAll(selector).forEach((element) => {
        element.addEventListener('mouseenter', (event) => showTip(element, buildContent, event));
        element.addEventListener('mousemove', (event) => this._positionTooltip(event));
        element.addEventListener('mouseleave', hideTip);
        element.addEventListener('focusin', (event) => showTip(element, buildContent, event));
        element.addEventListener('focusout', hideTip);
      });
    });
  }

  _hideTooltip() {
    if (!this._tt) return;
    this._tt.style.display = 'none';
    this._tt.innerHTML = '';
  }

  _positionTooltip(event) {
    if (!this._tt) return;
    const { x, y } = computePauseTooltipPosition({
      event,
      tooltipWidth: this._tt.offsetWidth || 220,
      tooltipHeight: this._tt.offsetHeight || 100,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
    this._tt.style.left = `${x}px`;
    this._tt.style.top = `${y}px`;
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

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${minutes}:${secs}`;
}
