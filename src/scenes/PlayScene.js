/**
 * src/scenes/PlayScene.js
 *
 * CHANGE(Settings): session.options 기반 설정 적용 추가
 *   - PlayContext.create() 시 soundEnabled를 session.options에서 읽음
 *   - _applySessionOptions(): 볼륨 및 품질 프리셋 반영
 *
 * PATCH:
 * - pause 메뉴에서 메인메뉴 이동 시 중복 전환 방지
 * - 비동기 import 레이스 방지용 플래그 추가
 * - devicePixelRatio 변화를 추적해 렌더 파이프라인에 반영
 */
import { saveActiveRunAndPersist } from '../app/play/activeRunApplicationService.js';
import {
  persistPauseSceneOptions,
  runPlaySceneFrame,
  showPlaySceneResult,
  syncPlaySceneDevicePixelRatio,
  togglePlayScenePause,
} from '../app/play/playSceneFlowService.js';
import { bootstrapPlaySceneRuntime }    from './play/playSceneBootstrap.js';
import { applySessionOptionsToRuntime } from '../app/session/sessionRuntimeApplicationService.js';
import { logRuntimeError } from '../utils/runtimeLogger.js';
import {
  createPlaySceneRuntimeState,
  disposePlaySceneRuntimeState,
  getPlaySceneDebugSurface,
} from './play/playSceneRuntimeState.js';

export class PlayScene {
  constructor(game) {
    this.game               = game;
    this.sceneId            = 'PlayScene';
    this.world              = null;
    this._runtimeState      = createPlaySceneRuntimeState();
    this._dpr               = 1;

    this._pauseWasDown      = false;
    this._isSceneChanging   = false;
    this._checkpointAccumulator = 0;
  }

  enter() {
    const runtime = bootstrapPlaySceneRuntime({ game: this.game });
    this.world = runtime.world;
    this._syncViewportState();
    this._runtimeState = createPlaySceneRuntimeState({
      runtime,
      session: this.game.session,
      getWorld: () => this.world,
      isBlocked: () => this._isSceneChanging,
      showResult: () => this._showResultUI(),
    });

    // CHANGE(Settings): 볼륨·품질 설정 반영
    this._applySessionOptions();

    this._dpr = syncPlaySceneDevicePixelRatio({
      sessionOptions: this.game.session?.options,
      currentDpr: 1,
      devicePixelRatio: this._runtimeState.devicePixelRatioReader?.() ?? 1,
    }).dpr;

    this._pauseWasDown    = false;
    this._isSceneChanging = false;
    this._checkpointAccumulator = 0;
  }

  /**
   * 세션 설정을 실행 중인 시스템에 반영한다.
   * enter() 직후 1회 호출된다.
   *
   * - 볼륨: SoundSystem.setVolume(master, bgm, sfx)
   * - 품질: CanvasRenderer.setQualityPreset(preset)
   */
  _applySessionOptions() {
    applySessionOptionsToRuntime(this.game.session?.options, {
      soundSystem: this._runtimeState.ctx?.soundSystem,
      renderer: this.game.renderer,
      accessibilityRuntime: this._runtimeState.accessibilityRuntime,
    });
  }

  update(dt) {
    if (!this.world || !this._runtimeState.ctx || !this._runtimeState.uiState || this._isSceneChanging) return;
    this._syncViewportState();

    const dprState = syncPlaySceneDevicePixelRatio({
      sessionOptions: this.game.session?.options,
      currentDpr: this._dpr,
      devicePixelRatio: this._runtimeState.devicePixelRatioReader?.() ?? 1,
    });
    if (dprState.changed) {
      this._dpr = dprState.dpr;
    }

    const inputState = this.game.inputState ?? this.game.input.poll();

    const pauseDown = inputState.isAction('pause');
    if (pauseDown && !this._pauseWasDown) {
      this._handlePauseToggle();
    }
    this._pauseWasDown = pauseDown;

    if (this._runtimeState.uiState.tick(this.world.run.playMode)) return;

    runPlaySceneFrame({
      world: this.world,
      pipeline: this._runtimeState.pipeline,
      pipelineCtx: this._runtimeState.pipelineCtx,
      ui: this._runtimeState.ui,
      dt,
      dpr: this._dpr,
    });

    this._checkpointAccumulator += dt;
    if (this.world.run.playMode === 'playing' && this._checkpointAccumulator >= 5) {
      this._checkpointAccumulator = 0;
      this._checkpointActiveRun();
    }
  }

  render() {}

  getDebugSurface() {
    return getPlaySceneDebugSurface(this._runtimeState);
  }

  exit() {
    this._checkpointActiveRun(true);
    this._runtimeState      = disposePlaySceneRuntimeState(this._runtimeState);
    this.world             = null;
    this._pauseWasDown     = false;
    this._isSceneChanging  = false;
    this._checkpointAccumulator = 0;
  }

  // ── 내부 핸들러 ───────────────────────────────────────────────────────

  _handlePauseToggle() {
    const pauseState = togglePlayScenePause({
      world: this.world,
      ui: this._runtimeState.ui,
      data: this._runtimeState.gameData,
      session: this.game.session,
      isBlocked: () => this._isSceneChanging,
      consumePausePress: () => {
        this._pauseWasDown = true;
      },
      onOptionsChange: (nextOptions) => this._updatePauseOptions(nextOptions),
    });
    if (pauseState === 'paused') {
      this._checkpointAccumulator = 0;
      this._checkpointActiveRun(true);
    }
  }

  _updatePauseOptions(nextOptions) {
    persistPauseSceneOptions(this.game.session, nextOptions, {
      applyRuntimeOptions: () => this._applySessionOptions(),
    });
  }

  _showResultUI() {
    showPlaySceneResult({
      world: this.world,
      resultHandler: this._runtimeState.resultHandler,
      ui: this._runtimeState.ui,
      isBlocked: () => this._isSceneChanging,
      setBlocked: (value) => {
        this._isSceneChanging = value;
      },
      restart: async () => {
        const nextScene = await this.game?.sceneFactory?.createPlayScene?.(this.game);
        this.game.sceneManager.changeScene(nextScene);
      },
      goToTitle: async () => {
        const nextScene = await this.game?.sceneFactory?.createTitleScene?.(this.game);
        this.game.sceneManager.changeScene(nextScene);
      },
      onError: (error) => logRuntimeError('PlayScene', '결과 화면 씬 전환 실패:', error),
    });
  }

  _checkpointActiveRun(force = false) {
    if (!this.world || !this.game?.session) return;
    if (this.world.run.runOutcome && !force) return;
    if (this.world.run.playMode === 'dead' && !force) return;
    saveActiveRunAndPersist(this.game.session, this.world);
  }

  _syncViewportState() {
    if (!this.world?.runtime) return;
    if (!this.game?.viewport) return;
    this.world.runtime.viewport = { ...this.game.viewport };
  }
}
