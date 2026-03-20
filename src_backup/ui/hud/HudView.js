import { getXpForLevel } from '../../data/constants.js';

/**
 * HudView — 상단 HUD (XP 바, 레벨, 킬 수, 경과 시간)
 *
 * CHANGE: 상단 검정 배경 박스 제거, 체력바 제거
 *   - .hud-stats 검정 배경(rgba(0,0,0,0.45)) 제거 → 투명하게
 *   - .hud-hp-container 완전 제거 (ESC 일시정지 화면에서 확인 가능)
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
    // XP 바를 stats 위로 이동 — 화면 최상단에 고정 표시
    this.el.innerHTML = `
      <div class="hud-xp-bar-container">
        <div class="hud-xp-bar"></div>
      </div>
      <div class="hud-top">
        <div class="hud-stats">
          <span class="hud-level">Lv.1</span>
          <div class="hud-right-stats">
            <span class="hud-time">0:00</span>
            <span class="hud-kills">킬: 0</span>
          </div>
        </div>
      </div>
    `;
    this._elLevel  = this.el.querySelector('.hud-level');
    this._elKills  = this.el.querySelector('.hud-kills');
    this._elTime   = this.el.querySelector('.hud-time');
    this._elXpBar  = this.el.querySelector('.hud-xp-bar');
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none';  }

  update(player, world) {
    if (!player) return;

    const xpNeeded = getXpForLevel(player.level);
    const xpPct    = xpNeeded > 0 ? Math.min(100, (player.xp / xpNeeded) * 100) : 100;
    const secs     = Math.floor(world.elapsedTime);
    const mm       = Math.floor(secs / 60);
    const ss       = String(secs % 60).padStart(2, '0');

    this._elLevel.textContent  = `Lv.${player.level}`;
    this._elKills.textContent  = `킬: ${world.killCount}`;
    this._elTime.textContent   = `${mm}:${ss}`;
    this._elXpBar.style.width  = `${xpPct}%`;
  }

  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('hud-styles')) return;
    const s = document.createElement('style');
    s.id = 'hud-styles';
    s.textContent = `
      .hud-root {
        position: absolute; top: 0; left: 0; right: 0;
        pointer-events: none;
      }
      /* XP 바 — 화면 최상단 고정 */
      .hud-xp-bar-container {
        position: fixed;
        top: 0; left: 0; right: 0;
        width: 100%; height: 6px;
        background: rgba(0,0,0,0.5);
        overflow: hidden;
        z-index: 100;
      }
      .hud-xp-bar {
        height: 100%; width: 0%;
        background: linear-gradient(90deg, #66bb6a, #aed581);
        transition: width 0.15s ease;
      }
      /* 레벨/시간/킬 통계 — XP 바 바로 아래 */
      .hud-top {
        padding-top: 8px;
      }
      .hud-stats {
        display: flex; justify-content: space-between; align-items: flex-start;
        font-size: 13px; color: #eee; font-family: 'Segoe UI', sans-serif;
        padding: 4px 12px;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);
      }
      .hud-right-stats {
        display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
      }
    `;
    document.head.appendChild(s);
  }
}
