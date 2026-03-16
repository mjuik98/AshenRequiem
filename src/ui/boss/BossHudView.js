/**
 * BossHudView — 보스 HP 바 (DOM UI)
 *
 * FIX(bug): document.getElementById → this.el.querySelector
 *   재시작 시 이전 DOM id와 충돌하지 않도록 scoped 탐색
 * PERF: 보스가 교체됐을 때만 innerHTML 갱신 (매 프레임 DOM 재파싱 방지)
 */
export class BossHudView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'boss-hud';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);

    this._currentBossId = null;
    this._fillEl        = null;
    this._labelEl       = null;
  }

  update(enemies) {
    const boss = enemies.find(e => e.isBoss && e.isAlive && !e.pendingDestroy);
    if (!boss) {
      if (this.el.style.display !== 'none') this.el.style.display = 'none';
      this._currentBossId = null;
      this._fillEl        = null;
      this._labelEl       = null;
      return;
    }

    // FIX: 보스가 교체됐을 때만 DOM 재구성
    if (this._currentBossId !== boss.id) {
      this._currentBossId = boss.id;
      this.el.innerHTML = `
        <div class="boss-name">${boss.name || 'BOSS'}</div>
        <div class="boss-bar-wrap">
          <div class="boss-hp-fill"></div>
        </div>
        <span class="boss-hp-label"></span>
      `;
      // FIX(bug): scoped querySelector
      this._fillEl  = this.el.querySelector('.boss-hp-fill');
      this._labelEl = this.el.querySelector('.boss-hp-label');
    }

    const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
    if (this._fillEl)  this._fillEl.style.width    = `${pct}%`;
    if (this._labelEl) this._labelEl.textContent   = `${Math.ceil(boss.hp)} / ${boss.maxHp}`;
    this.el.style.display = 'flex';
  }

  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('boss-hud-styles')) return;
    const s = document.createElement('style');
    s.id = 'boss-hud-styles';
    s.textContent = `
      .boss-hud {
        position: absolute; bottom: 52px; left: 50%;
        transform: translateX(-50%);
        display: none; flex-direction: column; align-items: center;
        gap: 5px; pointer-events: none; z-index: 20; min-width: 340px;
      }
      .boss-name {
        font-size: 13px; font-weight: 700; color: #ff80ab;
        letter-spacing: 2px; text-shadow: 0 0 10px #ff4081;
      }
      .boss-bar-wrap {
        width: 100%; height: 10px;
        background: rgba(0,0,0,0.6); border-radius: 5px; overflow: hidden;
        border: 1px solid rgba(255,64,129,0.4);
      }
      .boss-hp-fill {
        height: 100%; width: 100%;
        background: linear-gradient(90deg, #ff1744, #ff4081);
        border-radius: 5px; transition: width 0.2s ease;
      }
      .boss-hp-label { font-size: 11px; color: #aaa; }
    `;
    document.head.appendChild(s);
  }
}
