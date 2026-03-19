/**
 * src/utils/compact.js — 엔티티 배열 정리 유틸리티 (단일 진실의 원천)
 *
 * CHANGE(P1-F): isDead() 헬퍼 추가 + EntityManager와 로직 일원화
 *   Before:
 *     - compact.js: `item.pendingDestroy` 만 체크 (불완전)
 *     - EntityManager._compact(): `pendingDestroy || isAlive === false || collected === true` 체크
 *     - 두 구현이 각자 다른 dead 판정 기준을 가짐
 *   After:
 *     - isDead()가 단일 dead 판정 기준 제공
 *     - EntityManager._compact()는 이 파일의 함수를 사용
 *     - 판정 기준 변경 시 이 파일 한 곳만 수정
 *
 * 패턴 주의 (AGENTS.md §5):
 *   배열 순회 중 즉시 splice 삭제 금지 → 이 함수들로 프레임 끝에 일괄 처리
 */

/**
 * 엔티티가 제거 대상인지 판정하는 단일 기준 함수.
 * EntityManager, FlushSystem, compact 함수들이 모두 이 함수를 사용한다.
 *
 * @param {object} entity
 * @returns {boolean}
 */
export function isDead(entity) {
  return (
    entity.pendingDestroy === true ||
    entity.isAlive        === false ||
    entity.collected      === true
  );
}

/**
 * pendingDestroy/isAlive/collected 판정 기반으로 배열을 제자리(in-place) 정리.
 * 제거 대상 항목을 풀로 반환한 후 배열 길이를 줄인다.
 *
 * O(n) 단일 순회, 새 배열 할당 없음 (GC 친화적).
 *
 * @param {object[]}     arr   정리할 배열 (직접 변경됨)
 * @param {object|null}  pool  release()를 가진 ObjectPool (없으면 null)
 */
export function compactWithPool(arr, pool) {
  let write = 0;
  for (let read = 0; read < arr.length; read++) {
    const item = arr[read];
    if (isDead(item)) {
      if (pool && typeof pool.release === 'function') pool.release(item);
    } else {
      arr[write++] = item;
    }
  }
  arr.length = write;
}

/**
 * 풀 반환 없이 배열을 제자리 정리한다.
 * @param {object[]} arr  정리할 배열 (직접 변경됨)
 */
export function compactInPlace(arr) {
  compactWithPool(arr, null);
}
