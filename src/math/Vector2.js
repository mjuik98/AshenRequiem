/**
 * src/math/Vector2.js — 2D 벡터 연산 유틸리티 (중앙 수학 모듈)
 *
 * ── 리팩터링 이력 ─────────────────────────────────────────────────────
 * Before:
 *   dist2()       → behaviorUtils.js에만 존재 (distanceSq와 동일 로직 중복)
 *   moveToward()  → behaviorUtils.js에만 존재 (normalize 인라인 중복)
 *
 * After:
 *   moveToward()를 이 파일로 이전 — normalize 재사용, 중복 제거
 *   behaviorUtils.js는 re-export 전용으로 축소
 * ──────────────────────────────────────────────────────────────────────
 */

/** 두 점 사이의 거리 제곱 */
export function distanceSq(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function sub(a, b)   { return { x: a.x - b.x, y: a.y - b.y }; }
export function add(a, b)   { return { x: a.x + b.x, y: a.y + b.y }; }
export function scale(v, s) { return { x: v.x * s,   y: v.y * s   }; }

export function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

/**
 * entity를 (tx, ty) 방향으로 speed * dt만큼 이동시킨다.
 * 거리가 0.1 미만이면 이동하지 않는다.
 *
 * @param {object} entity  x, y를 가진 가변 객체
 * @param {number} tx      목표 x
 * @param {number} ty      목표 y
 * @param {number} speed   이동 속도 (px/s). falsy면 entity.speed ?? 60 사용
 * @param {number} dt      delta time (s)
 */
export function moveToward(entity, tx, ty, speed, dt) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const d  = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.1) return;
  const s = speed || entity.speed || 60;
  entity.x += (dx / d) * s * dt;
  entity.y += (dy / d) * s * dt;
}
