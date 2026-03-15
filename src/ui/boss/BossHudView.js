/**
 * BossHudView — 보스 HP 바 (DOM UI)
 *
 * 규칙: 상태를 읽어 표시만 함 — 게임 규칙 직접 수정 금지
 * 위치: 화면 하단 중앙
 * 표시 조건: 살아 있는 보스(isBoss=true) 가 enemies 배열에 존재할 때만 표시
 */
export class BossHudView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'boss-hud';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
    this._currentBossId = null;
  }

  /**
   * 매 프레임 호출 — 보스 엔티티 배열에서 첫 번째 살아있는 보스를 찾아 표시
   * @param {Array} enemies
   */
  update(enemies) {
    const boss = enemies.find(e => e.isBoss && e.isAlive && !e.pendingDestroy);
    if (!boss) {
      if (this.el.style.display !== 'none') this._hide();
      this._currentBossId = null;
      return;
    }

    // 보스가 교체됐을 때만 DOM 재생성
    if (this._currentBossId !== boss.id) {
      this._currentBossId = boss.id;
      this._render(boss.name || 'BOSS');
    }

    const pct   = Math.max(0, boss.hp / boss.maxHp * 100);
    const fill  = document.getElementById('boss-hp-fill');
    const label = document.getElementById('boss-hp-label');
    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = `${Math.ceil(boss.hp)} / ${boss.maxHp}`;
    this.el.style.display = 'flex';
  }

  _render(name) {
    this.el.innerHTML = `
      <div class="boss-name">${name}</div>
      <div class="boss-bar-wrap">
        <div class="boss-hp-fill" id="boss-hp-fill"></div>
      </div>
      <span class="boss-hp-label" id="boss-hp-label"></span>
    `;
  }

  _hide() { this.el.style.display = 'none'; }
  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('boss-hud-styles')) return;
    const style = document.createElement('style');
    style.id = 'boss-hud-styles';
    style.textContent = `
      #boss-hud {
        position: absolute;
        bottom: 52px;
        left: 50%;
        transform: translateX(-50%);
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        pointer-events: none;
        z-index: 20;
        min-width: 340px;
      }
      .boss-name {
        font-family: 'Segoe UI', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: #ff5252;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        text-shadow: 0 0 12px rgba(244,67,54,0.6);
        animation: bossNamePulse 1.4s ease-in-out infinite alternate;
      }
      @keyframes bossNamePulse {
        from { opacity: 0.85; }
        to   { opacity: 1; text-shadow: 0 0 20px rgba(244,67,54,0.9); }
      }
      .boss-bar-wrap {
        width: 340px;
        height: 10px;
        background: rgba(0,0,0,0.65);
        border: 1px solid rgba(244,67,54,0.4);
        border-radius: 5px;
        overflow: hidden;
      }
      .boss-hp-fill {
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #b71c1c, #f44336, #ff8a65);
        border-radius: 5px;
        transition: width 0.12s ease;
      }
      .boss-hp-label {
        font-family: 'Consolas', monospace;
        font-size: 10px;
        color: rgba(255,200,200,0.7);
      }
    `;
    document.head.appendChild(style);
  }
}
