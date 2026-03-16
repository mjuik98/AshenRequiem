/**
 * compact.js — pendingDestroy 항목 배열 정리 유틸
 * FIX(pattern): 순회 중 즉시 splice 삭제 금지 → 이 함수들로 일괄 처리
 */

/** pendingDestroy 항목을 풀로 반환하면서 배열 압축 */
export function compactWithPool(arr, pool) {
  let write = 0;
  for (let read = 0; read < arr.length; read++) {
    const item = arr[read];
    if (item.pendingDestroy) {
      pool.release(item);
    } else {
      arr[write++] = item;
    }
  }
  arr.length = write;
}

/** pendingDestroy 항목을 버리면서 배열 압축 */
export function compactInPlace(arr) {
  let write = 0;
  for (let read = 0; read < arr.length; read++) {
    if (!arr[read].pendingDestroy) arr[write++] = arr[read];
  }
  arr.length = write;
}
