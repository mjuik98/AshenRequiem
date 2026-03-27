import { buildMetaShopViewModel } from './metaShopModel.js';
import { renderMetaShopMarkup } from './metaShopMarkup.js';
import { ensureMetaShopStyles } from './metaShopStyles.js';

export class MetaShopView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'ms-root ss-root';
    this._onPurchase = null;
    this._onBack     = null;
    this._selectedUpgradeId = null;
    ensureMetaShopStyles();
    container.appendChild(this.el);

    this._handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this._onBack?.();
      }
    };
  }

  show(session, onPurchase, onBack) {
    this._onPurchase = onPurchase;
    this._onBack     = onBack;
    this._render(session);
    window.addEventListener('keydown', this._handleKeyDown, true);
  }

  refresh(session) {
    this._render(session);
  }

  destroy() { 
    window.removeEventListener('keydown', this._handleKeyDown, true);
    this.el.remove(); 
  }

  // ── 내부 렌더 ──────────────────────────────────────────────────────

  _render(session) {
    const viewModel = buildMetaShopViewModel(session, {
      selectedUpgradeId: this._selectedUpgradeId,
    });
    this._selectedUpgradeId = viewModel.selectedCard?.id ?? null;
    this.el.innerHTML = renderMetaShopMarkup(viewModel);

    const selectionCards = [...(viewModel.availableCards ?? []), ...(viewModel.completedCards ?? [])];
    this.el.querySelectorAll('.ms-select-btn').forEach((btn, index) => {
      const card = selectionCards[index];
      if (!card) return;
      btn.addEventListener('click', () => {
        this._selectedUpgradeId = card.id;
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
