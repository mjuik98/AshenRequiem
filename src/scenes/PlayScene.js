/**
 * src/scenes/PlayScene.js
 *
 * REFACTOR: Phase 2 아키텍처 통합
 *   - buildPipeline() 반환값에서 systems 인스턴스들을 통합 관리 (_systems)
 *   - playMode 변경 시 transitionPlayMode() 사용 (R-20)
 *   - UpgradeApplySystem 연동 (world.pendingUpgrade 기록)
 */
import { PlayContext }         from '../core/PlayContext.js';
import { createWorld }          from '../state/createWorld.js';
import { createPlayer }         from '../entities/createPlayer.js';
import { GameDataLoader }       from '../data/GameDataLoader.js';
import { mountUI }              from '../ui/dom/mountUI.js';
import { UpgradeSystem }        from '../systems/progression/UpgradeSystem.js';
import { PlayUI }               from './play/PlayUI.js';
import { PlayResultHandler }    from './play/PlayResultHandler.js';
import { PlayModeStateMachine }   from '../core/PlayModeStateMachine.js';
import { transitionPlayMode, PlayMode } from '../state/PlayMode.js';

export class PlayScene {
  constructor(game) {
    this.game             = game;
    this.world            = null;
    this._ctx             = null;
    this._pipeline        = null;
    this._pipelineCtx     = null;
    this._systems         = null; // { spawnSystem, cullingSystem }
    this._dpr             = 1;

    this._ui              = null;
    this._resultHandler   = null;
    this._uiState         = null;
    this._gameData        = null;
  }

  enter() {
    this.world        = createWorld();
    this.world.player = createPlayer(0, 0);

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
    });

    this._dpr = window.devicePixelRatio || 1;
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

    if (this._uiState.tick(this.world.playMode)) return;

    this._runGamePipeline(dt);
  }

  _runGamePipeline(dt) {
    if (!this.world) return;
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
  }

  _showLevelUpUI() {
    const choices = UpgradeSystem.generateChoices(this.world.player);
    if (choices.length === 0) {
      transitionPlayMode(this.world, PlayMode.PLAYING);
      return;
    }

    this._ui.showLevelUp(choices, (selectedUpgrade) => {
      // world.pendingUpgrade에 기록만 수행. UpgradeApplySystem이 실제 적용.
      this.world.pendingUpgrade = selectedUpgrade;
      transitionPlayMode(this.world, PlayMode.PLAYING);
    });
  }

  _showResultUI() {
    const stats = this._resultHandler.process(this.world);
    this._ui.showResult(stats, () => {
      this.game.sceneManager.changeScene(new PlayScene(this.game));
    });
  }
}
