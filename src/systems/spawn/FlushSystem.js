import { createEnemy }   from '../../entities/createEnemy.js';
import { createPickup }  from '../../entities/createPickup.js';
import { compactWithPool, compactInPlace } from '../../utils/compact.js';

/**
 * FlushSystem — spawnQueue 처리 + pendingDestroy 배열 정리 + 이펙트 수명 틱
 *
 * FIX(bug): template literal 이스케이프 오류 수정.
 *   이전: `\${req.type}` → 보간 안 됨 (리터럴 문자열 출력)
 *   이후: `${req.type}` → 정상 보간
 *
 * REF(refactor): tickEffects 메서드 추가.
 *   이전: PlayScene._updateEffects() 에서 이펙트 수명을 직접 갱신 (Scene에 게임 로직 누수).
 *   이후: FlushSystem.tickEffects() 로 책임 이전 → AGENTS.md "Scene은 흐름만" 원칙 준수.
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
          // FIX(bug): \${req.type} → ${req.type} (template literal 이스케이프 제거)
          console.warn(`[FlushSystem] 알 수 없는 spawnQueue 타입: ${req.type}`);
      }
    }
    world.spawnQueue.length = 0;

    // ── pendingDestroy 정리 ───────────────────────────────────
    compactWithPool(world.projectiles, projectilePool);
    compactInPlace(world.enemies);
    compactInPlace(world.pickups);
    compactWithPool(world.effects, effectPool);
  },

  /**
   * REF(refactor): 이펙트 수명 틱 — PlayScene._updateEffects() 에서 이전.
   *
   * 이펙트의 lifetime 갱신 및 만료 처리는 게임 로직이므로
   * Scene 이 아닌 System 이 담당해야 한다.
   *
   * PlayScene 호출 위치: 13단계 FlushSystem.update() 직후, 14단계로 호출.
   *
   * @param {object[]} effects  - world.effects 배열
   * @param {number}   deltaTime - 이번 프레임 경과 시간 (초)
   */
  tickEffects({ effects, deltaTime }) {
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      if (!e.isAlive) continue;
      e.lifetime += deltaTime;
      if (e.lifetime >= e.maxLifetime) {
        e.isAlive = false;
        e.pendingDestroy = true;
      }
    }
  },
};
