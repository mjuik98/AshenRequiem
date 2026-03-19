/**
 * src/core/PlayContext.js — PlayScene 서비스 컨테이너
 *
 * BUGFIX:
 *   BUG-3: buildPipeline()의 services 객체에 session 누락 수정
 *
 *     Before (버그):
 *       const services = {
 *         projectilePool, effectPool, enemyPool, pickupPool,
 *         soundSystem, canvas,
 *         // session 없음 → DeathSystem.earnCurrency() 항상 스킵
 *       };
 *
 *     After (수정):
 *       session: this.session 추가
 *       → DeathSystem이 earnCurrency(services.session, reward)를 정상 호출
 *       → PlayScene.enter()에서 PlayContext.create({ session: this.game.session })
 *          으로 session을 함께 전달해야 함 (PlayScene.js 참고)
 *
 * 기존 개선 이력:
 *   FIX(⑦): null 대신 NullSoundSystem → 각 System의 null 체크 불필요
 */

import { ObjectPool }        from '../managers/ObjectPool.js';
import { Pipeline }          from './Pipeline.js';
import { SoundSystem }       from '../systems/sound/SoundSystem.js';
import { NullSoundSystem }   from '../systems/sound/NullSoundSystem.js';
import { PipelineProfiler }  from '../systems/debug/PipelineProfiler.js';
import { AssetManager }      from '../managers/AssetManager.js';

import { createProjectile, resetProjectile } from '../entities/createProjectile.js';
import { createEffect,     resetEffect }     from '../entities/createEffect.js';
import { createEnemy,      resetEnemy }      from '../entities/createEnemy.js';
import { createPickup,     resetPickup }     from '../entities/createPickup.js';

import { PlayerMovementSystem } from '../systems/movement/PlayerMovementSystem.js';
import { EnemyMovementSystem }  from '../systems/movement/EnemyMovementSystem.js';
import { EliteBehaviorSystem }  from '../systems/combat/EliteBehaviorSystem.js';
import { WeaponSystem }         from '../systems/combat/WeaponSystem.js';
import { ProjectileSystem }     from '../systems/combat/ProjectileSystem.js';
import { CollisionSystem }      from '../systems/combat/CollisionSystem.js';
import { StatusEffectSystem }   from '../systems/combat/StatusEffectSystem.js';
import { DamageSystem }         from '../systems/combat/DamageSystem.js';
import { DeathSystem }          from '../systems/combat/DeathSystem.js';
import { ExperienceSystem }     from '../systems/progression/ExperienceSystem.js';
import { LevelSystem }          from '../systems/progression/LevelSystem.js';
import { SpawnSystem }          from '../systems/spawn/SpawnSystem.js';
import { FlushSystem }          from '../systems/spawn/FlushSystem.js';
import { BossPhaseSystem }      from '../systems/spawn/BossPhaseSystem.js';
import { CameraSystem }         from '../systems/camera/CameraSystem.js';
import { EventRegistry }        from '../systems/event/EventRegistry.js';
import { registerBossPhaseHandler } from '../systems/event/bossPhaseHandler.js';

export function _registerGameAssets(assets) {
  // assets.register('player_sprite', 'assets/images/player.png');
  // assets.register('sfx_hit',       'assets/sounds/hit.ogg');
}

const POOL_SIZES = {
  projectile: 200,
  effect:     100,
  enemy:      150,
  pickup:     80,
};

export class PlayContext {
  /**
   * @param {object}           opts
   * @param {HTMLCanvasElement} opts.canvas
   * @param {boolean}          [opts.soundEnabled=true]
   * @param {boolean}          [opts.profilingEnabled=false]
   * @param {object}           [opts.poolSizes]
   * @param {object|null}      [opts.session]   ← BUG-3: 반드시 전달해야 함
   */
  static create({
    canvas,
    soundEnabled     = true,
    profilingEnabled = false,
    poolSizes        = {},
    session          = null,
  } = {}) {
    const ctx   = new PlayContext();
    const sizes = { ...POOL_SIZES, ...poolSizes };

    ctx.assets  = new AssetManager();
    _registerGameAssets(ctx.assets);
    ctx.session = session;  // PlayScene.enter()에서 this.game.session을 전달받음

    // ── pool 초기화 ──────────────────────────────────────────────
    ctx.projectilePool = new ObjectPool(createProjectile, resetProjectile, sizes.projectile);
    ctx.effectPool     = new ObjectPool(createEffect,     resetEffect,     sizes.effect);
    ctx.enemyPool      = new ObjectPool(createEnemy,      resetEnemy,      sizes.enemy);
    ctx.pickupPool     = new ObjectPool(createPickup,     resetPickup,     sizes.pickup);

    // ── 서비스 초기화 ────────────────────────────────────────────
    if (soundEnabled) {
      ctx.soundSystem = new SoundSystem();
      ctx.soundSystem.init();
    } else {
      ctx.soundSystem = new NullSoundSystem();
    }

    ctx.profiler     = profilingEnabled ? new PipelineProfiler() : null;
    ctx.canvas       = canvas;
    ctx.spawnSystem  = new SpawnSystem();

    return ctx;
  }

  constructor() {
    this.projectilePool = null;
    this.effectPool     = null;
    this.enemyPool      = null;
    this.pickupPool     = null;
    this.soundSystem    = null;
    this.profiler       = null;
    this.canvas         = null;
    this.spawnSystem    = null;
    this._pipeline      = null;
    this.assets         = null;
    this.session        = null;
  }

  /**
   * Pipeline을 생성하고 모든 시스템을 등록한다.
   * PlayScene.enter()에서 한 번 호출한다.
   *
   * @param {object} world
   * @param {object} input
   * @param {object} [data]
   * @returns {{ pipeline: Pipeline, pipelineCtx: object }}
   */
  buildPipeline(world, input, data = {}) {
    // FIX(BUG-3): session을 services에 포함
    //
    // Before (버그):
    //   services = { projectilePool, effectPool, enemyPool, pickupPool, soundSystem, canvas }
    //   session 누락 → DeathSystem.update()의 if (services?.session) 가드가 항상 false
    //   → earnCurrency() 미호출 → 적 처치 시 재화 획득 불가 (침묵 버그)
    //
    // After (수정):
    //   session: this.session 추가
    //   this.session은 PlayContext.create({ session }) 에서 주입받음
    const services = {
      projectilePool: this.projectilePool,
      effectPool:     this.effectPool,
      enemyPool:      this.enemyPool,
      pickupPool:     this.pickupPool,
      soundSystem:    this.soundSystem,
      canvas:         this.canvas,
      session:        this.session,  // ← FIX(BUG-3)
    };

    registerBossPhaseHandler(services);

    const pipeline = new Pipeline();
    const pipelineCtx = { world, input, services, data };

    if (this.profiler) pipeline.setProfiler(this.profiler);

    pipeline.register(this.spawnSystem,       { priority: 10 });
    pipeline.register(PlayerMovementSystem,   { priority: 20 });
    pipeline.register(EnemyMovementSystem,    { priority: 30 });
    pipeline.register(EliteBehaviorSystem,    { priority: 35 });
    pipeline.register(WeaponSystem,           { priority: 40 });
    pipeline.register(ProjectileSystem,       { priority: 50 });
    pipeline.register(CollisionSystem,        { priority: 60 });
    pipeline.register(StatusEffectSystem,     { priority: 65 });
    pipeline.register(DamageSystem,           { priority: 70 });
    pipeline.register(BossPhaseSystem,        { priority: 75 });
    pipeline.register(DeathSystem,            { priority: 80 });
    pipeline.register(ExperienceSystem,       { priority: 90 });
    pipeline.register(LevelSystem,            { priority: 100 });
    pipeline.register(EventRegistry.asSystem, { priority: 105 });
    pipeline.register(FlushSystem,            { priority: 110 });
    pipeline.register(CameraSystem,           { priority: 120 });

    this._pipeline = pipeline;
    return { pipeline, pipelineCtx };
  }

  /** 특정 시스템의 활성 여부를 런타임에 제어한다. */
  setSystemEnabled(system, enabled) {
    this._pipeline?.setEnabled(system, enabled);
  }

  /**
   * 풀·서비스 자원을 해제한다. PlayScene.exit() 에서 호출.
   *
   * NOTE(BUG-1): PlayScene.exit()에서 반드시 dispose()를 호출해야 한다.
   *   destroy()는 이 클래스에 존재하지 않으므로 옵셔널 체이닝으로 호출하면 no-op.
   */
  dispose() {
    this.soundSystem?.stopBgm?.();
    this._pipeline   = null;
    this.spawnSystem = null;
  }
}
