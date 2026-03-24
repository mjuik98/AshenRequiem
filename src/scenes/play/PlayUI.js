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
import { BossHudView }                 from '../../ui/boss/BossHudView.js';
import { BossAnnouncementView }        from '../../ui/boss/BossAnnouncementView.js';
import { WeaponEvolutionAnnounceView } from '../../ui/WeaponEvolutionAnnounceView.js';
import {
  loadLevelUpViewModule,
  loadPauseViewModule,
  loadResultViewModule,
} from '../sceneLoaders.js';

export class PlayUI {
  constructor(container, loaders = {}) {
    this._container = container;
    this._loadPauseViewModule = loaders.loadPauseViewModule ?? loadPauseViewModule;
    this._loadResultViewModule = loaders.loadResultViewModule ?? loadResultViewModule;
    this._loadLevelUpViewModule = loaders.loadLevelUpViewModule ?? loadLevelUpViewModule;
    this._hud          = new HudView(container);
    this._bossHud      = new BossHudView(container);
    this._bossAnnounce = new BossAnnouncementView(container);
    this._evoAnnounce  = new WeaponEvolutionAnnounceView(container);

    this._pause = null;
    this._result = null;
    this._levelUp = null;

    this._pauseVisible = false;
    this._resultVisible = false;
    this._levelUpVisible = false;

    this._pendingPauseConfig = null;
    this._pendingResultArgs = null;
    this._pendingLevelUpConfig = null;

    this._pauseViewPromise = null;
    this._resultViewPromise = null;
    this._levelUpViewPromise = null;
    this._destroyed = false;
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
    this._pauseVisible = true;
    this._pendingPauseConfig = config;
    return this._ensurePauseView().then((pauseView) => {
      if (!pauseView || this._destroyed || !this._pauseVisible) return false;
      pauseView.show(this._pendingPauseConfig);
      return true;
    });
  }

  hidePause() {
    this._pauseVisible = false;
    this._pendingPauseConfig = null;
    this._pause?.hide();
  }

  isPaused() { return this._pauseVisible || this._pause?.isVisible?.() || false; }

  // ── 레벨업 오버레이 ───────────────────────────────────────────────────

  showLevelUp(config) {
    this._levelUpVisible = true;
    this._pendingLevelUpConfig = config;
    return this._ensureLevelUpView().then((levelUpView) => {
      if (!levelUpView || this._destroyed || !this._levelUpVisible) return false;
      levelUpView.show(this._pendingLevelUpConfig);
      return true;
    });
  }

  hideLevelUp() {
    this._levelUpVisible = false;
    this._pendingLevelUpConfig = null;
    this._levelUp?.hide();
  }

  isLevelUpVisible() {
    return this._levelUpVisible || this._levelUp?.el?.style.display !== 'none';
  }

  // ── 결과 화면 ─────────────────────────────────────────────────────────

  showResult(stats, onRestart, onMetaShop = null) {
    this.hideHud();
    this._resultVisible = true;
    this._pendingResultArgs = [stats, onRestart, onMetaShop];
    return this._ensureResultView().then((resultView) => {
      if (!resultView || this._destroyed || !this._resultVisible) return false;
      resultView.show(...this._pendingResultArgs);
      return true;
    });
  }

  isResultVisible() {
    return this._resultVisible || this._result?.el?.style.display !== 'none';
  }

  // ── 생명주기 ──────────────────────────────────────────────────────────

  destroy() {
    this._destroyed = true;
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

  _ensurePauseView() {
    if (this._pause) return Promise.resolve(this._pause);
    if (this._pauseViewPromise) return this._pauseViewPromise;

    this._pauseViewPromise = this._loadPauseViewModule().then(({ PauseView }) => {
      if (this._destroyed) return null;
      this._pause = new PauseView(this._container);
      return this._pause;
    });
    return this._pauseViewPromise;
  }

  _ensureResultView() {
    if (this._result) return Promise.resolve(this._result);
    if (this._resultViewPromise) return this._resultViewPromise;

    this._resultViewPromise = this._loadResultViewModule().then(({ ResultView }) => {
      if (this._destroyed) return null;
      this._result = new ResultView(this._container);
      return this._result;
    });
    return this._resultViewPromise;
  }

  _ensureLevelUpView() {
    if (this._levelUp) return Promise.resolve(this._levelUp);
    if (this._levelUpViewPromise) return this._levelUpViewPromise;

    this._levelUpViewPromise = this._loadLevelUpViewModule().then(({ LevelUpView }) => {
      if (this._destroyed) return null;
      this._levelUp = new LevelUpView(this._container);
      return this._levelUp;
    });
    return this._levelUpViewPromise;
  }
}
