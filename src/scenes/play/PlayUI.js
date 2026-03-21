/**
 * src/scenes/play/PlayUI.js — 플레이 씬 UI 뷰 통합 관리
 *
 * FIX(BUG-PAUSE-WORLD): showPause()에 world 파라미터 추가
 *   Before: showPause(player, data, onResume, onMainMenu) — world 누락
 *           PlayScene이 5번째 인수로 world를 전달했지만 PlayUI가 받지 않아
 *           PauseView에 world가 전달되지 않음 → 생존 시간 · 킬 수 항상 '--:--' / '—' 표시
 *   After:  showPause(player, data, onResume, onMainMenu, world) — world → PauseView 전달
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
   * @param {object}        player
   * @param {object}        data
   * @param {Function}      onResume
   * @param {Function|null} onMainMenu
   * @param {object|null}   world   FIX: 생존 시간·킬 수 표시를 위해 추가
   */
  showPause(player, data, onResume, onMainMenu = null, world = null) {
    this._pause.show(player, data, onResume, onMainMenu, world);
  }

  hidePause() { this._pause.hide(); }

  isPaused() { return this._pause.isVisible(); }

  // ── 레벨업 오버레이 ───────────────────────────────────────────────────

  showLevelUp(choices, onSelect, title) {
    this._levelUp.show(choices, onSelect, title);
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
