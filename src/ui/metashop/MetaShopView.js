/**
 * MetaShopView — 영구 강화 상점 DOM UI
 *
 * show(session, onPurchase, onBack) 호출로 초기화.
 * 구매 시 onPurchase(upgradeId) 콜백 → MetaShopScene이 처리.
 * refresh(session)으로 구매 후 UI 재렌더.
 * CHANGE: "게임 시작" 버튼 → "메인 화면으로" 복귀 버튼
 * FIX: .ms-root에 pointer-events: auto 추가 — #ui-container의 pointer-events:none 상속으로
 *      스크롤 이벤트가 차단되던 문제 해결
 */
import { permanentUpgradeData } from '../../data/permanentUpgradeData.js';
import {
  SUBSCREEN_SHARED_CSS,
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';

export class MetaShopView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'ms-root ss-root';
    this._onPurchase = null;
    this._onBack     = null;
    this._injectStyles();
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
    const currency = session.meta.currency;
    const perms    = session.meta.permanentUpgrades;

    this.el.innerHTML = `
      <div class="ms-panel ss-panel">

        ${renderSubscreenHeader({
          headerClass: 'ms-header',
          leftClass: 'ms-header-left',
          headingClass: 'ms-heading',
          runeClass: 'ms-rune',
          titleClass: 'ms-title',
          subtitleClass: 'ms-subtitle',
          rune: '⚗',
          title: 'Meta Shop',
          subtitle: '영구 강화를 구매해 다음 런을 준비합니다.',
        })}

        <!-- 재화 표시 -->
        <div class="ms-currency-bar">
          <span class="ms-currency-label">보유 재화</span>
          <span class="ms-currency-value">💰 ${currency}</span>
        </div>

        <!-- 업그레이드 그리드 -->
        <div class="ms-grid">
          ${permanentUpgradeData.map(u => {
            const curLevel  = perms[u.id] ?? 0;
            const isMaxed   = curLevel >= u.maxLevel;
            const cost      = isMaxed ? 0 : u.costPerLevel(curLevel);
            const canAfford = !isMaxed && currency >= cost;

            return `
              <div class="ms-card ${isMaxed ? 'is-maxed' : ''} ${canAfford ? 'can-afford' : ''}">
                <div class="ms-card-icon">${u.icon}</div>
                <div class="ms-card-body">
                  <div class="ms-card-name">${u.name}</div>
                  <div class="ms-card-desc">${u.description}</div>
                  <div class="ms-progress-row">
                    <div class="ms-pips">
                      ${Array.from({ length: u.maxLevel }, (_, i) =>
                        `<span class="ms-pip ${i < curLevel ? 'filled' : ''}"></span>`
                      ).join('')}
                    </div>
                    <span class="ms-level-label">${isMaxed ? 'MAX' : `${curLevel}/${u.maxLevel}`}</span>
                  </div>
                </div>
                <button
                  class="ms-buy-btn"
                  data-id="${u.id}"
                  ${canAfford ? '' : 'disabled'}
                >
                  ${isMaxed ? '완료' : `💰 ${cost}`}
                </button>
              </div>
            `;
          }).join('')}
        </div>

        ${renderSubscreenFooter({
          footerClass: 'ms-footer',
          backButtonClass: 'ms-back-btn',
        })}

      </div>
    `;

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

  _injectStyles() {
    if (document.getElementById('metashop-styles')) return;
    const s = document.createElement('style');
    s.id = 'metashop-styles';
    s.textContent = `
      ${SUBSCREEN_SHARED_CSS}

      .ms-root {
        align-items: flex-start;
        font-family: 'Noto Serif KR', 'Segoe UI', sans-serif;
      }
      .ms-panel {
        width: min(820px, 100%);
      }
      .ms-header {
        margin-bottom: 0;
      }
      .ms-currency-bar {
        display: flex; justify-content: space-between; align-items: center;
        background: rgba(255,213,79,0.07);
        border: 1px solid rgba(255,213,79,0.25);
        border-radius: 14px; padding: 12px 18px;
        margin: 20px 26px 24px;
      }
      .ms-currency-label { font-size: 13px; color: #aaa; }
      .ms-currency-value { font-size: 18px; font-weight: 700; color: #ffd54f; }
      .ms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 14px;
        padding: 0 26px 0;
        margin-bottom: 28px;
      }
      .ms-card {
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(217,179,107,0.1);
        border-radius: 16px; padding: 16px 14px;
        display: flex; flex-direction: column; gap: 10px;
        transition: border-color 0.2s, background 0.2s, transform 0.2s;
      }
      .ms-card.can-afford {
        border-color: rgba(255,213,79,0.35);
        background: rgba(255,213,79,0.04);
      }
      .ms-card:hover {
        transform: translateY(-1px);
      }
      .ms-card.is-maxed { opacity: 0.55; }
      .ms-card-icon { font-size: 26px; text-align: center; }
      .ms-card-body { flex: 1; }
      .ms-card-name { font-size: 13px; font-weight: 700; color: #eee; margin-bottom: 4px; }
      .ms-card-desc { font-size: 11px; color: #999; line-height: 1.5; margin-bottom: 8px; }
      .ms-progress-row { display: flex; align-items: center; gap: 6px; }
      .ms-pips { display: flex; gap: 3px; flex-wrap: wrap; }
      .ms-pip {
        width: 8px; height: 8px; border-radius: 50%;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.18);
      }
      .ms-pip.filled { background: #ffd54f; border-color: #ffd54f; }
      .ms-level-label { font-size: 10px; color: #777; white-space: nowrap; }
      .ms-buy-btn {
        width: 100%; padding: 8px; border: none; border-radius: 8px;
        background: linear-gradient(90deg, #ffd54f, #ffb300);
        color: #1a1200; font-size: 12px; font-weight: 700;
        cursor: pointer; letter-spacing: 0.5px;
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .ms-buy-btn:hover:not([disabled]) {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(255,213,79,0.35);
      }
      .ms-buy-btn[disabled] {
        background: rgba(255,255,255,0.07);
        color: #555; cursor: default;
      }
      .ms-footer {
        padding: 18px 26px 24px;
        border-top: 1px solid rgba(217,179,107,0.12);
        text-align: center;
      }
      .ms-back-btn {
        min-width: 170px;
      }
      @media (max-width: 640px) {
        .ms-currency-bar {
          margin: 18px 18px 20px;
        }
        .ms-grid {
          padding: 0 18px 0;
        }
        .ms-footer {
          padding: 18px 18px 22px;
        }
      }
    `;
    document.head.appendChild(s);
  }
}
