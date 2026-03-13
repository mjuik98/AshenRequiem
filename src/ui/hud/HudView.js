import { getXpForLevel } from '../../data/constants.js';

/**
 * HudView — 인게임 HUD
 *
 * HP바, XP바, 레벨, 타이머, 킬 수 표시
 */
export class HudView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'hud';
    this.el.innerHTML = `
      <div class="hud-top">
        <div class="hud-xp-bar-container">
          <div class="hud-xp-bar" id="hud-xp-bar"></div>
        </div>
        <div class="hud-stats">
          <span id="hud-level">Lv 1</span>
          <span id="hud-timer">00:00</span>
          <span id="hud-kills">0 kills</span>
        </div>
      </div>
      <div class="hud-hp-container">
        <div class="hud-hp-bar" id="hud-hp-bar"></div>
        <span class="hud-hp-text" id="hud-hp-text">100/100</span>
      </div>
    `;

    this._injectStyles();
    container.appendChild(this.el);
  }

  update(player, world) {
    if (!player) return;

    // XP바
    const xpNeeded = getXpForLevel(player.level);
    const xpPct = Math.min(player.xp / xpNeeded * 100, 100);
    document.getElementById('hud-xp-bar').style.width = xpPct + '%';

    // 레벨
    document.getElementById('hud-level').textContent = `Lv ${player.level}`;

    // 타이머
    const totalSec = Math.floor(world.elapsedTime);
    const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const sec = String(totalSec % 60).padStart(2, '0');
    document.getElementById('hud-timer').textContent = `${min}:${sec}`;

    // 킬 수
    document.getElementById('hud-kills').textContent = `${world.killCount} kills`;

    // HP바
    const hpPct = Math.max(0, player.hp / player.maxHp * 100);
    document.getElementById('hud-hp-bar').style.width = hpPct + '%';
    document.getElementById('hud-hp-text').textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }

  destroy() {
    this.el.remove();
  }

  _injectStyles() {
    if (document.getElementById('hud-styles')) return;
    const style = document.createElement('style');
    style.id = 'hud-styles';
    style.textContent = `
      #hud {
        position: absolute;
        top: 0; left: 0; right: 0;
        pointer-events: none;
        padding: 8px 12px;
        z-index: 10;
      }
      .hud-top {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .hud-xp-bar-container {
        width: 100%;
        height: 8px;
        background: rgba(0,0,0,0.5);
        border-radius: 4px;
        overflow: hidden;
      }
      .hud-xp-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #66bb6a, #aed581);
        border-radius: 4px;
        transition: width 0.15s ease;
      }
      .hud-stats {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #ccc;
        font-family: 'Segoe UI', sans-serif;
      }
      .hud-hp-container {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 14px;
        background: rgba(0,0,0,0.5);
        border-radius: 7px;
        overflow: hidden;
      }
      .hud-hp-bar {
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #ef5350, #ff7043);
        border-radius: 7px;
        transition: width 0.15s ease;
      }
      .hud-hp-text {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }
    `;
    document.head.appendChild(style);
  }
}
