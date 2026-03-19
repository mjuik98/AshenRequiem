/**
 * src/utils/entityUtils.js — 엔티티 공통 헬퍼 함수 (신규 모듈)
 *
 * ── 신규 추가 배경 ──────────────────────────────────────────────────────
 * Before:
 *   slow 상태이상에 의한 속도 배율 계산이 PlayerMovementSystem과
 *   EnemyMovementSystem에 각각 인라인으로 중복 존재:
 *
 *     // PlayerMovementSystem.js
 *     const slow = player.statusEffects?.find(e => e.type === 'slow');
 *     const speedMult = slow ? (1 - slow.magnitude) : 1;
 *
 *     // EnemyMovementSystem.js
 *     const slowEffect = e.statusEffects?.find(eff => eff.type === 'slow');
 *     const speedMult  = slowEffect ? Math.max(0, 1 - slowEffect.magnitude) : 1;
 *
 *   두 코드는 Math.max(0, ...) 유무의 미묘한 차이까지 존재.
 *
 * After:
 *   getSlowMultiplier(entity) 단일 함수로 중앙화.
 *   Math.max(0, ...) 방어 코드를 포함하여 두 시스템 모두 올바른 구현 사용.
 * ──────────────────────────────────────────────────────────────────────
 */

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

/**
 * 엔티티가 실제로 살아있고 처리 대상인지 확인한다.
 * isAlive 와 pendingDestroy 를 함께 체크하는 패턴을 단일 함수로 추출.
 *
 * @param {object} entity
 * @returns {boolean}
 */
export function isLive(entity) {
  return entity.isAlive === true && entity.pendingDestroy !== true;
}
