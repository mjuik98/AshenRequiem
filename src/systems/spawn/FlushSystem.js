import { createEnemy }                    from '../../entities/createEnemy.js';
import { createPickup }                   from '../../entities/createPickup.js';
import { compactWithPool, compactInPlace } from '../../utils/compact.js';

/**
 * FlushSystem — spawnQueue 처리 + pendingDestroy 정리 + 이펙트 수명 틱
 */
export const FlushSystem = {
  update({ world, pools }) {
    const { projectile: projectilePool, effect: effectPool } = pools;

    // spawnQueue 처리
    for (let i = 0; i < world.spawnQueue.length; i++) {
      const req = world.spawnQueue[i];
      switch (req.type) {
        case 'enemy': {
          const enemy = createEnemy(req.config.enemyId, req.config.x, req.config.y);
          if (enemy) world.enemies.push(enemy);
          break;
        }
        case 'projectile':
          world.projectiles.push(projectilePool.acquire(req.config));
          break;
        case 'pickup':
          world.pickups.push(createPickup(req.config.x, req.config.y, req.config.xpValue));
          break;
        case 'effect':
          world.effects.push(effectPool.acquire(req.config));
          break;
        default:
          console.warn(`[FlushSystem] 알 수 없는 spawnQueue 타입: ${req.type}`);
      }
    }
    world.spawnQueue.length = 0;

    // pendingDestroy 정리
    compactWithPool(world.projectiles, projectilePool);
    compactInPlace(world.enemies);
    compactInPlace(world.pickups);
    compactWithPool(world.effects, effectPool);
  },

  /** tickEffects — 이펙트 수명 갱신 */
  tickEffects({ effects, deltaTime }) {
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      e.lifetime += deltaTime;
      if (e.lifetime >= e.maxLifetime) {
        e.isAlive        = false;
        e.pendingDestroy = true;
      }
    }
  },
};
