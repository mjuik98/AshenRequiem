import {
  renderMetaShopCurrencyBar,
  renderMetaShopDetailPanel,
  renderMetaShopMarkup,
  renderMetaShopStateSections,
  renderMetaShopToolbar,
} from './metaShopMarkup.js';

function captureMetaShopShellRefs(view) {
  view._shellRefs = {
    panel: view.el.querySelector('.ms-panel'),
    currencyBar: view.el.querySelector('.ms-currency-bar'),
    toolbar: view.el.querySelector('.ms-toolbar'),
    detailPanel: view.el.querySelector('.ms-detail-panel'),
    sectionsRoot: view.el.querySelector('.ms-sections-root'),
  };
}

export function renderMetaShopShell(viewModel = {}) {
  return renderMetaShopMarkup(viewModel);
}

export function syncMetaShopShellState(view, viewModel = {}) {
  const panelScrollTop = view._shellRefs?.panel?.scrollTop ?? 0;

  if (!view?._shellRefs?.panel) {
    view.el.innerHTML = renderMetaShopShell(viewModel);
    captureMetaShopShellRefs(view);
  } else {
    const activeCard = viewModel.selectedCard
      ?? viewModel.availableCards?.[0]
      ?? viewModel.completedCards?.[0]
      ?? null;
    view._shellRefs.currencyBar.innerHTML = renderMetaShopCurrencyBar(viewModel);
    view._shellRefs.toolbar.innerHTML = renderMetaShopToolbar(viewModel);
    view._shellRefs.detailPanel.innerHTML = renderMetaShopDetailPanel({ activeCard });
    view._shellRefs.sectionsRoot.innerHTML = renderMetaShopStateSections(viewModel);
  }

  if (view._shellRefs?.panel) {
    view._shellRefs.panel.scrollTop = panelScrollTop;
  }
}
