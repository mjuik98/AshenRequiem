/**
 * behaviors/enemyBehaviors/behaviorUtils.js
 * 적 행동 패턴에서 공통으로 사용하는 유틸리티 함수
 */

export function dist2(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

export function moveToward(entity, tx, ty, speed, dt) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const d  = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.1) return;
  const s = (speed ?? entity.speed ?? 60);
  entity.x += (dx / d) * s * dt;
  entity.y += (dy / d) * s * dt;
}
