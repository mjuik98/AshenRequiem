import { EntityManager } from '../../managers/EntityManager.js';

/**
 * FlushSystem — spawnQueue 처리 + pendingDestroy 정리
 *
 * REFACTOR: 단일 책임 분리
 *   Before: tickEffects() + EntityManager.flush() 두 가지 책임
 *   After:  EntityManager.flush() 만 담당 (엔티티 생성/정리)
 *           이펙트 수명 틱은 EffectTickSystem (priority 108)이 담당
 */
export const FlushSystem = {
  update(ctx) {
    const { world, services } = ctx;
    const { projectilePool, effectPool, enemyPool, pickupPool } = services;
    EntityManager.flush(world, { projectilePool, effectPool, enemyPool, pickupPool });
  },
};
