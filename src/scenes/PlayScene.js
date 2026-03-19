/**
 * src/scenes/PlayScene.js
 *
 * FIX: UpgradeSystem.applyUpgrade에 synergyData 전달 (DI 흐름 완성)
 *
 *   Before:
 *     UpgradeSystem.applyUpgrade(player, upgrade)
 *     → UpgradeSystem → SynergySystem.applyAll({ player }) → 내부에서 직접 import
 *
 *   After:
 *     UpgradeSystem.applyUpgrade(player, upgrade, this._gameData.synergyData)
 *     → UpgradeSystem → SynergySystem.applyAll({ player, synergyData }) → DI 완성
 *     → 씬이 어떤 데이터셋을 쓰는지가 명시적으로 전달 흐름에 반영됨
 */
import { PlayContext }         from '../core/PlayContext.js';
import { createWorld }          from '../state/createWorld.js';
import { createPlayer }         from '../entities/createPlayer.js';
import { GameDataLoader }       from '../data/GameDataLoader.js';
import { mountUI }              from '../ui/dom/mountUI.js';

import { UpgradeSystem }        from '../systems/progression/UpgradeSystem.js';

import { PlayUI }               from './play/PlayUI.js';
import { PlayResultHandler }    from './play/PlayResultHandler.js';
import { PlayModeStateMachine } from '../core/PlayModeStateMachine.js';

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

    const { pipeline, pipelineCtx } = this._ctx.buildPipeline(
      this.world,
      this.game.input,
      this._gameData,
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

    const inputState = this.game.input.poll();

    this._ui.handleInput(inputState);
    this._ui.updateDebug(
      this.world,
      this._ctx,
      dt,
      this._gameData.waveData,
      this._ctx.spawnSystem.getDebugInfo(this.world.elapsedTime),
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
    this._gameData    = null;
    this.world        = null;
  }

  _showLevelUpUI() {
    // 레벨업 이펙트(levelFlash)는 levelUpHandler가 처리. 씬은 UI 전환만 담당.
    const choices = UpgradeSystem.generateChoices(this.world.player);
    if (choices.length === 0) {
      this.world.playMode = 'playing';
      return;
    }

    this._ui.showLevelUp(choices, (selectedUpgrade) => {
      // FIX: synergyData 명시적 전달 (DI 흐름 완성)
      UpgradeSystem.applyUpgrade(
        this.world.player,
        selectedUpgrade,
        this._gameData.synergyData,
      );
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
