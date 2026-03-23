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
import { PlayContext }                  from '../core/PlayContext.js';
import { createWorld }                  from '../state/createWorld.js';
import { createPlayer }                 from '../entities/createPlayer.js';
import { GameDataLoader }               from '../data/GameDataLoader.js';
import { mountUI }                      from '../ui/dom/mountUI.js';
import { PlayUI }                       from './play/PlayUI.js';
import { PlayResultHandler }            from './play/PlayResultHandler.js';
import { createLevelUpController }      from './play/levelUpController.js';
import {
  applyRunSessionState,
  recordStartingWeapons,
  shouldEnablePipelineProfiling,
} from './play/playSceneRuntime.js';
import {
  persistPauseSceneOptions,
  runPlaySceneFrame,
  showPlaySceneResult,
  syncPlaySceneDevicePixelRatio,
  togglePlayScenePause,
} from './play/playSceneFlow.js';
import { PlayModeStateMachine }         from '../core/PlayModeStateMachine.js';
import { transitionPlayMode } from '../state/PlayMode.js';
import { TitleScene }                   from './TitleScene.js';
import { recordWeaponAcquired }         from '../systems/event/codexHandler.js';
import {
  applySessionOptionsToRuntime,
  normalizeSessionOptions,
} from '../state/sessionOptions.js';

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
  }

  enter() {
    this.world        = createWorld();
    this.world.player = createPlayer(0, 0, this.game.session);
    applyRunSessionState(this.world, this.game.session);

    this._gameData = GameDataLoader.clone(this.game.gameData);

    // CHANGE(Settings): soundEnabled를 session.options에서 읽음
    const opts = normalizeSessionOptions(this.game.session?.options);

    this._ctx = PlayContext.create({
      canvas:           this.game.canvas,
      renderer:         this.game.renderer,
      soundEnabled:     opts.soundEnabled ?? true,
      profilingEnabled: shouldEnablePipelineProfiling(),
      session:          this.game.session,
    });

    this._ui = new PlayUI(mountUI());
    this._ui.showHud();

    this._ctx.setAnnouncementViews(
      this._ui.getBossAnnouncementView(),
      this._ui.getWeaponEvolutionView(),
    );

    const { pipeline, pipelineCtx, systems } = this._ctx.buildPipeline(
      this.world,
      this.game.input,
      this._gameData,
    );
    this._pipeline    = pipeline;
    this._pipelineCtx = pipelineCtx;
    this._systems     = systems;

    // CHANGE(Settings): 볼륨·품질 설정 반영
    this._applySessionOptions();

    this._resultHandler = new PlayResultHandler(this.game.session);
    this._levelUpController = createLevelUpController({
      getWorld: () => this.world,
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

    // Record initial starting weapons for Codex
    recordStartingWeapons(this.game.session, this.world.player, recordWeaponAcquired);

    this._pauseWasDown    = false;
    this._isSceneChanging = false;
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

    if (this._uiState.tick(this.world.playMode)) return;

    runPlaySceneFrame({
      world: this.world,
      pipeline: this._pipeline,
      pipelineCtx: this._pipelineCtx,
      ui: this._ui,
      dt,
      dpr: this._dpr,
    });
  }

  render() {}

  exit() {
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
  }

  // ── 내부 핸들러 ───────────────────────────────────────────────────────

  _handlePauseToggle() {
    togglePlayScenePause({
      world: this.world,
      ui: this._ui,
      data: this._gameData,
      session: this.game.session,
      isBlocked: () => this._isSceneChanging,
      onOptionsChange: (nextOptions) => this._updatePauseOptions(nextOptions),
    });
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
      restart: () => {
        this.game.sceneManager.changeScene(new PlayScene(this.game));
      },
      goToTitle: () => {
        this.game.sceneManager.changeScene(new TitleScene(this.game));
      },
    });
  }
}
