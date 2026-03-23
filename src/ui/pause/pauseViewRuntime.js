import { renderPauseLoadoutPanel } from './pauseLoadoutContent.js';
import { renderPauseStats } from './pauseStatsContent.js';
import {
  renderPauseSoundControls,
} from './pauseAudioControls.js';
import {
  buildPauseTooltipBindingEntries,
} from './pauseTooltipController.js';
import { bindPauseAudioControls } from './pauseAudioController.js';
import {
  bindPauseLoadoutCards,
  emitPauseOptionsChange,
} from './pauseViewBindings.js';
import { bindPauseTooltipEntries } from './pauseTooltipBindings.js';
import {
  ensurePauseTooltip,
  hidePauseTooltip,
  positionPauseTooltip,
  showPauseTooltip,
} from './pauseViewTooltip.js';
import { formatWeaponSynergyBonus } from './pauseTooltipContent.js';
import {
  formatPauseElapsedTime,
} from './pauseViewModel.js';
import { renderPauseViewShell } from './pauseViewShell.js';
import {
  bindPauseFooterActions,
  bindPauseInteractionHandlers,
} from './pauseViewInteractions.js';

function bindPauseTooltipRuntime(view, {
  buildPauseTooltipBindingEntriesImpl = buildPauseTooltipBindingEntries,
  bindPauseTooltipEntriesImpl = bindPauseTooltipEntries,
  ensurePauseTooltipImpl = ensurePauseTooltip,
  showPauseTooltipImpl = showPauseTooltip,
  hidePauseTooltipImpl = hidePauseTooltip,
  positionPauseTooltipImpl = positionPauseTooltip,
  documentRef = document,
  windowRef = window,
} = {}) {
  view._tooltipBinding?.dispose();
  view._tooltipBinding = bindPauseTooltipEntriesImpl({
    root: view.el,
    tooltip: view._tt,
    entries: buildPauseTooltipBindingEntriesImpl({
      player: view._player,
      data: view._data,
      indexes: view._indexes,
    }),
    ensureTooltip: (tooltip, nextDocumentRef) => ensurePauseTooltipImpl(tooltip, nextDocumentRef),
    showTooltip: showPauseTooltipImpl,
    hideTooltip: (tooltip) => hidePauseTooltipImpl(tooltip),
    positionTooltip: (tooltip, event) => positionPauseTooltipImpl(tooltip, event, windowRef),
    documentRef,
  });
  view._tt = view._tooltipBinding.tooltip;
}

export function renderPauseViewRuntime(view, {
  renderPauseLoadoutPanelImpl = renderPauseLoadoutPanel,
  renderPauseStatsImpl = renderPauseStats,
  renderPauseSoundControlsImpl = renderPauseSoundControls,
  renderPauseViewShellImpl = renderPauseViewShell,
  bindPauseFooterActionsImpl = bindPauseFooterActions,
  bindPauseInteractionHandlersImpl = bindPauseInteractionHandlers,
  formatPauseElapsedTimeImpl = formatPauseElapsedTime,
  formatSynergyBonusImpl = formatWeaponSynergyBonus,
} = {}) {
  const player = view._player;
  const world = view._world;
  if (!player) return;

  const weapons = player.weapons ?? [];
  const activeSynergyIds = new Set(player.activeSynergies ?? []);
  const synergyData = view._data?.synergyData ?? [];
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
  const timeStr = elapsed != null ? formatPauseElapsedTimeImpl(elapsed) : '--:--';
  const killStr = killCount != null ? killCount : '—';
  const loadoutPanelHtml = renderPauseLoadoutPanelImpl({
    items: view._loadoutItems,
    selectedItemKey: view._selectedLoadoutKey,
    player,
    data: view._data,
    indexes: view._indexes,
  });
  const statsHtml = renderPauseStatsImpl({
    player,
    activeSynergies,
    session: view._session,
    formatSynergyBonus: formatSynergyBonusImpl,
  });
  const soundControlsHtml = renderPauseSoundControlsImpl(view._pauseOptions);

  view.el.innerHTML = renderPauseViewShellImpl({
    activeTabName: view._activeTabName,
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
    showForfeitButton: Boolean(view._onForfeit),
  });

  bindPauseFooterActionsImpl(view.el, {
    onResume: view._onResume,
    onForfeit: view._onForfeit,
    isClosingToMenu: () => view._isClosingToMenu,
  });
  bindPauseInteractionHandlersImpl(view.el, {
    onActivateTabName: (name) => view._activateTab(name),
    onSelectLoadoutKey: (key) => view._selectLoadoutItem(key),
  });
}

export function refreshPauseLoadoutPanelRuntime(view, {
  renderPauseLoadoutPanelImpl = renderPauseLoadoutPanel,
  bindPauseLoadoutCardsImpl = bindPauseLoadoutCards,
  bindPauseTooltipRuntimeImpl = bindPauseTooltipRuntime,
} = {}) {
  const panel = view.el.querySelector('#pv-tab-loadout');
  if (!panel || !view._player) return;

  panel.innerHTML = renderPauseLoadoutPanelImpl({
    items: view._loadoutItems,
    selectedItemKey: view._selectedLoadoutKey,
    player: view._player,
    data: view._data,
    indexes: view._indexes,
  });
  bindPauseLoadoutCardsImpl(view.el, (key) => view._selectLoadoutItem(key));
  bindPauseTooltipRuntimeImpl(view);
}

export function bindPauseViewRuntime(view, {
  bindPauseTooltipRuntimeImpl = bindPauseTooltipRuntime,
  bindPauseAudioControlsImpl = bindPauseAudioControls,
  emitPauseOptionsChangeImpl = emitPauseOptionsChange,
} = {}) {
  bindPauseTooltipRuntimeImpl(view);
  bindPauseAudioControlsImpl(view.el, () => view._pauseOptions, (nextOptions) => {
    view._pauseOptions = nextOptions;
    emitPauseOptionsChangeImpl(view._onOptionsChange, view._pauseOptions);
  });
}

export function disposePauseViewRuntime(view, {
  hidePauseTooltipImpl = hidePauseTooltip,
} = {}) {
  view._tooltipBinding?.dispose();
  view._tooltipBinding = null;
  hidePauseTooltipImpl(view._tt);
}
