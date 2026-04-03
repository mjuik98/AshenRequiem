import {
  getCodexTabSummaryText,
  renderCodexProgressPill,
  renderCodexViewShell,
  renderCodexViewTabs,
} from './codexViewShell.js';

function captureCodexShellRefs(view) {
  view._shellRefs = {
    panel: view.el.querySelector('.cx-panel'),
    progressPill: view.el.querySelector('.cx-prog-pill'),
    tabs: view.el.querySelector('.cx-tabs'),
    summary: view.el.querySelector('.cx-tab-summary'),
    content: view.el.querySelector('.cx-content'),
  };
}

export function resetCodexShellState(view) {
  view._shellRefs = null;
}

export function syncCodexShellState(view, options = {}) {
  const {
    discovery = { totalDiscovered: 0, entries: [] },
    activeTab = 'enemy',
    totalEnemies = 0,
    totalWeapons = 0,
    totalAccessories = 0,
  } = options;
  const shellState = {
    discovery,
    activeTab,
    totalEnemies,
    totalWeapons,
    totalAccessories,
  };

  if (!view?._shellRefs?.panel) {
    view.el.innerHTML = renderCodexViewShell(shellState);
    captureCodexShellRefs(view);
    return;
  }

  if (view._shellRefs.progressPill) {
    view._shellRefs.progressPill.textContent = `${discovery.totalDiscovered} / ${totalEnemies + totalWeapons + totalAccessories} 발견됨`;
  }
  if (view._shellRefs.tabs) {
    view._shellRefs.tabs.innerHTML = renderCodexViewTabs({
      discovery,
      activeTab,
    });
  }
  if (view._shellRefs.summary) {
    view._shellRefs.summary.textContent = getCodexTabSummaryText(activeTab);
  }

  captureCodexShellRefs(view);
}
