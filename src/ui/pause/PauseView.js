/**
 * PauseView — ESC 일시정지 오버레이
 * 보유 무기 목록 + 장신구 슬롯 표시
 */
export class PauseView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'pause-overlay';
    this.el.style.display = 'none';
    this._onResume = null;
    this._injectStyles();
    container.appendChild(this.el);
  }

  show(player, onResume) {
    this._onResume = onResume;
    this._render(player);
    this.el.style.display = 'flex';
  }

  hide() {
    this.el.style.display = 'none';
    this._onResume = null;
  }

  isVisible() {
    return this.el.style.display !== 'none';
  }

  destroy() { this.el.remove(); }

  // ── 내부 렌더 ──────────────────────────────────────────────────────

  _render(player) {
    const weapons     = player.weapons     ?? [];
    const accessories = player.accessories ?? [];

    this.el.innerHTML = `
      <div class="pause-box">
        <div class="pause-title">⏸ PAUSED</div>

        <div class="pause-columns">

          <!-- 보유 무기 -->
          <section class="pause-section">
            <div class="pause-section-title">⚔ 보유 무기</div>
            <div class="pause-item-list">
              ${weapons.length === 0
                ? '<div class="pause-empty">없음</div>'
                : weapons.map(w => `
                    <div class="pause-card weapon-card">
                      <div class="pc-header">
                        <span class="pc-name">${w.name}</span>
                        <span class="pc-badge">Lv.${w.level}</span>
                      </div>
                      <div class="pc-desc">${w.description ?? ''}</div>
                      <div class="pc-stats">
                        <span>DMG <b>${w.damage}</b></span>
                        <span>CD <b>${w.cooldown?.toFixed(1)}s</b></span>
                      </div>
                    </div>
                  `).join('')}
            </div>
          </section>

          <!-- 장신구 슬롯 -->
          <section class="pause-section">
            <div class="pause-section-title">💍 장신구 (${accessories.length}/2)</div>
            <div class="pause-item-list">
              ${[0, 1].map(i => {
                const acc = accessories[i];
                if (acc) {
                  return `
                    <div class="pause-card acc-card filled">
                      <div class="pc-header">
                        <span class="pc-name">${acc.name}</span>
                        <span class="pc-badge rarity-${acc.rarity ?? 'common'}">${_rarityLabel(acc.rarity)}</span>
                      </div>
                      <div class="pc-desc">${acc.description}</div>
                    </div>
                  `;
                }
                return `
                  <div class="pause-card acc-card empty">
                    <div class="pc-empty-label">빈 슬롯 ${i + 1}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>

        </div>

        <div class="pause-footer">
          <p class="pause-hint">ESC 또는 버튼으로 재개</p>
          <button class="pause-resume-btn">▶ 재개</button>
        </div>
      </div>
    `;

    this.el.querySelector('.pause-resume-btn')
      .addEventListener('click', () => { if (this._onResume) this._onResume(); });
  }

  _injectStyles() {
    if (document.getElementById('pause-styles')) return;
    const s = document.createElement('style');
    s.id = 'pause-styles';
    s.textContent = `
      .pause-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.78);
        display: flex; align-items: center; justify-content: center;
        z-index: 35;
      }
      .pause-box {
        background: linear-gradient(160deg, #1a2030, #0d1117);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 18px; padding: 32px 36px;
        width: min(580px, calc(100vw - 32px));
        box-shadow: 0 10px 48px rgba(0,0,0,0.7);
        animation: pause-pop 0.22s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes pause-pop {
        from { transform: scale(0.88); opacity: 0; }
        to   { transform: scale(1);    opacity: 1; }
      }
      .pause-title {
        font-size: 20px; font-weight: 800; color: #90caf9;
        letter-spacing: 4px; text-align: center;
        margin-bottom: 22px;
        text-shadow: 0 0 18px rgba(144,202,249,0.4);
      }
      .pause-columns {
        display: flex; gap: 20px; margin-bottom: 22px;
      }
      .pause-section {
        flex: 1; min-width: 0;
      }
      .pause-section-title {
        font-size: 12px; font-weight: 700; color: #ffd54f;
        letter-spacing: 1px; margin-bottom: 10px;
        text-transform: uppercase;
      }
      .pause-item-list {
        display: flex; flex-direction: column; gap: 8px;
      }
      .pause-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px; padding: 10px 12px;
      }
      .weapon-card { border-color: rgba(255,213,79,0.18); }
      .acc-card.filled { border-color: rgba(144,202,249,0.25); }
      .acc-card.empty {
        border-style: dashed; border-color: rgba(255,255,255,0.1);
        opacity: 0.5;
      }
      .pc-header {
        display: flex; justify-content: space-between;
        align-items: center; margin-bottom: 4px;
      }
      .pc-name { font-size: 13px; font-weight: 700; color: #eee; }
      .pc-badge {
        font-size: 11px; color: #90caf9; font-weight: 600;
        background: rgba(144,202,249,0.12);
        padding: 1px 7px; border-radius: 10px;
      }
      .pc-badge.rarity-rare {
        color: #ce93d8;
        background: rgba(206,147,216,0.12);
      }
      .pc-desc { font-size: 11px; color: #999; line-height: 1.5; }
      .pc-stats {
        display: flex; gap: 12px; margin-top: 5px;
        font-size: 11px; color: #aaa;
      }
      .pc-stats b { color: #eee; }
      .pc-empty-label {
        font-size: 12px; color: #555; text-align: center;
        padding: 6px 0;
      }
      .pause-empty { font-size: 12px; color: #555; padding: 4px 0; }
      .pause-footer { text-align: center; }
      .pause-hint { font-size: 11px; color: #555; margin-bottom: 10px; }
      .pause-resume-btn {
        padding: 10px 40px; border: none; border-radius: 8px;
        background: linear-gradient(90deg, #42a5f5, #1e88e5);
        color: #fff; font-size: 14px; font-weight: 700;
        cursor: pointer; letter-spacing: 1px;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 16px rgba(66,165,245,0.3);
      }
      .pause-resume-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(66,165,245,0.5);
      }
      @media (max-width: 480px) {
        .pause-columns { flex-direction: column; }
      }
    `;
    document.head.appendChild(s);
  }
}

function _rarityLabel(rarity) {
  if (rarity === 'rare') return '희귀';
  return '일반';
}
