// [리팩터링] PlayScene.js 하단에 있던 _compactWithPool / _compactInPlace 를 분리.
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
export function compactInPlace(arr) {
  let write = 0;
  for (let read = 0; read < arr.length; read++) {
    if (!arr[read].pendingDestroy) arr[write++] = arr[read];
  }
  arr.length = write;
}
