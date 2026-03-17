/**
 * src/managers/EntityManager.js
 *
 * ▶ P1-B: EntityManager 완전 구현
 *
 * 역할:
 *   - 모든 엔티티 배열의 단일 접근 창구
 *   - spawnQueue / destroyQueue 처리 책임 집중
 *   - 순회 중 splice 삭제 버그 원천 차단
 *
 * 사용 원칙:
 *   - System은 world.enemies.push() 또는 splice()를 직접 호출하지 않는다.
 *   - 생성이 필요하면 → world.spawnQueue.push(entity)
 *   - 삭제가 필요하면 → entity.pendingDestroy = true
 *   - 프레임 끝(FlushSystem)에서 EntityManager.flush(world)가 일괄 처리한다.
 */

export const EntityManager = {

  // ─────────────────────────────────────────────
  // 조회
  // ─────────────────────────────────────────────

  /**
   * 살아있는 적 목록 반환 (pendingDestroy 제외)
   * @param {object} world
   * @returns {object[]}
   */
  getLiveEnemies(world) {
    return world.enemies.filter(e => e.isAlive && !e.pendingDestroy);
  },

  /**
   * 살아있는 투사체 목록 반환
   * @param {object} world
   * @returns {object[]}
   */
  getLiveProjectiles(world) {
    return world.projectiles.filter(p => p.isAlive && !p.pendingDestroy);
  },

  /**
   * 살아있는 픽업 목록 반환
   * @param {object} world
   * @returns {object[]}
   */
  getLivePickups(world) {
    return world.pickups.filter(p => !p.collected && !p.pendingDestroy);
  },

  /**
   * 살아있는 이펙트 목록 반환
   * @param {object} world
   * @returns {object[]}
   */
  getLiveEffects(world) {
    return world.effects.filter(e => e.isAlive && !e.pendingDestroy);
  },

  // ─────────────────────────────────────────────
  // 스폰 큐 즉시 처리 (FlushSystem 전용)
  // ─────────────────────────────────────────────

  /**
   * spawnQueue에 쌓인 엔티티를 배열에 반영한다.
   * System 내부에서 직접 호출하지 말 것 — FlushSystem이 프레임 끝에 호출한다.
   *
   * @param {object} world
   */
  flushSpawn(world) {
    for (const req of world.spawnQueue) {
      switch (req.type) {
        case 'enemy':
          world.enemies.push(req.entity);
          break;
        case 'projectile':
          world.projectiles.push(req.entity);
          break;
        case 'pickup':
          world.pickups.push(req.entity);
          break;
        case 'effect':
          world.effects.push(req.entity);
          break;
        default:
          console.warn('[EntityManager] 알 수 없는 spawnQueue 타입:', req.type);
      }
    }
    world.spawnQueue.length = 0;
  },

  // ─────────────────────────────────────────────
  // 삭제 큐 처리 (FlushSystem 전용)
  // ─────────────────────────────────────────────

  /**
   * pendingDestroy 또는 isAlive=false 엔티티를 배열에서 제거한다.
   * ObjectPool이 있으면 반환하고, 없으면 그냥 splice 한다.
   *
   * @param {object} world
   * @param {object} [pools]  { projectilePool, effectPool, enemyPool }
   */
  flushDestroy(world, pools = {}) {
    const { projectilePool, effectPool, enemyPool } = pools;

    world.enemies     = EntityManager._compact(world.enemies,     enemyPool);
    world.projectiles = EntityManager._compact(world.projectiles, projectilePool);
    world.pickups     = EntityManager._compact(world.pickups,     null);
    world.effects     = EntityManager._compact(world.effects,     effectPool);
  },

  /**
   * 한 번에 spawn + destroy 처리 (FlushSystem에서 이것만 호출해도 됨)
   *
   * @param {object} world
   * @param {object} [pools]
   */
  flush(world, pools = {}) {
    EntityManager.flushSpawn(world);
    EntityManager.flushDestroy(world, pools);
  },

  // ─────────────────────────────────────────────
  // 내부 유틸
  // ─────────────────────────────────────────────

  /**
   * pendingDestroy 또는 !isAlive 항목을 제거하고 새 배열을 반환한다.
   * 제거된 항목은 pool이 있으면 pool.release()로 반환한다.
   *
   * @private
   */
  _compact(arr, pool) {
    const live = [];
    for (const item of arr) {
      const dead = item.pendingDestroy || item.isAlive === false || item.collected === true;
      if (dead) {
        if (pool && typeof pool.release === 'function') {
          pool.release(item);
        }
      } else {
        live.push(item);
      }
    }
    return live;
  },

  // ─────────────────────────────────────────────
  // 유효성 감사 (개발 중 호출)
  // ─────────────────────────────────────────────

  /**
   * pendingDestroy 객체가 배열에 남아 있지 않은지 확인한다.
   * 프레임 끝 flush 후 assertClean(world)로 검증하면 된다.
   *
   * @param {object} world
   */
  assertClean(world) {
    const check = (label, arr) => {
      for (const item of arr) {
        if (item.pendingDestroy || item.isAlive === false) {
          console.error(`[EntityManager] assertClean 실패: ${label}에 dead 객체가 남아 있습니다.`, item);
        }
      }
    };
    check('enemies',     world.enemies);
    check('projectiles', world.projectiles);
    check('pickups',     world.pickups);
    check('effects',     world.effects);
  },
};
