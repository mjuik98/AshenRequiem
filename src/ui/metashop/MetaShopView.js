/**
 * MetaShopView — 영구 강화 상점 DOM UI
 *
 * show(session, onPurchase, onBack) 호출로 초기화.
 * 구매 시 onPurchase(upgradeId) 콜백 → MetaShopScene이 처리.
 * refresh(session)으로 구매 후 UI 재렌더.
 * CHANGE: "게임 시작" 버튼 → "메인화면으로" 복귀 버튼
 */
import { permanentUpgradeData } from '../../data/permanentUpgradeData.js';

export class MetaShopView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'ms-root';
    this._onPurchase = null;
    this._onBack     = null;
    this._injectStyles();
    container.appendChild(this.el);
  }

  show(session, onPurchase, onBack) {
    this._onPurchase = onPurchase;
    this._onBack     = onBack;
    this._render(session);
  }

  refresh(session) {
    this._render(session);
  }

  destroy() { this.el.remove(); }

  // ── 내부 렌더 ──────────────────────────────────────────────────────

  _render(session) {
    const currency = session.meta.currency;
    const perms    = session.meta.permanentUpgrades;
    const best     = session.best;

    this.el.innerHTML = `
      <div class="ms-panel">

        <!-- 헤더 -->
        <div class="ms-header">
          <h1 class="ms-title">⚗ 영구 강화</h1>
          <div class="ms-best-row">
            <span class="ms-best-item">🏆 최고 레벨 <b>Lv.${best.level}</b></span>
            <span class="ms-best-item">☠ 최다 킬 <b>${best.kills}</b></span>
            <span class="ms-best-item">⏱ 최장 생존 <b>${_formatTime(best.survivalTime)}</b></span>
          </div>
        </div>

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

        <!-- 하단 버튼 -->
        <div class="ms-footer">
          <button class="ms-back-btn">← 메인화면으로</button>
        </div>

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
      .ms-root {
        position: absolute; inset: 0;
        background: radial-gradient(circle at top, #0e1220 0%, #060810 60%);
        display: flex; align-items: center; justify-content: center;
        z-index: 50; font-family: 'Segoe UI', sans-serif;
        color: #eee; overflow-y: auto; padding: 16px;
      }
      .ms-panel {
        width: min(680px, calc(100vw - 32px));
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 20px; padding: 32px 36px;
        box-shadow: 0 20px 64px rgba(0,0,0,0.55);
      }
      .ms-header { text-align: center; margin-bottom: 20px; }
      .ms-title {
        font-size: 24px; font-weight: 800; color: #ffd54f;
        letter-spacing: 3px; margin-bottom: 12px;
        text-shadow: 0 0 20px rgba(255,213,79,0.3);
      }
      .ms-best-row {
        display: flex; justify-content: center; gap: 20px;
        flex-wrap: wrap;
      }
      .ms-best-item { font-size: 12px; color: #888; }
      .ms-best-item b { color: #ccc; }
      .ms-currency-bar {
        display: flex; justify-content: space-between; align-items: center;
        background: rgba(255,213,79,0.07);
        border: 1px solid rgba(255,213,79,0.25);
        border-radius: 10px; padding: 10px 16px;
        margin-bottom: 24px;
      }
      .ms-currency-label { font-size: 13px; color: #aaa; }
      .ms-currency-value { font-size: 18px; font-weight: 700; color: #ffd54f; }
      .ms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px; margin-bottom: 28px;
      }
      .ms-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: 14px; padding: 16px 14px;
        display: flex; flex-direction: column; gap: 10px;
        transition: border-color 0.2s, background 0.2s;
      }
      .ms-card.can-afford {
        border-color: rgba(255,213,79,0.35);
        background: rgba(255,213,79,0.04);
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
      .ms-footer { text-align: center; }
      .ms-back-btn {
        padding: 14px 60px; border: none; border-radius: 10px;
        background: linear-gradient(90deg, #546e7a, #37474f);
        color: #cfd8dc; font-size: 16px; font-weight: 700;
        cursor: pointer; letter-spacing: 1px;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      .ms-back-btn:hover {
        transform: translateY(-2px);
        background: linear-gradient(90deg, #607d8b, #455a64);
        box-shadow: 0 6px 28px rgba(0,0,0,0.4);
        color: #fff;
      }
    `;
    document.head.appendChild(s);
  }
}

function _formatTime(secs) {
  const m  = Math.floor(secs / 60);
  const ss = String(Math.floor(secs % 60)).padStart(2, '0');
  return `${m}:${ss}`;
}
