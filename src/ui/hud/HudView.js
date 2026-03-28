/**
 * src/ui/hud/HudView.js
 *
 * FIX(4): 상자 대기 카운터 표시 추가
 *   - world.progression.chestRewardQueue > 0 일 때 HUD 우측에 '📦 ×N' 표시
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
      <div class="hud-guidance-row">
        <span class="hud-threat-chip">위협: 안정</span>
        <span class="hud-boss-chip">보스: --</span>
        <span class="hud-stage-chip">스테이지: --</span>
        <span class="hud-objective-chip">목표: --</span>
      </div>
      <div class="hud-guidance-note"></div>
      <!-- FIX(4): 상자 대기 카운터 -->
      <div class="hud-chest-queue" id="hud-chest-queue">
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
    this._elThreatChip = this.el.querySelector('.hud-threat-chip');
    this._elBossChip   = this.el.querySelector('.hud-boss-chip');
    this._elStageChip  = this.el.querySelector('.hud-stage-chip');
    this._elObjectiveChip = this.el.querySelector('.hud-objective-chip');
    this._elGuidanceNote = this.el.querySelector('.hud-guidance-note');
    this._elChestQueue = this.el.querySelector('#hud-chest-queue');
    this._elChestCount = this.el.querySelector('#hud-chest-count');
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
    const encounterState = world.run.encounterState ?? {};
    const guidance = world.run.guidance ?? {};
    const currentBeat = encounterState.currentBeat ?? {};
    const bossEta = encounterState.nextBossStartsIn;
    const objective = guidance.primaryObjective ?? null;
    const stageDirective = guidance.stageDirective ?? null;
    const threatLevel = currentBeat.intensity ?? 'steady';
    const bossImminent = Number.isFinite(bossEta) && bossEta <= 45;
    const guidanceNote = currentBeat.summaryText
      || objective?.progressText
      || stageDirective?.detail
      || '';
    this._elThreatChip.textContent = `위협: ${currentBeat.label ?? '안정'}`;
    this._elThreatChip.dataset.level = threatLevel;
    this._elBossChip.textContent = `보스: ${Number.isFinite(bossEta) ? `${bossEta}s` : '대기'}`;
    this._elBossChip.dataset.state = bossImminent ? 'imminent' : 'idle';
    this._elStageChip.textContent = `스테이지: ${stageDirective?.title ?? world.run.stage?.name ?? '--'}`;
    this._elObjectiveChip.textContent = `목표: ${objective?.title ?? '--'}`;
    this._elGuidanceNote.textContent = guidanceNote;
    this._elGuidanceNote.style.display = guidanceNote ? 'block' : 'none';

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
      .hud-guidance-row {
        display: flex;
        gap: 8px;
        padding: 2px 12px 0;
        flex-wrap: wrap;
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
      .hud-right-stats span,
      .hud-threat-chip,
      .hud-boss-chip,
      .hud-stage-chip,
      .hud-objective-chip {
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
      .hud-threat-chip { border-color: rgba(255,183,77,0.3); }
      .hud-boss-chip { border-color: rgba(255,82,82,0.28); }
      .hud-stage-chip { border-color: rgba(129,199,255,0.28); }
      .hud-objective-chip { border-color: rgba(129,199,132,0.28); }
      .hud-guidance-note {
        display: none;
        padding: 6px 14px 0;
        font-size: 12px;
        color: rgba(244, 237, 224, 0.82);
        text-shadow: 0 1px 4px rgba(0,0,0,0.8);
      }
      .hud-threat-chip[data-level="pressure"],
      .hud-threat-chip[data-level="crisis"],
      .hud-threat-chip[data-level="boss_setup"] {
        border-color: rgba(255,183,77,0.52);
      }
      .hud-boss-chip[data-state="imminent"] {
        border-color: rgba(255,82,82,0.56);
        box-shadow: 0 0 18px rgba(255,82,82,0.18);
      }
      .ash-access-high-visibility .hud-level,
      .ash-access-high-visibility .hud-right-stats span,
      .ash-access-high-visibility .hud-threat-chip,
      .ash-access-high-visibility .hud-boss-chip,
      .ash-access-high-visibility .hud-stage-chip,
      .ash-access-high-visibility .hud-objective-chip {
        background: rgba(3, 7, 12, 0.92);
        border-color: rgba(255,255,255,0.22);
        color: #ffffff;
      }
      .ash-access-high-visibility .hud-gold { color: #ffe082; }
      .ash-access-high-visibility .hud-curse { color: #ffb4b4; }
      .ash-access-large-text .hud-stats { font-size: 15px; }
      .ash-access-large-text .hud-level,
      .ash-access-large-text .hud-right-stats span,
      .ash-access-large-text .hud-threat-chip,
      .ash-access-large-text .hud-boss-chip,
      .ash-access-large-text .hud-stage-chip,
      .ash-access-large-text .hud-objective-chip {
        min-height: 32px;
        padding: 0 12px;
      }
      .ash-access-large-text .hud-guidance-note {
        font-size: 13px;
      }

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
      .ash-access-reduced-motion .hud-xp-bar,
      .ash-access-reduced-motion .hud-chest-queue,
      .ash-access-reduced-motion .hud-chest-icon {
        transition: none;
        animation: none;
      }
    `;
    document.head.appendChild(s);
  }
}
