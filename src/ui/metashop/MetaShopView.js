import {
  buildMetaShopViewModel,
  META_SHOP_FILTERS,
  META_SHOP_SORTS,
} from './metaShopModel.js';
import { bindDialogRuntime } from '../shared/dialogRuntime.js';
import { renderMetaShopMarkup } from './metaShopMarkup.js';
import { ensureMetaShopStyles } from './metaShopStyles.js';

export class MetaShopView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'ms-root ss-root';
    this._onPurchase = null;
    this._onBack     = null;
    this._selectedUpgradeId = null;
    this._activeCategory = 'all';
    this._activeSort = 'recommended';
    this._dialogRuntime = null;
    ensureMetaShopStyles();
    container.appendChild(this.el);
  }

  show(session, onPurchase, onBack) {
    this._onPurchase = onPurchase;
    this._onBack     = onBack;
    this._render(session);
    this._dialogRuntime?.dispose({ restoreFocus: false });
    this._dialogRuntime = bindDialogRuntime({
      root: this.el,
      panelSelector: '.ms-panel',
      onRequestClose: () => this._onBack?.(),
    });
    this._dialogRuntime.focusInitial();
  }

  refresh(session) {
    this._render(session);
  }

  destroy() {
    this._dialogRuntime?.dispose();
    this._dialogRuntime = null;
    this.el.remove();
  }

  // ── 내부 렌더 ──────────────────────────────────────────────────────

  _render(session) {
    const viewModel = buildMetaShopViewModel(session, {
      selectedUpgradeId: this._selectedUpgradeId,
      activeCategory: this._activeCategory,
      activeSort: this._activeSort,
    });
    this._selectedUpgradeId = viewModel.selectedCard?.id ?? null;
    this.el.innerHTML = renderMetaShopMarkup(viewModel);

    const selectionCards = [
      ...(viewModel.availableCards ?? []),
      ...(viewModel.lockedCards ?? []),
      ...(viewModel.completedCards ?? []),
    ];
    this.el.querySelectorAll('.ms-select-btn').forEach((btn, index) => {
      const card = selectionCards[index];
      if (!card) return;
      btn.addEventListener('click', () => {
        this._selectedUpgradeId = card.id;
        this._render(session);
      });
    });

    this.el.querySelectorAll('.ms-filter-tab').forEach((btn, index) => {
      const filter = META_SHOP_FILTERS[index];
      if (!filter) return;
      btn.addEventListener('click', () => {
        this._activeCategory = filter.id;
        this._render(session);
      });
    });

    this.el.querySelectorAll('.ms-sort-btn').forEach((btn, index) => {
      const sort = META_SHOP_SORTS[index];
      if (!sort) return;
      btn.addEventListener('click', () => {
        this._activeSort = sort.id;
        this._render(session);
      });
    });

    this.el.querySelectorAll('.ms-buy-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._onPurchase) this._onPurchase(btn.dataset.id || this._selectedUpgradeId);
      });
    });

    this.el.querySelector('.ms-back-btn').addEventListener('click', () => {
      if (this._onBack) this._onBack();
    });
  }
}
