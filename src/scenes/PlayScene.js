import { resetProjectile, resetEffect, resetEnemy } from '../managers/poolResets.js';
import { createWorld, clearFrameEvents }             from '../state/createWorld.js';
import { createUiState }    from '../state/createUiState.js';
import { createPlayer }     from '../entities/createPlayer.js';
import { createProjectile } from '../entities/createProjectile.js';
import { createEffect }     from '../entities/createEffect.js';
import { createEnemy }      from '../entities/createEnemy.js';
import { waveData }         from '../data/waveData.js';
import { bossData }         from '../data/bossData.js';
import { upgradeData }      from '../data/upgradeData.js';
import { EFFECT_DEFAULTS }  from '../data/constants.js';

import { PlayerMovementSystem } from '../systems/movement/PlayerMovementSystem.js';
import { EnemyMovementSystem }  from '../systems/movement/EnemyMovementSystem.js';
import { WeaponSystem }         from '../systems/combat/WeaponSystem.js';
import { ProjectileSystem }     from '../systems/combat/ProjectileSystem.js';
import { CollisionSystem }      from '../systems/combat/CollisionSystem.js';
import { DamageSystem }         from '../systems/combat/DamageSystem.js';
import { StatusEffectSystem }   from '../systems/combat/StatusEffectSystem.js';
import { DeathSystem }          from '../systems/combat/DeathSystem.js';
// CHANGE(P1-③): EliteBehaviorSystem을 combat 폴더에서 import
import { EliteBehaviorSystem }  from '../systems/combat/EliteBehaviorSystem.js';
import { ExperienceSystem }     from '../systems/progression/ExperienceSystem.js';
import { LevelSystem }          from '../systems/progression/LevelSystem.js';
import { UpgradeSystem }        from '../systems/progression/UpgradeSystem.js';
// CHANGE(P1-①): SpawnSystem을 클래스로 import
import { SpawnSystem }          from '../systems/spawn/SpawnSystem.js';
import { FlushSystem }          from '../systems/spawn/FlushSystem.js';
import { CameraSystem }         from '../systems/camera/CameraSystem.js';
import { RenderSystem }         from '../systems/render/RenderSystem.js';
import { SoundSystem }          from '../systems/sound/SoundSystem.js';

import { ObjectPool }   from '../managers/ObjectPool.js';
import { mountUI }      from '../ui/dom/mountUI.js';
import { HudView }      from '../ui/hud/HudView.js';
import { LevelUpView }  from '../ui/levelup/LevelUpView.js';
import { ResultView }   from '../ui/result/ResultView.js';
import { DebugView }    from '../ui/debug/DebugView.js';
import { BossHudView }  from '../ui/boss/BossHudView.js';

/**
 * PlayScene — 전투 씬
 *
 * CHANGE(P1-①): SpawnSystem 싱글톤 → 클래스 인스턴스
 * CHANGE(P1-②): 프레임 파이프라인을 _runGamePipeline()으로 분리
 * CHANGE(P1-③): EliteBehaviorSystem import 경로 변경
 * CHANGE(P2-④): enemy ObjectPool 추가
 * CHANGE(P2-⑤): camera를 world.camera로 이관
 */
export class PlayScene {
  constructor(game) {
    this.game            = game;
    this.world           = null;
    this.uiState         = null;
    this.hudView         = null;
    this.levelUpView     = null;
    this.resultView      = null;
    this.debugView       = null;
    this.bossHudView     = null;
    this._projectilePool = null;
    this._effectPool     = null;
    this._enemyPool      = null;
    this._spawnSystem    = null;
    this._soundSystem    = null;
    this._dpr            = 1;
    this._levelUpShown   = false;
    this._deadShown      = false;
  }

  enter() {
    this._spawnSystem = new SpawnSystem();
    this.world        = createWorld();
    this.uiState      = createUiState();
    this.world.player = createPlayer(0, 0);

    this._projectilePool = new ObjectPool(
      () => createProjectile({ x: 0, y: 0 }),
      resetProjectile,
      80,
    );
    this._effectPool = new ObjectPool(
      () => createEffect({ x: 0, y: 0 }),
      resetEffect,
      60,
    );
    this._enemyPool = new ObjectPool(
      () => createEnemy('zombie', 0, 0),
      resetEnemy,
      40,
    );

    this._soundSystem = new SoundSystem();
    this._soundSystem.init();

    this._levelUpShown = false;
    this._deadShown    = false;

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
    if (!this.world) return;
    const world = this.world;
    const input = this.game.input;

    this.debugView.handleInput(input);
    this.debugView.update(
      world,
      {
        projectilePool: this._projectilePool,
        effectPool:     this._effectPool,
        enemyPool:      this._enemyPool,
      },
      dt,
      waveData,
      this._spawnSystem.getDebugInfo(world.elapsedTime),
    );

    if (world.playMode === 'dead') {
      if (!this._deadShown) {
        this._deadShown = true;
        this._showResultUI();
      }
      return;
    }
    if (world.playMode === 'levelup') {
      if (!this._levelUpShown) {
        this._levelUpShown = true;
        this._showLevelUpUI();
      }
      return;
    }

    this._runGamePipeline(dt, world, input);
  }

  _runGamePipeline(dt, world, input) {
    clearFrameEvents(world);
    world.deltaTime    = dt;
    world.elapsedTime += dt;

    this._spawnSystem.update({
      elapsedTime: world.elapsedTime,
      waveData,
      bossData,
      player:     world.player,
      spawnQueue: world.spawnQueue,
      deltaTime:  dt,
    });

    PlayerMovementSystem.update({ input, player: world.player, deltaTime: dt });
    EnemyMovementSystem.update({ player: world.player, enemies: world.enemies, deltaTime: dt });

    EliteBehaviorSystem.update({
      enemies:    world.enemies,
      player:     world.player,
      deltaTime:  dt,
      spawnQueue: world.spawnQueue,
    });

    WeaponSystem.update({
      player:     world.player,
      enemies:    world.enemies,
      deltaTime:  dt,
      spawnQueue: world.spawnQueue,
    });

    ProjectileSystem.update({
      projectiles: world.projectiles,
      player:      world.player,
      deltaTime:   dt,
    });

    CollisionSystem.update({
      player:      world.player,
      enemies:     world.enemies,
      projectiles: world.projectiles,
      pickups:     world.pickups,
      events:      world.events,
      camera:      world.camera,
    });

    StatusEffectSystem.applyFromHits({ hits: world.events.hits });
    StatusEffectSystem.tick({
      enemies:   world.enemies,
      player:    world.player,
      deltaTime: dt,
      events:    world.events,
    });

    DamageSystem.update({ events: world.events, player: world.player, spawnQueue: world.spawnQueue });
    DeathSystem.update({ events: world.events, worldState: world, spawnQueue: world.spawnQueue });
    this._soundSystem.processEvents(world.events);

    ExperienceSystem.update({
      events:    world.events,
      player:    world.player,
      pickups:   world.pickups,
      deltaTime: dt,
    });

    LevelSystem.update({ player: world.player, worldState: world });

    FlushSystem.update({
      world,
      pools: {
        projectile: this._projectilePool,
        effect:     this._effectPool,
        enemy:      this._enemyPool,
      },
    });

    FlushSystem.tickEffects({ effects: world.effects, deltaTime: dt });
    CameraSystem.update({ player: world.player, camera: world.camera });
    
    this.hudView.update(world.player, world);
    this.bossHudView.update(world.enemies);
  }

  render() {
    if (!this.world) return;
    const world = this.world;

    RenderSystem.update({
      world,
      camera:   world.camera,
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
    this._soundSystem?.destroy();

    this.world           = null;
    this.uiState         = null;
    this._projectilePool = null;
    this._effectPool     = null;
    this._enemyPool      = null;
    this._spawnSystem    = null;
    this._soundSystem    = null;
  }

  _showLevelUpUI() {
    this._soundSystem?.play('levelup');
    this.world.effects.push(this._effectPool.acquire({
      x:          this.world.player.x,
      y:          this.world.player.y,
      effectType: 'levelFlash',
      color:      '#ffd54f',
      radius:     1,
      duration:   EFFECT_DEFAULTS.levelFlashDuration,
    }));

    const choices = UpgradeSystem.generateChoices(this.world.player);
    if (choices.length === 0) {
      this.world.playMode  = 'playing';
      this._levelUpShown   = false;
      return;
    }

    this.levelUpView.show(choices, (selectedUpgrade) => {
      UpgradeSystem.applyUpgrade(this.world.player, selectedUpgrade);
      this.world.playMode = 'playing';
      this._levelUpShown  = false;
    });
  }

  _showResultUI() {
    this.hudView.hide();
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
