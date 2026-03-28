/**
 * src/managers/EntityManager.js
 *
 * CHANGE(P1-F): entityUtils.js를 단일 진실의 원천으로 위임
 *   Before: EntityManager._compact()가 자체 dead 판정 로직 인라인 구현
 *           → entityUtils.js와 EntityManager가 각자 다른 기준으로 dead 판정
 *           → dead 판정 변경 시 두 파일 모두 수정 필요
 *   After:  isDead() / compactWithPool()을 entityUtils.js에서 import
 *           → dead 판정의 단일 진실의 원천: src/utils/entityUtils.js
 *           → flushDestroy()가 in-place 정리로 전환 (새 배열 할당 제거)
 *
 * 사용 원칙:
 *   - System은 world.entities.enemies.push() / splice()를 직접 호출하지 않는다.
 *   - 생성: world.queues.spawnQueue.push(entity)
 *   - 삭제: entity.pendingDestroy = true
 *   - 프레임 끝(FlushSystem)에서 EntityManager.flush(world)가 일괄 처리
 */
import { 
  isDead, 
  compactWithPool, 
  getLiveEnemies, 
  getLiveProjectiles, 
  getLivePickups, 
  getLiveEffects 
} from '../utils/entityUtils.js';
import { buildCurseSnapshot } from '../data/curseScaling.js';

export const EntityManager = {

  // ─────────────────────────────────────────────
  // 조회
  // ─────────────────────────────────────────────

  getLiveEnemies(world)     { return getLiveEnemies(world.entities.enemies); },
  getLiveProjectiles(world) { return getLiveProjectiles(world.entities.projectiles); },
  getLivePickups(world)     { return getLivePickups(world.entities.pickups); },
  getLiveEffects(world)     { return getLiveEffects(world.entities.effects); },

  // ─────────────────────────────────────────────
  // 스폰 큐 처리 (FlushSystem 전용)
  // ─────────────────────────────────────────────

  flushSpawn(world, pools = {}) {
    const { projectilePool, effectPool, enemyPool, pickupPool } = pools;
    const curseSnapshot = buildCurseSnapshot(world.entities.player?.curse ?? 0);
    const ascensionSnapshot = world.run?.ascension ?? null;
    const stageSnapshot = world.run?.stage ?? null;
    for (const req of world.queues.spawnQueue) {
      let entity = req.entity;

      switch (req.type) {
        case 'enemy':
          if (!entity && enemyPool) {
            entity = enemyPool.acquire({
              ...req.config,
              stageSnapshot,
              ascensionSnapshot,
              curseSnapshot,
            });
          }
          if (entity) world.entities.enemies.push(entity);
          break;
        case 'projectile':
          if (!entity && projectilePool) entity = projectilePool.acquire(req.config);
          if (entity) world.entities.projectiles.push(entity);
          break;
        case 'pickup':
          if (!entity && pickupPool) entity = pickupPool.acquire(req.config);
          if (entity) world.entities.pickups.push(entity);
          break;
        case 'effect':
          if (!entity && effectPool) entity = effectPool.acquire(req.config);
          if (entity) world.entities.effects.push(entity);
          break;
        default:
          console.warn('[EntityManager] 알 수 없는 spawnQueue 타입:', req.type);
      }
    }
    world.queues.spawnQueue.length = 0;
  },

  // ─────────────────────────────────────────────
  // 삭제 큐 처리 (FlushSystem 전용)
  // ─────────────────────────────────────────────

  /**
   * CHANGE(P1-F): _compact() 제거 → compactWithPool() 직접 사용
   *   Before: _compact()가 new Array를 생성하고 world.XXX = _compact(...) 재할당
   *   After:  compactWithPool()이 in-place 정리 → 배열 참조 유지, 할당 없음
   */
  flushDestroy(world, pools = {}) {
    const { projectilePool, effectPool, enemyPool, pickupPool } = pools;

    compactWithPool(world.entities.enemies, enemyPool);
    compactWithPool(world.entities.projectiles, projectilePool);
    compactWithPool(world.entities.pickups, pickupPool);
    compactWithPool(world.entities.effects, effectPool);
  },

  flush(world, pools = {}) {
    EntityManager.flushSpawn(world, pools);
    EntityManager.flushDestroy(world, pools);
  },

  // ─────────────────────────────────────────────
  // 유효성 감사 (개발 중 호출)
  // ─────────────────────────────────────────────

  /**
   * pendingDestroy 객체가 배열에 남아 있지 않은지 확인한다.
   * flush 후 assertClean(world)로 검증.
   */
  assertClean(world) {
    const check = (label, arr) => {
      for (const item of arr) {
        if (isDead(item)) {
          console.error(`[EntityManager] assertClean 실패: ${label}에 dead 객체가 남아 있습니다.`, item);
        }
      }
    };
    check('enemies', world.entities.enemies);
    check('projectiles', world.entities.projectiles);
    check('pickups', world.entities.pickups);
    check('effects', world.entities.effects);
  },
};
