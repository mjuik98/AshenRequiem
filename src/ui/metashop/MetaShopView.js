import { buildMetaShopViewModel } from '../../app/meta/metaShopViewModelService.js';
import {
  disposeDialogRuntime,
  replaceDialogRuntime,
} from '../shared/dialogViewLifecycle.js';
import { ensureMetaShopStyles } from './metaShopStyles.js';
import { bindMetaShopViewRuntime } from './metaShopViewRuntime.js';
import { syncMetaShopShellState } from './metaShopViewRenderState.js';

export class MetaShopView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'ms-root ss-root';
    this._onPurchase = null;
    this._onBack     = null;
    this._selectedUpgradeId = null;
    this._activeCategory = 'all';
    this._activeSort = 'recommended';
    this._session = null;
    this._gameData = null;
    this._dialogRuntime = null;
    this._shellRefs = null;
    this._disposeRuntime = bindMetaShopViewRuntime(this);
    ensureMetaShopStyles();
    container.appendChild(this.el);
  }

  show(session, onPurchase, onBack, { gameData = null } = {}) {
    this._onPurchase = onPurchase;
    this._onBack     = onBack;
    this._session = session;
    this._gameData = gameData;
    this._render(session);
    this._dialogRuntime = replaceDialogRuntime(this._dialogRuntime, {
      root: this.el,
      panelSelector: '.ms-panel',
      onRequestClose: () => this._onBack?.(),
    });
    this._dialogRuntime.focusInitial();
  }

  refresh(session, { gameData = this._gameData } = {}) {
    this._session = session;
    this._gameData = gameData;
    this._render(session);
  }

  destroy() {
    this._dialogRuntime = disposeDialogRuntime(this._dialogRuntime);
    this._disposeRuntime?.();
    this._shellRefs = null;
    this.el.remove();
  }

  // ── 내부 렌더 ──────────────────────────────────────────────────────

  _render(session) {
    this._session = session;
    const viewModel = buildMetaShopViewModel(session, {
      gameData: this._gameData,
      selectedUpgradeId: this._selectedUpgradeId,
      activeCategory: this._activeCategory,
      activeSort: this._activeSort,
    });
    this._selectedUpgradeId = viewModel.selectedCard?.id ?? null;
    syncMetaShopShellState(this, viewModel);
  }
}
