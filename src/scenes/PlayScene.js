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
import { createPlayResultApplicationService } from '../app/play/playResultApplicationService.js';
import { saveActiveRunAndPersist } from '../app/play/activeRunApplicationService.js';
import {
  persistPauseSceneOptions,
  runPlaySceneFrame,
  showPlaySceneResult,
  syncPlaySceneDevicePixelRatio,
  togglePlayScenePause,
} from '../app/play/playSceneFlowService.js';
import { createLevelUpController }      from './play/levelUpController.js';
import { bootstrapPlaySceneRuntime }    from './play/playSceneBootstrap.js';
import { PlayModeStateMachine }         from '../core/PlayModeStateMachine.js';
import {
  loadPlaySceneModule,
  loadTitleSceneModule,
} from './sceneLoaders.js';
import { applySessionOptionsToRuntime } from '../app/session/sessionRuntimeApplicationService.js';
import { logRuntimeError } from '../utils/runtimeLogger.js';
import { createDocumentAccessibilityRuntime } from '../ui/shared/accessibilityRuntime.js';

export class PlayScene {
  constructor(game) {
    this.game               = game;
    this.sceneId            = 'PlayScene';
    this.world              = null;
    this._ctx               = null;
    this._pipeline          = null;
    this._pipelineCtx       = null;
    this._systems           = null;
    this._dpr               = 1;

    this._ui                = null;
    this._resultHandler     = null;
    this._uiState           = null;
    this._gameData          = null;
    this._levelUpController = null;

    this._pauseWasDown      = false;
    this._isSceneChanging   = false;
    this._checkpointAccumulator = 0;
  }

  enter() {
    const runtime = bootstrapPlaySceneRuntime({ game: this.game });
    this.world = runtime.world;
    this._gameData = runtime.gameData;
    this._ctx = runtime.ctx;
    this._ui = runtime.ui;
    this._pipeline = runtime.pipeline;
    this._pipelineCtx = runtime.pipelineCtx;
    this._systems = runtime.systems;

    // CHANGE(Settings): 볼륨·품질 설정 반영
    this._applySessionOptions();

    this._resultHandler = createPlayResultApplicationService(this.game.session);
    this._levelUpController = createLevelUpController({
      getWorld: () => this.world,
      getData: () => ({
        ...this._gameData,
        session: this.game.session,
      }),
      isBlocked: () => this._isSceneChanging,
      showLevelUp: (config) => this._ui.showLevelUp(config),
    });

    this._uiState = new PlayModeStateMachine({
      onLevelUp: () => this._levelUpController?.show(),
      onDead:    () => this._showResultUI(),
      onResume:  () => {
        this._ui.hidePause();
        this._ui.hideLevelUp();
      },
    });

    this._dpr = syncPlaySceneDevicePixelRatio({
      sessionOptions: this.game.session?.options,
      currentDpr: 1,
      devicePixelRatio: window.devicePixelRatio || 1,
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
      soundSystem: this._ctx.soundSystem,
      renderer: this.game.renderer,
      accessibilityRuntime: createDocumentAccessibilityRuntime(),
    });
  }

  update(dt) {
    if (!this.world || !this._ctx || !this._uiState || this._isSceneChanging) return;

    const dprState = syncPlaySceneDevicePixelRatio({
      sessionOptions: this.game.session?.options,
      currentDpr: this._dpr,
      devicePixelRatio: window.devicePixelRatio || 1,
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

    if (this._uiState.tick(this.world.run.playMode)) return;

    runPlaySceneFrame({
      world: this.world,
      pipeline: this._pipeline,
      pipelineCtx: this._pipelineCtx,
      ui: this._ui,
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

  exit() {
    this._checkpointActiveRun(true);
    this._ui?.destroy();
    this._uiState?.reset();
    this._ctx?.dispose();
    this._ui               = null;
    this._resultHandler    = null;
    this._uiState          = null;
    this._ctx              = null;
    this._pipeline         = null;
    this._pipelineCtx      = null;
    this._systems          = null;
    this._gameData         = null;
    this._levelUpController = null;
    this.world             = null;
    this._pauseWasDown     = false;
    this._isSceneChanging  = false;
    this._checkpointAccumulator = 0;
  }

  // ── 내부 핸들러 ───────────────────────────────────────────────────────

  _handlePauseToggle() {
    const pauseState = togglePlayScenePause({
      world: this.world,
      ui: this._ui,
      data: this._gameData,
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
      resultHandler: this._resultHandler,
      ui: this._ui,
      isBlocked: () => this._isSceneChanging,
      setBlocked: (value) => {
        this._isSceneChanging = value;
      },
      restart: async () => {
        const { PlayScene: NextPlayScene } = await loadPlaySceneModule();
        this.game.sceneManager.changeScene(new NextPlayScene(this.game));
      },
      goToTitle: async () => {
        const { TitleScene } = await loadTitleSceneModule();
        this.game.sceneManager.changeScene(new TitleScene(this.game));
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
}
