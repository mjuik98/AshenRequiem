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
import { BossHudView }                 from '../../ui/boss/BossHudView.js';
import { PauseView }                   from '../../ui/pause/PauseView.js';
import { BossAnnouncementView }        from '../../ui/boss/BossAnnouncementView.js';
import { WeaponEvolutionAnnounceView } from '../../ui/WeaponEvolutionAnnounceView.js';

export class PlayUI {
  constructor(container) {
    this._hud          = new HudView(container);
    this._levelUp      = new LevelUpView(container);
    this._result       = new ResultView(container);
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

  // ── 보스 등장 / 진화 연출 ─────────────────────────────────────────────

  getBossAnnouncementView() { return this._bossAnnounce; }
  getWeaponEvolutionView()  { return this._evoAnnounce; }

  // ── 일시정지 ──────────────────────────────────────────────────────────

  showPause(config) {
    this._pause.show(config);
  }

  hidePause() { this._pause.hide(); }

  isPaused() { return this._pause.isVisible(); }

  // ── 레벨업 오버레이 ───────────────────────────────────────────────────

  showLevelUp(config) {
    this._levelUp.show(config);
  }

  hideLevelUp() { this._levelUp.hide(); }

  isLevelUpVisible() {
    return this._levelUp?.el?.style.display !== 'none';
  }

  // ── 결과 화면 ─────────────────────────────────────────────────────────

  showResult(stats, onRestart, onMetaShop = null) {
    this.hideHud();
    this._result.show(stats, onRestart, onMetaShop);
  }

  isResultVisible() {
    return this._result?.el?.style.display !== 'none';
  }

  // ── 생명주기 ──────────────────────────────────────────────────────────

  destroy() {
    [
      this._hud,
      this._levelUp,
      this._result,
      this._bossHud,
      this._pause,
      this._bossAnnounce,
      this._evoAnnounce,
    ].forEach(view => view?.destroy());
  }
}
