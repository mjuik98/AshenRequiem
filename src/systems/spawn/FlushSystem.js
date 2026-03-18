import { EntityManager } from '../../managers/EntityManager.js';

/**
 * FlushSystem — spawnQueue 처리 + pendingDestroy 정리 + 이펙트 수명 틱
 */
export const FlushSystem = {
  update(ctx) {
    const { world, services } = ctx;
    const { projectilePool, effectPool, enemyPool, pickupPool } = services;

    // FIX(BUG-2): tickEffects 호출 추가 — 이펙트 수명 틱 처리
    FlushSystem.tickEffects({ effects: world.effects, deltaTime: world.deltaTime });

    // EntityManager에 처리를 위임하여 아키텍처 일관성 유지
    EntityManager.flush(world, { projectilePool, effectPool, enemyPool, pickupPool });
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
