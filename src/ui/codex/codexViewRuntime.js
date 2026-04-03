import { buildCodexDiscoverySummary } from './codexRecords.js';
import {
  syncCodexTabPanels,
} from './codexViewBindings.js';
import {
  renderCodexAccessoryPanel,
  renderCodexEnemyPanel,
  renderCodexRecordsPanel,
  renderCodexWeaponPanel,
} from './codexViewControllers.js';
import {
  getCodexTabSummaryText,
} from './codexViewShell.js';
import {
  syncCodexShellState,
} from './codexViewRenderState.js';
import { setCodexActiveTab } from './codexViewState.js';

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
  syncCodexTabSummaryImpl = (root, activeTab) => {
    const summary = root?.querySelector?.('.cx-tab-summary');
    if (summary) {
      summary.textContent = getCodexTabSummaryText(activeTab);
    }
  },
} = {}) {
  setCodexActiveTabImpl(view._state, tabName);
  syncCodexTabPanelsImpl(view.el, view._state.activeTab);
  syncCodexTabSummaryImpl(view.el, view._state.activeTab);
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
  syncCodexShellStateImpl = syncCodexShellState,
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

  syncCodexShellStateImpl(view, {
    discovery,
    activeTab: view._state.activeTab,
    totalEnemies,
    totalWeapons,
    totalAccessories,
  });
  renderCodexPanelsRuntimeImpl(view);
  activateCodexTabRuntimeImpl(view, view._state.activeTab);
}

export function bindCodexViewRuntime(view) {
  const root = view?.el;
  if (!root?.addEventListener) return () => {};

  const onClick = (event) => {
    const tabButton = event.target?.closest?.('.cx-tab');
    if (tabButton && root.contains?.(tabButton)) {
      activateCodexTabRuntime(view, tabButton.dataset.tab ?? 'enemy');
      return;
    }

    const backButton = event.target?.closest?.('#cx-back-btn');
    if (backButton && root.contains?.(backButton)) {
      view._onBack?.();
    }
  };

  const onKeyDown = (event) => {
    const tabButton = event.target?.closest?.('.cx-tab');
    if (!tabButton || !root.contains?.(tabButton)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateCodexTabRuntime(view, tabButton.dataset.tab ?? 'enemy');
    }
  };

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
  };
}
