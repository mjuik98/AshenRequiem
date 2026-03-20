/**
 * src/scenes/PlayScene.js
 *
 * CHANGE (Phase 1): ESC 일시정지 토글 추가 (_pauseWasDown 엣지 감지)
 * CHANGE (Phase 2): createPlayer에 session 전달 (영구 업그레이드 반영)
 * CHANGE (Phase 3): _showResultUI에 MetaShopScene 콜백 추가
 */
import { PlayContext }         from '../core/PlayContext.js';
import { createWorld }          from '../state/createWorld.js';
import { createPlayer }         from '../entities/createPlayer.js';
import { GameDataLoader }       from '../data/GameDataLoader.js';
import { mountUI }              from '../ui/dom/mountUI.js';
import { PlayUI }               from './play/PlayUI.js';
import { PlayResultHandler }    from './play/PlayResultHandler.js';
import { PlayModeStateMachine }   from '../core/PlayModeStateMachine.js';
import { transitionPlayMode, PlayMode } from '../state/PlayMode.js';
import { MetaShopScene }        from './MetaShopScene.js';

export class PlayScene {
  constructor(game) {
    this.game             = game;
    this.world            = null;
    this._ctx             = null;
    this._pipeline        = null;
    this._pipelineCtx     = null;
    this._systems         = null;
    this._dpr             = 1;

    this._ui              = null;
    this._resultHandler   = null;
    this._uiState         = null;
    this._gameData        = null;

    // Phase 1: ESC 엣지 감지용 플래그
    this._pauseWasDown    = false;
  }

  enter() {
    this.world        = createWorld();
    // CHANGE (Phase 2/3): session 전달 → 영구 업그레이드 + 장신구 슬롯 반영
    this.world.player = createPlayer(0, 0, this.game.session);

    this._gameData = GameDataLoader.loadDefault();

    this._ctx = PlayContext.create({
      canvas:           this.game.canvas,
      renderer:         this.game.renderer,
      soundEnabled:     true,
      profilingEnabled: true,
      session:          this.game.session,
    });

    const { pipeline, pipelineCtx, systems } = this._ctx.buildPipeline(
      this.world,
      this.game.input,
      this._gameData,
    );
    this._pipeline    = pipeline;
    this._pipelineCtx = pipelineCtx;
    this._systems     = systems;

    this._ui = new PlayUI(mountUI());
    this._ui.showHud();

    this._resultHandler = new PlayResultHandler(this.game.session);

    this._uiState = new PlayModeStateMachine({
      onLevelUp: () => this._showLevelUpUI(),
      onDead:    () => this._showResultUI(),
      onResume:  () => this._ui.hidePause(),
    });

    this._dpr          = window.devicePixelRatio || 1;
    this._pauseWasDown = false;
  }

  update(dt) {
    if (!this.world || !this._ctx || !this._uiState) return;

    const inputState = this.game.input.poll();

    this._ui.handleInput(inputState);
    this._ui.updateDebug(
      this.world,
      this._ctx,
      dt,
      this._gameData.waveData,
      this._systems?.spawnSystem?.getDebugInfo(this.world.elapsedTime),
    );

    // ── Phase 1: ESC 엣지 감지 → 일시정지 토글 ──────────────────────
    const pauseDown = inputState.isAction('pause');
    if (pauseDown && !this._pauseWasDown) {
      this._handlePauseToggle();
    }
    this._pauseWasDown = pauseDown;

    if (this._uiState.tick(this.world.playMode)) return;

    this._runGamePipeline(dt);
  }

  _runGamePipeline(dt) {
    if (!this.world) return;
    this.world.deltaTime  = dt;
    this._pipelineCtx.dt  = dt;
    this._pipelineCtx.dpr = this._dpr;
    this._pipeline.run(this._pipelineCtx);
    this._ui.update(this.world);
  }

  render() {}

  exit() {
    this._ui?.destroy();
    this._uiState?.reset();
    this._ctx?.dispose();
    this._ui          = null;
    this._resultHandler = null;
    this._uiState     = null;
    this._ctx         = null;
    this._pipeline    = null;
    this._pipelineCtx = null;
    this._systems     = null;
    this._gameData    = null;
    this.world        = null;
    this._pauseWasDown = false;
  }

  // ── 내부 핸들러 ───────────────────────────────────────────────────────

  /** Phase 1: ESC 키 → 일시정지 / 재개 토글 */
  _handlePauseToggle() {
    const mode = this.world.playMode;
    if (mode === PlayMode.PLAYING) {
      transitionPlayMode(this.world, PlayMode.PAUSED);
      this._ui.showPause(
        this.world.player,
        () => {
          transitionPlayMode(this.world, PlayMode.PLAYING);
          this._ui.hidePause();
        },
        () => {
          // 메인메뉴(타이틀)로 이동
          import('./TitleScene.js').then(({ TitleScene }) => {
            this.game.sceneManager.changeScene(new TitleScene(this.game));
          });
        }
      );
    } else if (mode === PlayMode.PAUSED) {
      transitionPlayMode(this.world, PlayMode.PLAYING);
      this._ui.hidePause();
    }
  }

  _showLevelUpUI() {
    const choices = this.world.pendingLevelUpChoices || [];
    if (choices.length === 0) {
      transitionPlayMode(this.world, PlayMode.PLAYING);
      return;
    }

    this._ui.showLevelUp(choices, (selectedUpgrade) => {
      this.world.pendingUpgrade = selectedUpgrade;
      transitionPlayMode(this.world, PlayMode.PLAYING);
    });
  }

  _showResultUI() {
    const stats = this._resultHandler.process(this.world);

    // CHANGE (Phase 3): MetaShopScene 콜백 추가
    this._ui.showResult(
      stats,
      () => this.game.sceneManager.changeScene(new PlayScene(this.game)),
      () => this.game.sceneManager.changeScene(new MetaShopScene(this.game)),
    );
  }
}
