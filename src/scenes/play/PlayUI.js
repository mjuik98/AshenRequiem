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
import { LazyOverlayController }       from './LazyOverlayController.js';
import {
  loadLevelUpViewModule,
  loadPauseViewModule,
  loadResultViewModule,
} from '../overlayViewLoaders.js';
import { logRuntimeError } from '../../utils/runtimeLogger.js';
import { buildModuleLoadFailureMessage } from '../../utils/runtimeIssue.js';

export class PlayUI {
  constructor(container, {
    onOverlayLoadFailure = null,
    ...loaders
  } = {}) {
    this._container = container;
    this._hud          = new HudView(container);
    this._bossHud      = new BossHudView(container);
    this._bossAnnounce = new BossAnnouncementView(container);
    this._evoAnnounce  = new WeaponEvolutionAnnounceView(container);
    this._onOverlayLoadFailure = onOverlayLoadFailure;

    this._destroyed = false;
    this._pauseOverlay = this._createPauseOverlay(loaders.loadPauseViewModule ?? loadPauseViewModule);
    this._resultOverlay = this._createResultOverlay(loaders.loadResultViewModule ?? loadResultViewModule);
    this._levelUpOverlay = this._createLevelUpOverlay(loaders.loadLevelUpViewModule ?? loadLevelUpViewModule);

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
    return this._pauseOverlay.show(config);
  }

  hidePause() {
    this._pauseOverlay.hide();
  }

  isPaused() { return this._pauseOverlay.isVisible(); }

  // ── 레벨업 오버레이 ───────────────────────────────────────────────────

  showLevelUp(config) {
    return this._levelUpOverlay.show(config);
  }

  hideLevelUp() {
    this._levelUpOverlay.hide();
  }

  isLevelUpVisible() {
    return this._levelUpOverlay.isVisible();
  }

  // ── 결과 화면 ─────────────────────────────────────────────────────────

  showResult(stats, onRestart, onMetaShop = null) {
    this.hideHud();
    return this._resultOverlay.show([stats, onRestart, onMetaShop]);
  }

  hideResult() {
    this._resultOverlay.hide();
  }

  isResultVisible() {
    return this._resultOverlay.isVisible();
  }

  // ── 생명주기 ──────────────────────────────────────────────────────────

  destroy() {
    this._destroyed = true;
    [
      this._hud,
      this._bossHud,
      this._bossAnnounce,
      this._evoAnnounce,
    ].forEach(view => view?.destroy());
    this._pauseOverlay.destroy();
    this._resultOverlay.destroy();
    this._levelUpOverlay.destroy();
  }

  _preloadOverlayModules() {
    this._pauseOverlay.preload();
    this._resultOverlay.preload();
    this._levelUpOverlay.preload();
  }

  _createPauseOverlay(loadViewModule) {
    return new LazyOverlayController({
      loadViewModule,
      resolveViewClass: ({ PauseView }) => PauseView,
      createView: (PauseView) => new PauseView(this._container),
      showView: (view, config) => view.show(config),
      hideView: (view) => view?.hide?.(),
      isVisible: (view) => view?.isVisible?.() || false,
      onError: (error) => this._reportOverlayLoadFailure('pause', '일시정지', 'PauseView', error),
    });
  }

  _createResultOverlay(loadViewModule) {
    return new LazyOverlayController({
      loadViewModule,
      resolveViewClass: ({ ResultView }) => ResultView,
      createView: (ResultView) => new ResultView(this._container),
      showView: (view, payload) => view.show(...payload),
      hideView: (view) => {
        if (!view) return;
        if (view.hide) {
          view.hide();
          return;
        }
        if (view.el?.style) {
          view.el.style.display = 'none';
          view.el.innerHTML = '';
        }
      },
      onError: (error) => this._reportOverlayLoadFailure('result', '결과', 'ResultView', error),
    });
  }

  _createLevelUpOverlay(loadViewModule) {
    return new LazyOverlayController({
      loadViewModule,
      resolveViewClass: ({ LevelUpView }) => LevelUpView,
      createView: (LevelUpView) => new LevelUpView(this._container),
      showView: (view, config) => view.show(config),
      hideView: (view) => view?.hide?.(),
      onError: (error) => this._reportOverlayLoadFailure('level-up', '레벨 업', 'LevelUpView', error),
    });
  }

  _reportOverlayLoadFailure(overlayKind, label, viewName, error) {
    const issue = {
      overlayKind,
      label,
      viewName,
      message: buildModuleLoadFailureMessage(label, error),
      error,
    };
    logRuntimeError('PlayUI', `${viewName} 로드 실패:`, error);
    this._onOverlayLoadFailure?.(issue);
    return issue;
  }
}
