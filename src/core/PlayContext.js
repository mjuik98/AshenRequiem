/**
 * src/core/PlayContext.js — PlayScene 서비스 컨테이너
 *
 * ── 개선 이력 ──────────────────────────────────────────────────────
 * Before:
 *   ctx.soundSystem = soundEnabled ? new SoundSystem() : null;
 *   → 각 System에서 if (services.soundSystem) 체크 필요.
 *   → 체크 누락 시 런타임 TypeError 발생.
 *   NullSoundSystem 클래스가 정의되어 있었으나 PlayContext에서 미사용.
 *
 * After:
 *   ctx.soundSystem = soundEnabled ? new SoundSystem() : new NullSoundSystem();
 *   → 모든 System에서 null 체크 없이 services.soundSystem.play(...) 직접 호출 가능.
 *   → NullSoundSystem의 no-op 메서드가 안전하게 처리.
 * ──────────────────────────────────────────────────────────────────
 */

import { ObjectPool }        from '../managers/ObjectPool.js';
import { Pipeline }          from './Pipeline.js';
import { SoundSystem }       from '../systems/sound/SoundSystem.js';
import { NullSoundSystem }   from '../systems/sound/NullSoundSystem.js';   // ← 추가
import { PipelineProfiler }  from '../systems/debug/PipelineProfiler.js';

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
import { AssetManager }         from '../managers/AssetManager.js';

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
   * @param {object|null}      [opts.session]
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
    ctx.session = session;

    // ── pool 초기화 ──────────────────────────────────────────────
    ctx.projectilePool = new ObjectPool(createProjectile, resetProjectile, sizes.projectile);
    ctx.effectPool     = new ObjectPool(createEffect,     resetEffect,     sizes.effect);
    ctx.enemyPool      = new ObjectPool(createEnemy,      resetEnemy,      sizes.enemy);
    ctx.pickupPool     = new ObjectPool(createPickup,     resetPickup,     sizes.pickup);

    // ── 서비스 초기화 ────────────────────────────────────────────
    // FIX(⑦): null 대신 NullSoundSystem → 각 System의 null 체크 불필요
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
   * @returns {Pipeline}
   */
  buildPipeline(world, input) {
    const services = {
      projectilePool: this.projectilePool,
      effectPool:     this.effectPool,
      enemyPool:      this.enemyPool,
      pickupPool:     this.pickupPool,
      soundSystem:    this.soundSystem,  // 항상 non-null (NullSoundSystem 또는 SoundSystem)
      canvas:         this.canvas,
    };

    const pipeline = new Pipeline({ world, input, services });
    if (this.profiler) pipeline.setProfiler(this.profiler);

    pipeline.register(this.spawnSystem,      10);
    pipeline.register(PlayerMovementSystem,  20);
    pipeline.register(EnemyMovementSystem,   30);
    pipeline.register(EliteBehaviorSystem,   35);
    pipeline.register(WeaponSystem,          40);
    pipeline.register(ProjectileSystem,      50);
    pipeline.register(CollisionSystem,       60);
    pipeline.register(StatusEffectSystem,    65);
    pipeline.register(DamageSystem,          70);
    pipeline.register(BossPhaseSystem,       75);
    pipeline.register(DeathSystem,           80);
    pipeline.register(ExperienceSystem,      90);
    pipeline.register(LevelSystem,          100);
    pipeline.register(EventRegistry.asSystem(), 105);
    pipeline.register(FlushSystem.create(services), 110);
    pipeline.register(CameraSystem,         120);

    this._pipeline = pipeline;
    return pipeline;
  }

  /** 특정 시스템의 활성 여부를 런타임에 제어한다. */
  setSystemEnabled(system, enabled) {
    this._pipeline?.setEnabled(system, enabled);
  }

  /** 풀·서비스 자원을 해제한다. PlayScene.exit() 에서 호출. */
  dispose() {
    this.soundSystem?.stopBgm?.();
    this._pipeline   = null;
    this.spawnSystem = null;
  }
}
