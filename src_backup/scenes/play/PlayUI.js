/**
 * src/scenes/play/PlayUI.js — 플레이 씬 UI 뷰 통합 관리
 *
 * CHANGE: PauseView 추가 (Phase 1 ESC 일시정지)
 */

import { HudView }     from '../../ui/hud/HudView.js';
import { LevelUpView } from '../../ui/levelup/LevelUpView.js';
import { ResultView }  from '../../ui/result/ResultView.js';
import { DebugView }   from '../../ui/debug/DebugView.js';
import { BossHudView } from '../../ui/boss/BossHudView.js';
import { PauseView }   from '../../ui/pause/PauseView.js';

export class PlayUI {
  /**
   * @param {HTMLElement} container  mountUI() 반환값 (#ui-container)
   */
  constructor(container) {
    this._hud     = new HudView(container);
    this._levelUp = new LevelUpView(container);
    this._result  = new ResultView(container);
    this._debug   = new DebugView(container);
    this._bossHud = new BossHudView(container);
    this._pause   = new PauseView(container);
  }

  // ── HUD ──────────────────────────────────────────────────────────────

  showHud() { this._hud.show(); }
  hideHud() { this._hud.hide(); }

  /** 매 프레임 HUD + BossHUD 업데이트 */
  update(world) {
    this._hud.update(world.player, world);
    this._bossHud.update(world.enemies);
  }

  // ── 디버그 ────────────────────────────────────────────────────────────

  handleInput(input) {
    this._debug.handleInput(input);
  }

  updateDebug(world, ctx, dt, waveData, spawnDebug) {
    this._debug.update(world, ctx, dt, waveData, spawnDebug);
  }

  // ── 일시정지 (Phase 1) ────────────────────────────────────────────────

  /**
   * 일시정지 모달 표시
   * @param {object}   player
   * @param {Function} onResume     재개 콜백
   * @param {Function} onMainMenu   메인메뉴 콜백
   */
  showPause(player, onResume, onMainMenu) {
    this._pause.show(player, onResume, onMainMenu);
  }

  hidePause() {
    this._pause.hide();
  }

  isPaused() {
    return this._pause.isVisible();
  }

  // ── 레벨업 오버레이 ───────────────────────────────────────────────────

  /**
   * @param {object[]} choices       UpgradeSystem.generateChoices() 반환값
   * @param {Function} onSelect      선택 콜백 (upgrade) => void
   */
  showLevelUp(choices, onSelect) {
    this._levelUp.show(choices, onSelect);
  }

  // ── 결과 화면 ─────────────────────────────────────────────────────────

  /**
   * @param {object}        stats        결과 통계
   * @param {Function}      onRestart    재시작 콜백
   * @param {Function|null} onMetaShop   강화 상점 콜백 (없으면 버튼 미표시)
   */
  showResult(stats, onRestart, onMetaShop = null) {
    this.hideHud();
    this._result.show(stats, onRestart, onMetaShop);
  }

  // ── 생명주기 ──────────────────────────────────────────────────────────

  destroy() {
    [this._hud, this._levelUp, this._result, this._debug, this._bossHud, this._pause]
      .forEach(v => v?.destroy());
  }
}
