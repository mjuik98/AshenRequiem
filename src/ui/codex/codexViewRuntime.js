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
  setCodexActiveTab,
} from './codexViewState.js';

export function renderCodexPanelsRuntime(view, {
  renderCodexEnemyPanelImpl = renderCodexEnemyPanel,
  renderCodexWeaponPanelImpl = renderCodexWeaponPanel,
  renderCodexAccessoryPanelImpl = renderCodexAccessoryPanel,
  renderCodexRecordsPanelImpl = renderCodexRecordsPanel,
  showCodexAccessoryRuntimeImpl = showCodexAccessoryRuntime,
  showCodexWeaponRuntimeImpl = showCodexWeaponRuntime,
} = {}) {
  renderCodexEnemyPanelImpl(view.el, {
    state: view._state,
    gameData: view._gameData,
    session: view._session,
  });
  renderCodexWeaponPanelImpl(view.el, {
    state: view._state,
    gameData: view._gameData,
    session: view._session,
    onAccessoryRef: (accessoryId) => showCodexAccessoryRuntimeImpl(view, accessoryId),
  });
  renderCodexAccessoryPanelImpl(view.el, {
    state: view._state,
    gameData: view._gameData,
    session: view._session,
    onWeaponRef: (weaponId) => showCodexWeaponRuntimeImpl(view, weaponId),
  });
  renderCodexRecordsPanelImpl(view.el, {
    session: view._session,
    gameData: view._gameData,
  });
}

export function activateCodexTabRuntime(view, tabName, {
  setCodexActiveTabImpl = setCodexActiveTab,
  syncCodexTabPanelsImpl = syncCodexTabPanels,
} = {}) {
  setCodexActiveTabImpl(view._state, tabName);
  syncCodexTabPanelsImpl(view.el, view._state.activeTab);
  return view._state.activeTab;
}

export function showCodexAccessoryRuntime(view, accessoryId, {
  activateCodexTabRuntimeImpl = activateCodexTabRuntime,
  renderCodexPanelsRuntimeImpl = renderCodexPanelsRuntime,
} = {}) {
  view._state.selectedAccessoryId = accessoryId;
  activateCodexTabRuntimeImpl(view, 'accessory');
  renderCodexPanelsRuntimeImpl(view);
}

export function showCodexWeaponRuntime(view, weaponId, {
  activateCodexTabRuntimeImpl = activateCodexTabRuntime,
  renderCodexPanelsRuntimeImpl = renderCodexPanelsRuntime,
} = {}) {
  view._state.selectedWeaponId = weaponId;
  activateCodexTabRuntimeImpl(view, 'weapon');
  renderCodexPanelsRuntimeImpl(view);
}

export function renderCodexViewRuntime(view, {
  buildCodexDiscoverySummaryImpl = buildCodexDiscoverySummary,
  renderCodexViewShellImpl = renderCodexViewShell,
  bindCodexTabButtonsImpl = bindCodexTabButtons,
  renderCodexPanelsRuntimeImpl = renderCodexPanelsRuntime,
  activateCodexTabRuntimeImpl = activateCodexTabRuntime,
} = {}) {
  const discovery = buildCodexDiscoverySummaryImpl({
    session: view._session,
    gameData: view._gameData,
  });
  const totalEnemies = discovery.entries.find((entry) => entry.label === '적')?.total ?? 0;
  const totalWeapons = discovery.entries.find((entry) => entry.label === '무기')?.total ?? 0;
  const totalAccessories = discovery.entries.find((entry) => entry.label === '장신구')?.total ?? 0;

  view.el.innerHTML = renderCodexViewShellImpl({
    discovery,
    activeTab: view._state.activeTab,
    totalEnemies,
    totalWeapons,
    totalAccessories,
  });

  bindCodexTabButtonsImpl(view.el, (tabName) => activateCodexTabRuntimeImpl(view, tabName));
  renderCodexPanelsRuntimeImpl(view);

  view.el.querySelector('#cx-back-btn')
    ?.addEventListener('click', () => view._onBack?.());
}
