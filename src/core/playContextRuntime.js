import { ObjectPool } from '../managers/ObjectPool.js';
import { SoundSystem } from '../systems/sound/SoundSystem.js';
import { NullSoundSystem } from '../systems/sound/NullSoundSystem.js';
import { PipelineProfiler } from '../systems/debug/PipelineProfiler.js';
import { EventRegistry } from '../systems/event/EventRegistry.js';

import { createProjectile, resetProjectile } from '../entities/createProjectile.js';
import { createEffect, resetEffect } from '../entities/createEffect.js';
import { createEnemy, resetEnemy } from '../entities/createEnemy.js';
import { createPickup, resetPickup } from '../entities/createPickup.js';

export const DEFAULT_PLAY_CONTEXT_POOL_SIZES = {
  projectile: 200,
  effect: 100,
  enemy: 150,
  pickup: 80,
};

function createSoundRuntime(soundEnabled) {
  if (!soundEnabled) {
    return new NullSoundSystem();
  }

  const soundSystem = new SoundSystem();
  soundSystem.init();
  return soundSystem;
}

export function createPlayContextRuntimeState({
  canvas,
  renderer = null,
  soundEnabled = true,
  profilingEnabled = false,
  poolSizes = {},
  session = null,
} = {}) {
  const sizes = { ...DEFAULT_PLAY_CONTEXT_POOL_SIZES, ...poolSizes };

  return {
    projectilePool: new ObjectPool(createProjectile, resetProjectile, sizes.projectile),
    effectPool: new ObjectPool(createEffect, resetEffect, sizes.effect),
    enemyPool: new ObjectPool(createEnemy, resetEnemy, sizes.enemy),
    pickupPool: new ObjectPool(createPickup, resetPickup, sizes.pickup),
    soundSystem: createSoundRuntime(soundEnabled),
    eventRegistry: new EventRegistry(),
    profiler: profilingEnabled ? new PipelineProfiler() : null,
    canvas,
    renderer,
    session,
    bossAnnouncementView: null,
    weaponEvolutionView: null,
  };
}

export function createPlayContextServices({
  projectilePool,
  effectPool,
  enemyPool,
  pickupPool,
  soundSystem,
  canvas,
  renderer,
  bossAnnouncementView,
  weaponEvolutionView,
}) {
  return {
    projectilePool,
    effectPool,
    enemyPool,
    pickupPool,
    soundSystem,
    canvas,
    renderer,
    bossAnnouncementView,
    weaponEvolutionView,
  };
}
