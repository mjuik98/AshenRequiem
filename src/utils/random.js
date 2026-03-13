/**
 * random.js — 랜덤 유틸
 */

/** min 이상 max 미만의 랜덤 실수 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/** 배열에서 랜덤 요소 반환 */
export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 배열을 섞어서 새 배열 반환 (Fisher-Yates) */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
