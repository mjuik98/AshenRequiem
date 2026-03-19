/**
 * src/scenes/play/PlayUI.js — 플레이 씬 UI 뷰 통합 관리 (신규)
 *
 * REFACTOR: PlayScene UI 책임 분리
 *   Before: PlayScene.enter() 에서 5개 뷰 인스턴스를 직접 생성·보관·파괴
 *           PlayScene.update() 에서 직접 각 뷰 메서드 호출
 *           → PlayScene이 게임 흐름 + UI 뷰 관리 두 가지 책임을 가짐
 *
 *   After:  PlayUI 가 5개 뷰의 생명주기를 단일 책임으로 관리
 *           PlayScene 은 this._ui.showLevelUp(), this._ui.showResult() 만 호출
 *           → PlayScene 은 순수하게 흐름 제어만 담당
 *
 * 사용법 (PlayScene.enter()):
 *   this._ui = new PlayUI(mountUI());
 *   this._ui.showHud();
 *
 * 사용법 (PlayScene.exit()):
 *   this._ui.destroy();
 *   this._ui = null;
 */

import { HudView }     from '../../ui/hud/HudView.js';
import { LevelUpView } from '../../ui/levelup/LevelUpView.js';
import { ResultView }  from '../../ui/result/ResultView.js';
import { DebugView }   from '../../ui/debug/DebugView.js';
import { BossHudView } from '../../ui/boss/BossHudView.js';

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
   * @param {{ killCount: number, survivalTime: number, level: number }} stats
   * @param {Function} onRestart  재시작 콜백
   */
  showResult(stats, onRestart) {
    this.hideHud();
    this._result.show(stats, onRestart);
  }

  // ── 생명주기 ──────────────────────────────────────────────────────────

  destroy() {
    [this._hud, this._levelUp, this._result, this._debug, this._bossHud]
      .forEach(v => v?.destroy());
  }
}
