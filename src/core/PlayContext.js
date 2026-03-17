/**
 * PlayContext — PlayScene 서비스 컨테이너
 *
 * WHY (P0-1):
 *   PlayScene이 _projectilePool, _effectPool, _enemyPool, _pickupPool,
 *   _soundSystem, _pipeline, _profiler 등을 직접 소유하면
 *   enter()가 100줄을 넘기고, 씬이 "조립자"가 아닌 "관리자"로 변질된다.
 *
 *   이 클래스에 pool·service 참조를 모아두면:
 *     - PlayScene.enter()는 "무엇을 어떤 순서로" 실행하는지만 선언한다.
 *     - pool 초기화 책임이 PlayContext.create() 내부로 이동한다.
 *     - Pipeline context로 단일 객체를 주입할 수 있다.
 *
 * 사용법:
 *   // PlayScene.enter()
 *   this._ctx = PlayContext.create({
 *     canvas,
 *     soundEnabled: true,
 *   });
 *   this._pipeline = this._ctx.buildPipeline(this.world, this.game.input);
 *
 * 계약:
 *   - 입력: 초기화 옵션 (canvas, pool 크기, 기능 플래그)
 *   - 읽기: ObjectPool 팩토리, SoundSystem 설정
 *   - 쓰기: 내부 pool·service만
 *   - 출력: Pipeline context 객체
 */

import { ObjectPool }    from '../managers/ObjectPool.js';
import { Pipeline }      from './Pipeline.js';
import { SoundSystem }   from '../systems/sound/SoundSystem.js';
import { PipelineProfiler } from '../systems/debug/PipelineProfiler.js';

import { createProjectile, resetProjectile } from '../entities/createProjectile.js';
import { createEffect,     resetEffect }     from '../entities/createEffect.js';
import { createEnemy,      resetEnemy }      from '../entities/createEnemy.js';
import { createPickup,     resetPickup }     from '../entities/createPickup.js';

// ── 시스템 imports ──────────────────────────────────────────────
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

const POOL_SIZES = {
  projectile: 200,
  effect:     100,
  enemy:      150,
  pickup:     80,
};

export class PlayContext {
  /**
   * @param {object} opts
   * @param {HTMLCanvasElement} opts.canvas
   * @param {boolean} [opts.soundEnabled=true]
   * @param {boolean} [opts.profilingEnabled=false]
   * @param {object}  [opts.poolSizes]  POOL_SIZES를 override할 때 사용
   */
  static create({
    canvas,
    soundEnabled     = true,
    profilingEnabled = false,
    poolSizes        = {},
  } = {}) {
    const ctx = new PlayContext();
    const sizes = { ...POOL_SIZES, ...poolSizes };

    // ── pool 초기화 ──────────────────────────────────────────
    ctx.projectilePool = new ObjectPool(createProjectile, resetProjectile, sizes.projectile);
    ctx.effectPool     = new ObjectPool(createEffect,     resetEffect,     sizes.effect);
    ctx.enemyPool      = new ObjectPool(createEnemy,      resetEnemy,      sizes.enemy);
    ctx.pickupPool     = new ObjectPool(createPickup,     resetPickup,     sizes.pickup);

    // ── 서비스 초기화 ────────────────────────────────────────
    ctx.soundSystem = soundEnabled ? new SoundSystem() : null;
    ctx.soundSystem?.init();
    ctx.profiler    = profilingEnabled ? new PipelineProfiler() : null;
    ctx.canvas      = canvas;

    // ── SpawnSystem (상태 있는 인스턴스) ─────────────────────
    ctx.spawnSystem = new SpawnSystem();

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
  }

  /**
   * Pipeline을 생성하고 모든 시스템을 등록한다.
   *
   * PlayScene.enter()에서 한 번 호출한다.
   * world와 input은 참조(reference)로 전달하므로 매 프레임 갱신된다.
   *
   * @param {object} world  createWorld() 결과
   * @param {object} input  Input 인스턴스
   * @param {object} data   { waveData, upgradeData, bossData, ... }
   * @returns {Pipeline}
   */
  buildPipeline(world, input, data = {}) {
    const services = {
      projectilePool: this.projectilePool,
      effectPool:     this.effectPool,
      enemyPool:      this.enemyPool,
      pickupPool:     this.pickupPool,
      soundSystem:    this.soundSystem,
      canvas:         this.canvas,
    };

    // Pipeline context — 매 프레임 이 객체가 각 시스템에 전달된다
    // world / input은 참조이므로 여기서 freeze하지 않는다
    const pipelineCtx = { world, input, data, services };

    const pipeline = new Pipeline();

    pipeline
      .register(this.spawnSystem,        { priority: 10 })
      .register(PlayerMovementSystem,    { priority: 20 })
      .register(EnemyMovementSystem,     { priority: 30 })
      .register(EliteBehaviorSystem,     { priority: 35 })
      .register(WeaponSystem,            { priority: 40 })
      .register(ProjectileSystem,        { priority: 50 })
      .register(CollisionSystem,         { priority: 60 })
      .register(StatusEffectSystem,      { priority: 65 })
      .register(DamageSystem,            { priority: 70 })
      .register(BossPhaseSystem,         { priority: 75 })
      .register(DeathSystem,             { priority: 80 })
      .register(ExperienceSystem,        { priority: 90 })
      .register(LevelSystem,             { priority: 100 })
      .register(EventRegistry.asSystem(), { priority: 105 })
      .register(FlushSystem,             { priority: 110 })
      .register(CameraSystem,            { priority: 120 });

    if (this.profiler) {
      this.profiler.wrap(pipeline);
    }

    this._pipeline    = pipeline;
    this._pipelineCtx = pipelineCtx;

    return { pipeline, pipelineCtx };
  }

  /**
   * Pipeline에서 특정 시스템을 켜거나 끈다.
   * 레벨업 일시정지 시 SpawnSystem을 끌 때 사용.
   *
   * @param {object}  system
   * @param {boolean} enabled
   */
  setSystemEnabled(system, enabled) {
    this._pipeline?.setEnabled(system, enabled);
  }

  /**
   * 씬 이탈 시 pool·service 메모리 해제
   */
  destroy() {
    this.projectilePool?.clear?.();
    this.effectPool?.clear?.();
    this.enemyPool?.clear?.();
    this.pickupPool?.clear?.();
    this.soundSystem?.destroy?.();
    this._pipeline?.clear?.();
  }
}
