import { getXpForLevel } from '../../data/constants.js';

/**
 * HudView — 상단 HUD (HP 바, XP 바, 레벨, 킬 수, 경과 시간)
 *
 * FIX(bug): document.getElementById → this.el.querySelector
 *   PlayScene 재시작 시 이전 HUD 노드의 id와 충돌하지 않도록 scoped 탐색
 * PERF: textContent / style.width 만 갱신 (innerHTML 전체 교체 없음)
 */
export class HudView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'hud-root';
    this.el.style.display = 'none';
    this._injectStyles();
    this._buildDOM();
    container.appendChild(this.el);
  }

  _buildDOM() {
    this.el.innerHTML = `
      <div class="hud-top">
        <div class="hud-stats">
          <span class="hud-level">Lv.1</span>
          <span class="hud-kills">킬: 0</span>
          <span class="hud-time">0:00</span>
        </div>
        <div class="hud-xp-bar-container">
          <div class="hud-xp-bar"></div>
        </div>
      </div>
      <div class="hud-hp-container">
        <div class="hud-hp-bar"></div>
        <div class="hud-hp-text"></div>
      </div>
    `;
    // FIX(bug): id 대신 className + querySelector로 scoped 탐색
    this._elLevel  = this.el.querySelector('.hud-level');
    this._elKills  = this.el.querySelector('.hud-kills');
    this._elTime   = this.el.querySelector('.hud-time');
    this._elXpBar  = this.el.querySelector('.hud-xp-bar');
    this._elHpBar  = this.el.querySelector('.hud-hp-bar');
    this._elHpText = this.el.querySelector('.hud-hp-text');
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none';  }

  update(player, world) {
    if (!player) return;

    const xpNeeded = getXpForLevel(player.level);
    const xpPct    = xpNeeded > 0 ? Math.min(100, (player.xp / xpNeeded) * 100) : 100;
    const hpPct    = player.maxHp > 0 ? Math.max(0, (player.hp / player.maxHp) * 100) : 0;
    const secs     = Math.floor(world.elapsedTime);
    const mm       = Math.floor(secs / 60);
    const ss       = String(secs % 60).padStart(2, '0');

    this._elLevel.textContent  = `Lv.${player.level}`;
    this._elKills.textContent  = `킬: ${world.killCount}`;
    this._elTime.textContent   = `${mm}:${ss}`;
    this._elXpBar.style.width  = `${xpPct}%`;
    this._elHpBar.style.width  = `${hpPct}%`;
    this._elHpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  }

  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('hud-styles')) return;
    const s = document.createElement('style');
    s.id = 'hud-styles';
    s.textContent = `
      .hud-root {
        position: absolute; top: 12px; left: 12px; right: 12px;
        pointer-events: none;
      }
      .hud-top { display: flex; flex-direction: column; gap: 4px; }
      .hud-stats {
        display: flex; justify-content: space-between;
        font-size: 13px; color: #ccc; font-family: 'Segoe UI', sans-serif;
        background: rgba(0,0,0,0.45); border-radius: 4px;
        padding: 2px 8px;
      }
      .hud-xp-bar-container {
        width: 100%; height: 8px;
        background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;
      }
      .hud-xp-bar {
        height: 100%; width: 0%;
        background: linear-gradient(90deg, #66bb6a, #aed581);
        border-radius: 4px; transition: width 0.15s ease;
      }
      .hud-hp-container {
        position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
        width: 200px; height: 14px;
        background: rgba(0,0,0,0.5); border-radius: 7px; overflow: hidden;
      }
      .hud-hp-bar {
        height: 100%; width: 100%;
        background: linear-gradient(90deg, #ef5350, #ff7043);
        border-radius: 7px; transition: width 0.15s ease;
      }
      .hud-hp-text {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }
    `;
    document.head.appendChild(s);
  }
}
