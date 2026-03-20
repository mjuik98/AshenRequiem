/**
 * src/utils/entityUtils.js — 엔티티 공통 헬퍼 함수 (단일 진실의 원천)
 *
 * REFACTOR (R-16):
 *   - 모든 엔티티 상태 판정 함수가 이 파일 하나에 집중
 *   - compact.js / weaponBehaviorUtils.js 는 이 파일을 re-export
 *   - 인라인 필터 패턴 금지 (AGENTS.md R-16)
 */

// ── 기본 생사 판정 ────────────────────────────────────────────────────────────

/**
 * 엔티티가 살아있고 제거 대기 중이 아닌지 확인한다.
 * @param {object} entity
 * @returns {boolean}
 */
export function isLive(entity) {
  return entity && entity.isAlive === true && entity.pendingDestroy !== true;
}

/**
 * 엔티티가 제거 대상인지 확인한다.
 * compact.js, FlushSystem 등 정리 로직이 이 함수를 단일 기준으로 사용한다.
 *
 * @param {object} entity
 * @returns {boolean}
 */
export function isDead(entity) {
  return !entity || entity.pendingDestroy === true || entity.isAlive === false;
}

// ── 배열 필터 헬퍼 ───────────────────────────────────────────────────────────

/**
 * 살아있는 적 목록 반환 (pendingDestroy 제외).
 * weaponBehaviorUtils.js 등에서 re-export 하여 동일 구현을 공유한다.
 *
 * @param {object[]} enemies
 * @returns {object[]}
 */
export function getLiveEnemies(enemies) {
  return (enemies || []).filter(isLive);
}

/**
 * 살아있는 투사체 목록 반환.
 * @param {object[]} projectiles
 * @returns {object[]}
 */
export function getLiveProjectiles(projectiles) {
  return (projectiles || []).filter(isLive);
}

/**
 * 살아있는 픽업 목록 반환.
 * @param {object[]} pickups
 * @returns {object[]}
 */
export function getLivePickups(pickups) {
  return (pickups || []).filter(p => !p.collected && isLive(p));
}

/**
 * 배열을 순회하며 죽은 엔티티를 정리하고, 풀이 있으면 반환한다. (In-place)
 * EntityManager.flushDestroy 등에서 일괄 정리를 위해 사용.
 * 
 * @param {object[]} array 정리할 배열
 * @param {object} pool (Optional) ObjectPool 인스턴스
 */
export function compactWithPool(array, pool) {
  if (!array) return;
  
  let writeIdx = 0;
  for (let readIdx = 0; readIdx < array.length; readIdx++) {
    const item = array[readIdx];
    
    if (isDead(item)) {
      if (pool && typeof pool.release === 'function') {
        pool.release(item);
      }
    } else {
      if (readIdx !== writeIdx) {
        array[writeIdx] = item;
      }
      writeIdx++;
    }
  }
  
  // 나머지 요소 제거
  array.length = writeIdx;
}

// ── 상태이상 헬퍼 ────────────────────────────────────────────────────────────

/**
 * 엔티티의 slow 상태이상을 조회해 속도 배율을 반환한다.
 * slow가 없으면 1.0, slow가 있으면 (1 - magnitude)를 [0, 1] 범위로 클램핑.
 *
 * @param {object} entity - statusEffects 배열을 가진 엔티티
 * @returns {number} 0.0 ~ 1.0 범위의 속도 배율
 */
export function getSlowMultiplier(entity) {
  const slow = entity.statusEffects?.find(e => e.type === 'slow');
  return slow ? Math.max(0, 1 - slow.magnitude) : 1;
}
