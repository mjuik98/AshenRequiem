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

    this._pauseViewClass = null;
    this._resultViewClass = null;
    this._levelUpViewClass = null;

    this._pauseModulePromise = null;
    this._resultModulePromise = null;
    this._levelUpModulePromise = null;

    this._pauseViewPromise = null;
    this._resultViewPromise = null;
    this._levelUpViewPromise = null;
    this._destroyed = false;

    this._preloadOverlayModules();
  }

  // ── HUD ──────────────────────────────────────────────────────────────

  showHud() { this._hud.show(); }
  hideHud() { this._hud.hide(); }

  update(world) {
    this._hud.update(world.entities.player, world);
    this._bossHud.update(world.entities.enemies);
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
    }).catch((error) => {
      console.error('[PlayUI] PauseView 로드 실패:', error);
      return false;
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
    }).catch((error) => {
      console.error('[PlayUI] LevelUpView 로드 실패:', error);
      return false;
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
    }).catch((error) => {
      console.error('[PlayUI] ResultView 로드 실패:', error);
      return false;
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

  _preloadOverlayModules() {
    this._loadPauseViewClass().catch(() => null);
    this._loadResultViewClass().catch(() => null);
    this._loadLevelUpViewClass().catch(() => null);
  }

  _loadPauseViewClass() {
    if (this._pauseViewClass) return Promise.resolve(this._pauseViewClass);
    if (this._pauseModulePromise) return this._pauseModulePromise;

    this._pauseModulePromise = this._loadPauseViewModule()
      .then(({ PauseView }) => {
        this._pauseViewClass = PauseView;
        return PauseView;
      })
      .catch((error) => {
        this._pauseModulePromise = null;
        throw error;
      });

    return this._pauseModulePromise;
  }

  _loadResultViewClass() {
    if (this._resultViewClass) return Promise.resolve(this._resultViewClass);
    if (this._resultModulePromise) return this._resultModulePromise;

    this._resultModulePromise = this._loadResultViewModule()
      .then(({ ResultView }) => {
        this._resultViewClass = ResultView;
        return ResultView;
      })
      .catch((error) => {
        this._resultModulePromise = null;
        throw error;
      });

    return this._resultModulePromise;
  }

  _loadLevelUpViewClass() {
    if (this._levelUpViewClass) return Promise.resolve(this._levelUpViewClass);
    if (this._levelUpModulePromise) return this._levelUpModulePromise;

    this._levelUpModulePromise = this._loadLevelUpViewModule()
      .then(({ LevelUpView }) => {
        this._levelUpViewClass = LevelUpView;
        return LevelUpView;
      })
      .catch((error) => {
        this._levelUpModulePromise = null;
        throw error;
      });

    return this._levelUpModulePromise;
  }

  _ensurePauseView() {
    if (this._pause) return Promise.resolve(this._pause);
    if (this._pauseViewPromise) return this._pauseViewPromise;

    this._pauseViewPromise = this._loadPauseViewClass()
      .then((PauseView) => {
        if (this._destroyed) return null;
        this._pause = new PauseView(this._container);
        return this._pause;
      })
      .catch((error) => {
        this._pauseViewPromise = null;
        throw error;
      });
    return this._pauseViewPromise;
  }

  _ensureResultView() {
    if (this._result) return Promise.resolve(this._result);
    if (this._resultViewPromise) return this._resultViewPromise;

    this._resultViewPromise = this._loadResultViewClass()
      .then((ResultView) => {
        if (this._destroyed) return null;
        this._result = new ResultView(this._container);
        return this._result;
      })
      .catch((error) => {
        this._resultViewPromise = null;
        throw error;
      });
    return this._resultViewPromise;
  }

  _ensureLevelUpView() {
    if (this._levelUp) return Promise.resolve(this._levelUp);
    if (this._levelUpViewPromise) return this._levelUpViewPromise;

    this._levelUpViewPromise = this._loadLevelUpViewClass()
      .then((LevelUpView) => {
        if (this._destroyed) return null;
        this._levelUp = new LevelUpView(this._container);
        return this._levelUp;
      })
      .catch((error) => {
        this._levelUpViewPromise = null;
        throw error;
      });
    return this._levelUpViewPromise;
  }
}
