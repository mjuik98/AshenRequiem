/**
 * src/core/PlayContext.js — PlayScene 서비스 컨테이너
 */

import { ObjectPool }        from '../managers/ObjectPool.js';
import { PipelineBuilder }   from './PipelineBuilder.js';
import { SoundSystem }       from '../systems/sound/SoundSystem.js';
import { NullSoundSystem }   from '../systems/sound/NullSoundSystem.js';
import { PipelineProfiler }  from '../systems/debug/PipelineProfiler.js';
import { AssetManager }      from '../managers/AssetManager.js';
import { createSpawnSystem } from '../systems/spawn/SpawnSystem.js';

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

    ctx.projectilePool = new ObjectPool(createProjectile, resetProjectile, sizes.projectile);
    ctx.effectPool     = new ObjectPool(createEffect,     resetEffect,     sizes.effect);
    ctx.enemyPool      = new ObjectPool(createEnemy,      resetEnemy,      sizes.enemy);
    ctx.pickupPool     = new ObjectPool(createPickup,     resetPickup,     sizes.pickup);

    ctx.soundSystem = soundEnabled
      ? (() => { const s = new SoundSystem(); s.init(); return s; })()
      : new NullSoundSystem();

    ctx.profiler    = profilingEnabled ? new PipelineProfiler() : null;
    ctx.canvas      = canvas;
    ctx.renderer    = renderer;
    ctx.spawnSystem = createSpawnSystem();

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
    this.renderer       = null;
    this.spawnSystem    = null;
    this._builder       = null;
    this.assets         = null;
    this.session        = null;
  }

  buildPipeline(world, input, data = {}) {
    const services = this._buildServices();
    this._builder = new PipelineBuilder(services, this.spawnSystem, this.profiler);
    const { pipeline, ctx } = this._builder.build(world, input, data);
    return { pipeline, pipelineCtx: ctx };
  }

  setSystemEnabled(system, enabled) {
    this._builder?.setSystemEnabled(system, enabled);
  }

  dispose() {
    this.soundSystem?.stopBgm?.();
    this._builder   = null;
    this.spawnSystem = null;
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
