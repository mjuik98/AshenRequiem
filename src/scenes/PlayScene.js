import { PlayContext }          from '../core/PlayContext.js';
import { createWorld }           from '../state/createWorld.js';
import { createPlayer }          from '../entities/createPlayer.js';
import { waveData }              from '../data/waveData.js';
import { bossData }              from '../data/bossData.js';
import { upgradeData }           from '../data/upgradeData.js';
import { EFFECT_DEFAULTS }       from '../data/constants.js';
import { mountUI }               from '../ui/dom/mountUI.js';

import { UpgradeSystem }         from '../systems/progression/UpgradeSystem.js';
import { RenderSystem }          from '../systems/render/RenderSystem.js';

import { PlayUI }                from './play/PlayUI.js';
import { PlayResultHandler }     from './play/PlayResultHandler.js';
import { PlayModeStateMachine }  from '../core/PlayModeStateMachine.js';

/**
 * PlayScene — 전투 씬
 */
export class PlayScene {
  constructor(game) {
    this.game             = game;
    this.world            = null;
    this._ctx             = null;
    this._pipeline        = null;
    this._pipelineCtx     = null;
    this._dpr             = 1;

    this._ui              = null;
    this._resultHandler   = null;
    this._uiState         = null;
  }

  enter() {
    this.world        = createWorld();
    this.world.player = createPlayer(0, 0);

    this._ctx = PlayContext.create({
      canvas:           this.game.canvas,
      renderer:         this.game.renderer,
      soundEnabled:     true,
      profilingEnabled: true,
      session:          this.game.session,
    });

    const { pipeline, pipelineCtx } = this._ctx.buildPipeline(
      this.world,
      this.game.input,
      { waveData, upgradeData, bossData },
    );
    this._pipeline    = pipeline;
    this._pipelineCtx = pipelineCtx;

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

    const world = this.world;
    const input = this.game.input;

    this._ui.handleInput(input);
    this._ui.updateDebug(
      world,
      this._ctx,
      dt,
      waveData,
      this._ctx.spawnSystem.getDebugInfo(world.elapsedTime),
    );

    if (this._uiState.tick(world.playMode)) return;

    this._runGamePipeline(dt);
  }

  _runGamePipeline(dt) {
    const world = this.world;
    if (!world) return;

    // 파이프라인 컨텍스트에 매 프레임 변하는 값 주입
    this._pipelineCtx.dt  = dt;
    this._pipelineCtx.dpr = this._dpr;

    this._pipeline.run(this._pipelineCtx);

    this._ui.update(world);
  }

  render() {
    // RenderSystem이 Pipeline(priority 130) 내에서 렌더링을 처리한다.
    // 기존 SceneManager 인터페이스 유지를 위해 빈 메서드로 둠.
  }

  exit() {
    this._ui?.destroy();
    this._uiState?.reset();
    this._ctx?.dispose();

    this._ui              = null;
    this._resultHandler   = null;
    this._uiState         = null;
    this._ctx             = null;
    this._pipeline        = null;
    this._pipelineCtx     = null;
    this.world            = null;
  }

  _showLevelUpUI() {
    this.world.spawnQueue.push({
      type: 'effect',
      config: {
        x:          this.world.player.x,
        y:          this.world.player.y,
        effectType: 'levelFlash',
        color:      '#ffd54f',
        radius:     1,
        duration:   EFFECT_DEFAULTS.levelFlashDuration,
      },
    });

    const choices = UpgradeSystem.generateChoices(this.world.player);
    if (choices.length === 0) {
      this.world.playMode = 'playing';
      return;
    }

    this._ui.showLevelUp(choices, (selectedUpgrade) => {
      UpgradeSystem.applyUpgrade(this.world.player, selectedUpgrade);
      // SynergySystem.applyAll() is already called inside UpgradeSystem.applyUpgrade()
      this.world.playMode = 'playing';
    });
  }

  _showResultUI() {
    const stats = this._resultHandler.process(this.world);
    this._ui.showResult(stats, () => {
      this.game.sceneManager.changeScene(new PlayScene(this.game));
    });
  }
}
