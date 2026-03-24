import { buildMetaShopViewModel } from './metaShopModel.js';
import { renderMetaShopMarkup } from './metaShopMarkup.js';
import { ensureMetaShopStyles } from './metaShopStyles.js';

export class MetaShopView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'ms-root ss-root';
    this._onPurchase = null;
    this._onBack     = null;
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
    const viewModel = buildMetaShopViewModel(session);
    this.el.innerHTML = renderMetaShopMarkup(viewModel);

    // 구매 버튼 이벤트
    this.el.querySelectorAll('.ms-buy-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._onPurchase) this._onPurchase(btn.dataset.id);
      });
    });

    // 메인화면 복귀 버튼 이벤트
    this.el.querySelector('.ms-back-btn').addEventListener('click', () => {
      if (this._onBack) this._onBack();
    });
  }
}
