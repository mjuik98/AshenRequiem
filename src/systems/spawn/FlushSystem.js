import { createEnemy }   from '../../entities/createEnemy.js';
import { createPickup }  from '../../entities/createPickup.js';
import { compactWithPool, compactInPlace } from '../../utils/compact.js';

/**
 * FlushSystem — spawnQueue 처리 + pendingDestroy 배열 정리
 *
 * 이 시스템은 PlayScene 에 집중되어 있던 큐 처리와 배열 정리를 담당합니다.
 * Scene 은 게임의 흐름을 제어하고, 실제 데이터 조작 및 규칙 적용은 시스템이 수행합니다. (AGENTS.md 규칙 준수)
 */
export const FlushSystem = {
  update({ world, pools }) {
    const { projectile: projectilePool, effect: effectPool } = pools;

    // ── spawnQueue 처리 ───────────────────────────────────────
    for (let i = 0; i < world.spawnQueue.length; i++) {
      const req = world.spawnQueue[i];
      switch (req.type) {
        case 'enemy': {
          const enemy = createEnemy(req.config.enemyId, req.config.x, req.config.y);
          if (enemy) world.enemies.push(enemy);
          break;
        }
        case 'projectile': {
          world.projectiles.push(projectilePool.acquire(req.config));
          break;
        }
        case 'pickup': {
          world.pickups.push(createPickup(req.config.x, req.config.y, req.config.xpValue));
          break;
        }
        case 'effect': {
          world.effects.push(effectPool.acquire(req.config));
          break;
        }
        default:
          console.warn(`[FlushSystem] 알 수 없는 spawnQueue 타입: \${req.type}`);
      }
    }
    world.spawnQueue.length = 0;

    // ── pendingDestroy 정리 ───────────────────────────────────
    compactWithPool(world.projectiles, projectilePool);
    compactInPlace(world.enemies);
    compactInPlace(world.pickups);
    compactWithPool(world.effects, effectPool);
  },
};
