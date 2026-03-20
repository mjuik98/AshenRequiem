/**
 * src/scenes/play/PlayUI.js — 플레이 씬 UI 뷰 통합 관리
 *
 * PATCH:
 * - showPause에서 전달받는 data를 그대로 PauseView에 전달
 * - onMainMenu는 nullable로 유지
 */
import { HudView }                     from '../../ui/hud/HudView.js';
import { LevelUpView }                 from '../../ui/levelup/LevelUpView.js';
import { ResultView }                  from '../../ui/result/ResultView.js';
import { DebugView }                   from '../../ui/debug/DebugView.js';
import { BossHudView }                 from '../../ui/boss/BossHudView.js';
import { PauseView }                   from '../../ui/pause/PauseView.js';
import { BossAnnouncementView }        from '../../ui/boss/BossAnnouncementView.js';
import { WeaponEvolutionAnnounceView } from '../../ui/WeaponEvolutionAnnounceView.js';

export class PlayUI {
  constructor(container) {
    this._hud          = new HudView(container);
    this._levelUp      = new LevelUpView(container);
    this._result       = new ResultView(container);
    this._debug        = new DebugView(container);
    this._bossHud      = new BossHudView(container);
    this._pause        = new PauseView(container);
    this._bossAnnounce = new BossAnnouncementView(container);
    this._evoAnnounce  = new WeaponEvolutionAnnounceView(container);
  }

  // ── HUD ──────────────────────────────────────────────────────────────

  showHud() { this._hud.show(); }
  hideHud() { this._hud.hide(); }

  update(world) {
    this._hud.update(world.player, world);
    this._bossHud.update(world.enemies);
  }

  // ── 디버그 ────────────────────────────────────────────────────────────

  handleInput(input) { this._debug.handleInput(input); }

  updateDebug(world, ctx, dt, waveData, spawnDebug) {
    this._debug.update(world, ctx, dt, waveData, spawnDebug);
  }

  // ── 보스 등장 / 진화 연출 ─────────────────────────────────────────────

  getBossAnnouncementView() { return this._bossAnnounce; }
  getWeaponEvolutionView()  { return this._evoAnnounce; }

  // ── 일시정지 ──────────────────────────────────────────────────────────

  /**
   * @param {object} player
   * @param {object} data
   * @param {Function} onResume
   * @param {Function|null} onMainMenu
   */
  showPause(player, data, onResume, onMainMenu = null) {
    this._pause.show(player, data, onResume, onMainMenu);
  }

  hidePause() { this._pause.hide(); }

  isPaused() { return this._pause.isVisible(); }

  // ── 레벨업 오버레이 ───────────────────────────────────────────────────

  showLevelUp(choices, onSelect) {
    this._levelUp.show(choices, onSelect);
  }

  // ── 결과 화면 ─────────────────────────────────────────────────────────

  showResult(stats, onRestart, onMetaShop = null) {
    this.hideHud();
    this._result.show(stats, onRestart, onMetaShop);
  }

  // ── 생명주기 ──────────────────────────────────────────────────────────

  destroy() {
    [
      this._hud,
      this._levelUp,
      this._result,
      this._debug,
      this._bossHud,
      this._pause,
      this._bossAnnounce,
      this._evoAnnounce,
    ].forEach(view => view?.destroy());
  }
}
