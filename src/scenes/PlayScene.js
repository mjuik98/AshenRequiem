import { PlayContext } from '../core/PlayContext.js';
import { createWorld }   from '../state/createWorld.js';
import { createUiState }  from '../state/createUiState.js';
import { createPlayer }   from '../entities/createPlayer.js';
import { waveData }       from '../data/waveData.js';
import { bossData }       from '../data/bossData.js';
import { upgradeData }    from '../data/upgradeData.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';
import { updateSessionBest, saveSession } from '../state/createSessionState.js';

import { UpgradeSystem }        from '../systems/progression/UpgradeSystem.js';
import { FlushSystem }          from '../systems/spawn/FlushSystem.js';
import { RenderSystem }         from '../systems/render/RenderSystem.js';
import { EventRegistry }        from '../systems/event/EventRegistry.js';

import { mountUI }      from '../ui/dom/mountUI.js';
import { HudView }      from '../ui/hud/HudView.js';
import { LevelUpView }  from '../ui/levelup/LevelUpView.js';
import { ResultView }   from '../ui/result/ResultView.js';
import { DebugView }    from '../ui/debug/DebugView.js';
import { BossHudView }  from '../ui/boss/BossHudView.js';

import { PlayModeStateMachine } from '../core/PlayModeStateMachine.js';

/**
 * PlayScene — 전투 씬
 *
 * BUGFIX:
 *   BUG-6: _showLevelUpUI() 안에 this._levelUpShown = false 잔재 코드 존재
 *          PlayModeStateMachine 도입 이전의 플래그 방식 코드가 삭제되지 않음.
 *          this._levelUpShown 은 constructor에 선언되지도 않은 유령 필드이며,
 *          상태 관리는 PlayModeStateMachine._firedLevelUp 이 전담.
 *          → 해당 라인 삭제
 */
export class PlayScene {
  constructor(game) {
    this.game            = game;
    this.world           = null;
    this._ctx            = null;
    this._pipeline       = null;
    this._pipelineCtx    = null;
    this._dpr            = 1;
    this._uiState        = null;

    this.hudView         = null;
    this.levelUpView     = null;
    this.resultView      = null;
    this.debugView       = null;
    this.bossHudView     = null;
  }

  enter() {
    this.world        = createWorld();
    this.world.player = createPlayer(0, 0);

    this._ctx = PlayContext.create({
      canvas: this.game.canvas,
      soundEnabled: true,
      profilingEnabled: true,
    });

    const { pipeline, pipelineCtx } = this._ctx.buildPipeline(
      this.world,
      this.game.input,
      { waveData, upgradeData, bossData }
    );
    this._pipeline    = pipeline;
    this._pipelineCtx = pipelineCtx;

    // FIX(BUG-A): EventRegistry.initWorldEvents(this.world) 제거
    // 해당 메서드는 EventRegistry에 존재하지 않으며, events 초기화는
    // createWorld()의 EVENT_TYPES.reduce() 가 이미 수행함.

    this._uiState = new PlayModeStateMachine({
      onLevelUp: () => this._showLevelUpUI(),
      onDead:    () => this._showResultUI(),
    });

    const uiContainer = mountUI();
    this.hudView     = new HudView(uiContainer);
    this.levelUpView = new LevelUpView(uiContainer);
    this.resultView  = new ResultView(uiContainer);
    this.debugView   = new DebugView(uiContainer);
    this.bossHudView = new BossHudView(uiContainer);
    this.hudView.show();

    this._dpr = window.devicePixelRatio || 1;
  }

  update(dt) {
    if (!this.world || !this._ctx) return;
    if (!this._uiState) return;
    const world = this.world;
    const input = this.game.input;

    this.debugView.handleInput(input);
    this.debugView.update(
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

    // FIX(BUG-E): EventRegistry.clearAll(world.events) 제거
    // AGENTS.md 6.6: 이벤트 큐 초기화는 파이프라인 priority 105의 EventRegistry.update()가 전담.

    world.time        += dt;
    world.deltaTime    = dt;
    world.elapsedTime += dt;

    this._pipeline.run(this._pipelineCtx);

    FlushSystem.tickEffects({ effects: world.effects, deltaTime: dt });

    this.hudView.update(world.player, world);
    this.bossHudView.update(world.enemies);
  }

  render() {
    if (!this.world) return;
    RenderSystem.update({
      world:    this.world,
      camera:   this.world.camera,
      renderer: this.game.renderer,
      dpr:      this._dpr,
    });
  }

  exit() {
    this.hudView?.destroy();
    this.levelUpView?.destroy();
    this.resultView?.destroy();
    this.debugView?.destroy();
    this.bossHudView?.destroy();

    this._uiState?.reset();
    this._ctx?.destroy();

    this._uiState     = null;
    this._ctx         = null;
    this._pipeline    = null;
    this._pipelineCtx = null;
  }

  _showLevelUpUI() {
    this._ctx?.soundSystem?.play('levelup');
    this.world.effects.push(this._ctx.effectPool.acquire({
      x:          this.world.player.x,
      y:          this.world.player.y,
      effectType: 'levelFlash',
      color:      '#ffd54f',
      radius:     1,
      duration:   EFFECT_DEFAULTS.levelFlashDuration,
    }));

    const choices = UpgradeSystem.generateChoices(this.world.player);
    if (choices.length === 0) {
      this.world.playMode = 'playing';
      // FIX(BUG-6): this._levelUpShown = false 삭제
      return;
    }

    this.levelUpView.show(choices, async (selectedUpgrade) => {
      UpgradeSystem.applyUpgrade(this.world.player, selectedUpgrade);
      const { SynergySystem } = await import('../systems/progression/SynergySystem.js');
      SynergySystem.applyAll({ player: this.world.player, upgradeData });
      this.world.playMode = 'playing';
    });
  }

  _showResultUI() {
    this.hudView.hide();

    updateSessionBest(this.game.session, {
      killCount:    this.world.killCount,
      elapsedTime:  this.world.elapsedTime,
      playerLevel:  this.world.player.level,
    });
    saveSession(this.game.session);

    this.resultView.show(
      {
        killCount:    this.world.killCount,
        survivalTime: this.world.elapsedTime,
        level:        this.world.player.level,
      },
      () => {
        this.game.sceneManager.changeScene(new PlayScene(this.game));
      },
    );
  }
}
