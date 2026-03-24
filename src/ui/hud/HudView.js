/**
 * src/ui/hud/HudView.js
 *
 * FIX(4): 상자 대기 카운터 표시 추가
 *   - world.chestRewardQueue > 0 일 때 HUD 우측에 '📦 ×N' 표시
 *   - 레벨업 선택 후 연속으로 상자 UI가 열리는 이유를 플레이어가 알 수 있음
 */
import { getXpForLevel } from '../../data/constants.js';

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
      <div class="hud-xp-bar-container">
        <div class="hud-xp-bar"></div>
      </div>
      <div class="hud-top">
        <div class="hud-stats">
          <span class="hud-level">Lv.1</span>
          <div class="hud-right-stats">
            <span class="hud-time">0:00</span>
            <span class="hud-kills">킬: 0</span>
            <span class="hud-gold">골드: 0</span>
            <span class="hud-curse">저주: 0%</span>
          </div>
        </div>
      </div>
      <!-- FIX(4): 상자 대기 카운터 -->
      <div class="hud-chest-queue" id="hud-chest-queue" style="display:none">
        <span class="hud-chest-icon">📦</span>
        <span class="hud-chest-count" id="hud-chest-count">×1</span>
      </div>
    `;
    this._elLevel      = this.el.querySelector('.hud-level');
    this._elKills      = this.el.querySelector('.hud-kills');
    this._elTime       = this.el.querySelector('.hud-time');
    this._elGold       = this.el.querySelector('.hud-gold');
    this._elCurse      = this.el.querySelector('.hud-curse');
    this._elXpBar      = this.el.querySelector('.hud-xp-bar');
    this._elChestQueue = this.el.querySelector('#hud-chest-queue');
    this._elChestCount = this.el.querySelector('#hud-chest-count');
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
    this._elGold.textContent   = `골드: ${(world.runCurrencyEarned ?? 0).toLocaleString()}`;
    this._elCurse.textContent  = `저주: ${Math.round((player.curse ?? 0) * 100)}%`;
    this._elXpBar.style.width  = `${xpPct}%`;

    // FIX(4): 상자 대기 카운터 업데이트
    const queueCount = world.chestRewardQueue ?? 0;
    if (queueCount > 0) {
      this._elChestCount.textContent   = `×${queueCount}`;
      this._elChestQueue.style.display = 'flex';
    } else {
      this._elChestQueue.style.display = 'none';
    }
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
      .hud-top {
        padding-top: 8px;
      }
      .hud-stats {
        display: flex; justify-content: space-between; align-items: flex-start;
        font-size: 13px; color: #eee; font-family: 'Noto Sans KR', 'Segoe UI', sans-serif;
        padding: 4px 12px;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);
      }
      .hud-right-stats {
        display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px;
        max-width: 420px;
      }
      .hud-level,
      .hud-right-stats span {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(10,14,22,0.82), rgba(10,14,22,0.62));
        border: 1px solid rgba(255,255,255,0.08);
      }
      .hud-level { border-color: rgba(212,175,106,0.22); }
      .hud-gold { color: #ffd54f; }
      .hud-curse { color: #ef9a9a; }

      /* FIX(4): 상자 대기 카운터 */
      .hud-chest-queue {
        position: fixed;
        top: 14px; left: 50%;
        transform: translateX(-50%);
        display: flex; align-items: center; gap: 5px;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 213, 79, 0.55);
        border-radius: 20px;
        padding: 4px 12px;
        pointer-events: none;
        z-index: 101;
        animation: hud-chest-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      @keyframes hud-chest-pop {
        from { opacity: 0; transform: translateX(-50%) scale(0.7); }
        to   { opacity: 1; transform: translateX(-50%) scale(1);   }
      }
      .hud-chest-icon {
        font-size: 14px;
        animation: hud-chest-bounce 1.2s ease-in-out infinite;
      }
      @keyframes hud-chest-bounce {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-3px); }
      }
      .hud-chest-count {
        font-size: 13px; font-weight: 700;
        color: #ffd54f;
        text-shadow: 0 0 8px rgba(255, 213, 79, 0.6);
        font-family: 'Segoe UI', sans-serif;
      }
    `;
    document.head.appendChild(s);
  }
}
