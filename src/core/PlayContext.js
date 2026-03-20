/**
 * src/core/PlayContext.js — PlayScene 서비스 컨테이너
 *
 * REFACTOR: deprecated SpawnSystem class → createSpawnSystem() factory
 *
 *   Before: import { createSpawnSystem } from '../systems/spawn/SpawnSystem.js'
 *           // 내부적으로 createSpawnSystem을 썼지만 class wrapper를 통해 노출
 *   After:  createSpawnSystem() 직접 사용, class 의존성 제거
 *
 *   PipelineBuilder는 팩토리 기반 시스템(CollisionSystem, EnemyMovementSystem 등)을
 *   내부에서 생성하므로 PlayContext가 개별 시스템을 직접 보유할 필요가 없어졌다.
 *   PlayContext 책임: Pool 생성, SoundSystem 초기화, PipelineBuilder 위임
 */

import { ObjectPool }        from '../managers/ObjectPool.js';
import { PipelineBuilder }   from './PipelineBuilder.js';
import { SoundSystem }       from '../systems/sound/SoundSystem.js';
import { NullSoundSystem }   from '../systems/sound/NullSoundSystem.js';
import { PipelineProfiler }  from '../systems/debug/PipelineProfiler.js';
import { AssetManager }      from '../managers/AssetManager.js';
import { EventRegistry }     from '../systems/event/EventRegistry.js';

import { createProjectile, resetProjectile } from '../entities/createProjectile.js';
import { createEffect,     resetEffect }     from '../entities/createEffect.js';
import { createEnemy,      resetEnemy }      from '../entities/createEnemy.js';
import { createPickup,     resetPickup }     from '../entities/createPickup.js';

const POOL_SIZES = {
  projectile: 200,
  effect:     100,
  enemy:      150,
  pickup:     80,
};

export class PlayContext {
  static create({
    canvas,
    renderer         = null,
    soundEnabled     = true,
    profilingEnabled = false,
    poolSizes        = {},
    session          = null,
  } = {}) {
    const ctx   = new PlayContext();
    const sizes = { ...POOL_SIZES, ...poolSizes };

    ctx.assets  = new AssetManager();
    ctx.session = session;

    // ── Object Pool ──────────────────────────────────────────────────
    ctx.projectilePool = new ObjectPool(createProjectile, resetProjectile, sizes.projectile);
    ctx.effectPool     = new ObjectPool(createEffect,     resetEffect,     sizes.effect);
    ctx.enemyPool      = new ObjectPool(createEnemy,      resetEnemy,      sizes.enemy);
    ctx.pickupPool     = new ObjectPool(createPickup,     resetPickup,     sizes.pickup);

    // ── Sound ────────────────────────────────────────────────────────
    ctx.soundSystem = soundEnabled
      ? (() => { const s = new SoundSystem(); s.init(); return s; })()
      : new NullSoundSystem();

    // ── EventRegistry (인스턴스 — R-13/R-series) ─────────────────────
    // 모듈 레벨 싱글톤 대신 인스턴스를 소유하여 재시작 시 핸들러 누수 방지
    ctx.eventRegistry = new EventRegistry();

    ctx.profiler  = profilingEnabled ? new PipelineProfiler() : null;
    ctx.canvas    = canvas;
    ctx.renderer  = renderer;

    return ctx;
  }

  constructor() {
    this.projectilePool = null;
    this.effectPool     = null;
    this.enemyPool      = null;
    this.pickupPool     = null;
    this.soundSystem    = null;
    this.eventRegistry  = null;
    this.profiler       = null;
    this.canvas         = null;
    this.renderer       = null;
    this._builder       = null;
    this.assets         = null;
    this.session        = null;
  }

  /**
   * @param {object} world
   * @param {import('../input/InputManager.js').InputManager} input
   * @param {import('../data/GameDataLoader.js').GameData} data
   */
  buildPipeline(world, input, data = {}) {
    const services = this._buildServices();
    // REFACTOR: EventRegistry 인스턴스 전달
    this._builder  = new PipelineBuilder(
      services,
      this.eventRegistry,
      this.profiler,
    );
    return this._builder.build(world, input, data);
  }

  setSystemEnabled(system, enabled) {
    this._builder?.setSystemEnabled(system, enabled);
  }

  dispose() {
    this.soundSystem?.stopBgm?.();
    this.soundSystem?.destroy?.();

    // EventRegistry 핸들러 명시적 정리 (재시작 시 누수 방지 — R-13)
    this.eventRegistry?.dispose();
    this.eventRegistry = null;

    this._builder = null;
  }

  _buildServices() {
    return {
      projectilePool: this.projectilePool,
      effectPool:     this.effectPool,
      enemyPool:      this.enemyPool,
      pickupPool:     this.pickupPool,
      soundSystem:    this.soundSystem,
      canvas:         this.canvas,
      renderer:       this.renderer,
      session:        this.session,
    };
  }
}
