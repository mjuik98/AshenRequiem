import { isLive } from '../../utils/entityUtils.js';
import { buildBossHudMarkup } from './bossHudMarkup.js';
import { ensureBossHudStyles } from './bossHudStyles.js';

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
    ensureBossHudStyles();
    container.appendChild(this.el);

    this._currentBossId = null;
    this._fillEl        = null;
    this._labelEl       = null;
  }

  update(enemies) {
    const boss = enemies.find(e => e.isBoss && isLive(e));
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
      this.el.innerHTML = buildBossHudMarkup(boss);
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
}
