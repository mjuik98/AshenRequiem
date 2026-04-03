/**
 * src/ui/hud/HudView.js
 *
 * FIX(4): 상자 대기 카운터 표시 추가
 *   - world.progression.chestRewardQueue > 0 일 때 HUD 우측에 '📦 ×N' 표시
 *   - 레벨업 선택 후 연속으로 상자 UI가 열리는 이유를 플레이어가 알 수 있음
 */
import { getXpForLevel } from '../../data/constants.js';
import {
  cacheHudViewElements,
  HUD_VIEW_MARKUP,
} from './hudViewMarkup.js';
import { ensureHudViewStyles } from './hudViewStyles.js';

export class HudView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'hud-root';
    this.el.style.display = 'none';
    ensureHudViewStyles();
    this._buildDOM();
    container.appendChild(this.el);
  }

  _buildDOM() {
    this.el.innerHTML = HUD_VIEW_MARKUP;
    const refs = cacheHudViewElements(this.el);
    this._elLevel = refs.level;
    this._elKills = refs.kills;
    this._elTime = refs.time;
    this._elGold = refs.gold;
    this._elCurse = refs.curse;
    this._elXpBar = refs.xpBar;
    this._elChestQueue = refs.chestQueue;
    this._elChestCount = refs.chestCount;
    this._elChestQueue.style.display = 'none';
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none';  }

  update(player, world) {
    if (!player) return;

    const xpNeeded = getXpForLevel(player.level);
    const xpPct    = xpNeeded > 0 ? Math.min(100, (player.xp / xpNeeded) * 100) : 100;
    const secs     = Math.floor(world.run.elapsedTime);
    const mm       = Math.floor(secs / 60);
    const ss       = String(secs % 60).padStart(2, '0');

    this._elLevel.textContent  = `Lv.${player.level}`;
    this._elKills.textContent  = `킬: ${world.run.killCount}`;
    this._elTime.textContent   = `${mm}:${ss}`;
    this._elGold.textContent   = `골드: ${(world.run.runCurrencyEarned ?? 0).toLocaleString()}`;
    this._elCurse.textContent  = `저주: ${Math.round((player.curse ?? 0) * 100)}%`;
    this._elXpBar.style.width  = `${xpPct}%`;

    // FIX(4): 상자 대기 카운터 업데이트
    const queueCount = world.progression.chestRewardQueue ?? 0;
    if (queueCount > 0) {
      this._elChestCount.textContent   = `×${queueCount}`;
      this._elChestQueue.style.display = 'flex';
    } else {
      this._elChestQueue.style.display = 'none';
    }
  }

  destroy() { this.el.remove(); }
}
