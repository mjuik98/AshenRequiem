import { generateId } from '../utils/ids.js';
import { compactWithPool, compactInPlace } from '../utils/compact.js';
import { resetProjectile, resetEffect } from '../managers/poolResets.js';
import { createWorld, clearFrameEvents } from '../state/createWorld.js';
import { createUiState } from '../state/createUiState.js';
import { createPlayer } from '../entities/createPlayer.js';
import { createEnemy } from '../entities/createEnemy.js';
import { createProjectile } from '../entities/createProjectile.js';
import { createPickup } from '../entities/createPickup.js';
import { createEffect } from '../entities/createEffect.js';
import { waveData } from '../data/waveData.js';
import { bossData } from '../data/bossData.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';

import { PlayerMovementSystem }  from '../systems/movement/PlayerMovementSystem.js';
import { EnemyMovementSystem }   from '../systems/movement/EnemyMovementSystem.js';
import { EliteBehaviorSystem }   from '../systems/movement/EliteBehaviorSystem.js';
import { WeaponSystem }          from '../systems/combat/WeaponSystem.js';
import { ProjectileSystem }      from '../systems/combat/ProjectileSystem.js';
import { CollisionSystem }       from '../systems/combat/CollisionSystem.js';
import { DamageSystem }          from '../systems/combat/DamageSystem.js';
import { StatusEffectSystem }    from '../systems/combat/StatusEffectSystem.js';
import { DeathSystem }           from '../systems/combat/DeathSystem.js';
import { ExperienceSystem }      from '../systems/progression/ExperienceSystem.js';
import { LevelSystem }           from '../systems/progression/LevelSystem.js';
import { UpgradeSystem }         from '../systems/progression/UpgradeSystem.js';
import { SpawnSystem }           from '../systems/spawn/SpawnSystem.js';
import { CameraSystem }          from '../systems/camera/CameraSystem.js';
import { RenderSystem }          from '../systems/render/RenderSystem.js';
import { SoundSystem }           from '../systems/sound/SoundSystem.js';

import { ObjectPool } from '../managers/ObjectPool.js';

import { mountUI }     from '../ui/dom/mountUI.js';
import { HudView }     from '../ui/hud/HudView.js';
import { LevelUpView } from '../ui/levelup/LevelUpView.js';
import { ResultView }  from '../ui/result/ResultView.js';
import { DebugView }   from '../ui/debug/DebugView.js';
import { BossHudView } from '../ui/boss/BossHudView.js';

/**
 * PlayScene — 전투 씬 (16단계 프레임 파이프라인)
 */
export class PlayScene {
  constructor(game) {
    this.game = game;
    this.world = null;
    this.uiState = null;
    this.camera = { x: 0, y: 0 };
    this.hudView = null;
    this.levelUpView = null;
    this.resultView = null;
    this.debugView = null;
    this.bossHudView = null;
    this._projectilePool = null;
    this._effectPool = null;
    this._soundSystem = null;
    this._dpr = window.devicePixelRatio || 1;
  }

  enter() {
    this.world = createWorld();
    this.uiState = createUiState();
    SpawnSystem.reset();

    this.world.player = createPlayer(0, 0);

    // FIX: projectilePool size 40 -> 80
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

    this._soundSystem = new SoundSystem();
    this._soundSystem.init();

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
    const world = this.world;
    const input = this.game.input;

    if (world.playMode === 'dead') return;
    if (world.playMode === 'levelup') return;

    // ─── 프레임 파이프라인 ─────────────────────────────────────

    // 1. 프레임 이벤트 초기화
    clearFrameEvents(world);

    // 2. 게임 시간 갱신
    world.deltaTime = dt;
    world.elapsedTime += dt; // elapsedTime 으로 통일

    // 3. 스폰 처리
    SpawnSystem.update({
      elapsedTime: world.elapsedTime,
      waveData, bossData,
      player: world.player,
      spawnQueue: world.spawnQueue,
      deltaTime: dt,
    });

    // 4. 플레이어 이동
    PlayerMovementSystem.update({ input, player: world.player, deltaTime: dt });

    // 5. 적 이동
    EnemyMovementSystem.update({ player: world.player, enemies: world.enemies, deltaTime: dt });

    // 5.5. 엘리트/보스 행동 패턴
    EliteBehaviorSystem.update({
      enemies: world.enemies,
      player:  world.player,
      deltaTime: dt,
      spawnQueue: world.spawnQueue,
    });

    // 6. 무기 발동
    WeaponSystem.update({
      player: world.player, enemies: world.enemies,
      deltaTime: dt, spawnQueue: world.spawnQueue,
    });

    // 7. 투사체 이동
    ProjectileSystem.update({
      projectiles: world.projectiles,
      player:      world.player,
      deltaTime:   dt,
    });

    // 8. 충돌 판정 (camera 전달로 컬링 활성화)
    CollisionSystem.update({
      player:      world.player,
      enemies:     world.enemies,
      projectiles: world.projectiles,
      pickups:     world.pickups,
      events:      world.events,
      camera:      this.camera,
    });

    // 9. 상태이상 부여
    StatusEffectSystem.applyFromHits({ hits: world.events.hits });

    // 9.5. 상태이상 틱
    StatusEffectSystem.tick({
      enemies:   world.enemies,
      player:    world.player,
      deltaTime: dt,
      events:    world.events,
    });

    // 9.7. 데미지 적용
    DamageSystem.update({ events: world.events, player: world.player, spawnQueue: world.spawnQueue });

    // 10. 사망 처리 (worldState 슬라이스 전달)
    DeathSystem.update({ events: world.events, worldState: world, spawnQueue: world.spawnQueue });

    // 10.5. 사운드 처리
    this._soundSystem.processEvents(world.events);

    // 11. 경험치 흡수
    ExperienceSystem.update({
      events:    world.events,
      player:    world.player,
      pickups:   world.pickups,
      deltaTime: dt,
    });

    // 12. 레벨업 확인 (worldState 슬라이스 전달)
    LevelSystem.update({ player: world.player, worldState: world });

    // 13. 큐 플러시
    this._flushQueues();

    // 14. 이펙트 수명 갱신
    this._updateEffects(dt);

    // 15. 카메라 갱신
    CameraSystem.update({ player: world.player, camera: this.camera });

    // ─── 후처리 ──────────────────────────────────────────────

    if (world.playMode === 'levelup') this._showLevelUpUI();
    if (world.playMode === 'dead')    this._showResultUI();

    this.hudView.update(world.player, world);
    this.bossHudView.update(world.enemies);

    // 디버그 입력 처리 위임
    this.debugView.handleInput(input);
    this.debugView.update(
      world,
      { projectilePool: this._projectilePool, effectPool: this._effectPool },
      dt, waveData,
    );
  }

  render() {
    // drawEffect 등에 전달할 dpr 포함
    RenderSystem.update({ 
      world: this.world, 
      camera: this.camera, 
      renderer: this.game.renderer,
      dpr: this._dpr
    });
  }

  exit() {
    if (this.hudView)      this.hudView.destroy();
    if (this.levelUpView)  this.levelUpView.destroy();
    if (this.resultView)   this.resultView.destroy();
    if (this.debugView)    this.debugView.destroy();
    if (this.bossHudView)  this.bossHudView.destroy();
    if (this._soundSystem) this._soundSystem.destroy();
    
    // GC leaks fix
    this.world           = null;
    this.uiState         = null;
    this._projectilePool = null;
    this._effectPool     = null;
    this._soundSystem    = null;
  }

  _flushQueues() {
    const world = this.world;
    for (let i = 0; i < world.spawnQueue.length; i++) {
      const req = world.spawnQueue[i];
      switch (req.type) {
        case 'enemy': {
          const enemy = createEnemy(req.config.enemyId, req.config.x, req.config.y);
          if (enemy) world.enemies.push(enemy);
          break;
        }
        case 'projectile': {
          world.projectiles.push(this._projectilePool.acquire(req.config));
          break;
        }
        case 'pickup': {
          world.pickups.push(createPickup(req.config.x, req.config.y, req.config.xpValue));
          break;
        }
        case 'effect': {
          world.effects.push(this._effectPool.acquire(req.config));
          break;
        }
      }
    }
    world.spawnQueue.length = 0;
    
    // utility 로 분리됨
    compactWithPool(world.projectiles, this._projectilePool);
    compactInPlace(world.enemies);
    compactInPlace(world.pickups);
    compactWithPool(world.effects, this._effectPool);
  }

  _updateEffects(dt) {
    for (let i = 0; i < this.world.effects.length; i++) {
      const e = this.world.effects[i];
      if (!e.isAlive) continue;
      e.lifetime += dt;
      if (e.lifetime >= e.maxLifetime) { e.isAlive = false; e.pendingDestroy = true; }
    }
  }

  _showLevelUpUI() {
    this._soundSystem.play('levelup');

    this.world.spawnQueue.push({
      type: 'effect',
      config: {
        x: this.world.player.x,
        y: this.world.player.y,
        effectType: 'levelFlash',
        color: '#ffd54f',
        radius: 1,
        duration: EFFECT_DEFAULTS.levelFlashDuration,
      },
    });
    this._flushQueues();

    const choices = UpgradeSystem.generateChoices(this.world.player);
    if (choices.length === 0) { this.world.playMode = 'playing'; return; }

    this.levelUpView.show(choices, (selectedUpgrade) => {
      UpgradeSystem.applyUpgrade(this.world.player, selectedUpgrade);
      this.world.playMode = 'playing';
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
      () => { this.game.sceneManager.changeScene(new PlayScene(this.game)); },
    );
  }
}
