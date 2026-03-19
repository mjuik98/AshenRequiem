import { PlayContext } from '../core/PlayContext.js';
import { createWorld }   from '../state/createWorld.js';
import { createPlayer }  from '../entities/createPlayer.js';
import { waveData }      from '../data/waveData.js';
import { bossData }      from '../data/bossData.js';
import { upgradeData }   from '../data/upgradeData.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';
import { GameConfig }    from '../core/GameConfig.js';
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
 * BUGFIX 목록:
 *   BUG-1: exit()에서 this._ctx?.destroy() → this._ctx?.dispose()
 *          PlayContext에 destroy()는 존재하지 않아 BGM이 해제되지 않고 누수됨.
 *          dispose()가 올바른 메서드이며 soundSystem.stopBgm() + pipeline 정리를 수행함.
 *          또한 this.world = null 추가로 월드 참조 누수도 방지.
 *
 *   BUG-2: _showResultUI()의 updateSessionBest 호출 시 필드명 불일치 수정.
 *          Before: killCount / elapsedTime / playerLevel (모두 undefined → best 갱신 불가)
 *          After:  kills / survivalTime / level (createSessionState.js 계약과 일치)
 *
 *   BUG-3: PlayContext.create()에 session 미전달 수정.
 *          session이 null이면 PlayContext.buildPipeline()의 services.session = null이 되어
 *          DeathSystem.earnCurrency()가 항상 스킵됨 → 재화 획득 완전 무효.
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

    // FIX(BUG-3): session을 PlayContext.create()에 전달
    // Before: session 미전달 → ctx.session = null → services.session = null
    //         → DeathSystem의 earnCurrency()가 if (services?.session) 가드에 걸려 항상 스킵
    // After:  this.game.session을 전달 → currency 획득 정상 동작
    this._ctx = PlayContext.create({
      canvas:            this.game.canvas,
      soundEnabled:      true,
      profilingEnabled:  true,
      session:           this.game.session,  // ← FIX(BUG-3)
    });

    const { pipeline, pipelineCtx } = this._ctx.buildPipeline(
      this.world,
      this.game.input,
      { waveData, upgradeData, bossData }
    );
    this._pipeline    = pipeline;
    this._pipelineCtx = pipelineCtx;

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

    world.deltaTime    = dt;
    world.elapsedTime += dt;

    world.camera.width  = GameConfig.canvasWidth;
    world.camera.height = GameConfig.canvasHeight;

    this._pipeline.run(this._pipelineCtx);

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

    // FIX(BUG-1): destroy() → dispose()
    // Before: this._ctx?.destroy()
    //         PlayContext에 destroy()는 존재하지 않음 → 옵셔널 체이닝이 조용히 no-op
    //         → soundSystem.stopBgm()이 호출되지 않아 BGM 무한 재생 + pipeline 참조 누수
    // After:  this._ctx?.dispose()
    //         PlayContext.dispose()가 soundSystem.stopBgm() + pipeline/spawnSystem 정리를 수행
    this._ctx?.dispose();  // ← FIX(BUG-1)

    this._uiState     = null;
    this._ctx         = null;
    this._pipeline    = null;
    this._pipelineCtx = null;
    this.world        = null;  // ← 추가: world 참조도 명시적으로 해제
  }

  _showLevelUpUI() {
    this._ctx?.soundSystem?.play('levelup');

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

    this.levelUpView.show(choices, async (selectedUpgrade) => {
      UpgradeSystem.applyUpgrade(this.world.player, selectedUpgrade);
      const { SynergySystem } = await import('../systems/progression/SynergySystem.js');
      SynergySystem.applyAll({ player: this.world.player, upgradeData });
      this.world.playMode = 'playing';
    });
  }

  _showResultUI() {
    this.hudView.hide();

    // FIX(BUG-2): updateSessionBest 필드명 불일치 수정
    //
    // Before (버그):
    //   updateSessionBest(this.game.session, {
    //     killCount:   this.world.killCount,      // undefined → best.kills 갱신 안 됨
    //     elapsedTime: this.world.elapsedTime,    // undefined → best.survivalTime 갱신 안 됨
    //     playerLevel: this.world.player.level,   // undefined → best.level 갱신 안 됨
    //   });
    //   결과: undefined > session.best.* 는 항상 false → 최고 기록 영구 0
    //
    // After (수정):
    //   createSessionState.js의 updateSessionBest(session, { kills, survivalTime, level }) 계약과 일치
    updateSessionBest(this.game.session, {
      kills:        this.world.killCount,        // ← FIX(BUG-2)
      survivalTime: this.world.elapsedTime,      // ← FIX(BUG-2)
      level:        this.world.player.level,     // ← FIX(BUG-2)
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
