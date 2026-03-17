import { moveToward } from './behaviorUtils.js';

/**
 * circle — 포위 회전
 * 플레이어 주변을 원형으로 회전하며 접근한다.
 */
const CIRCLE_RADIUS      = 180;  // px
const CIRCLE_APPROACH_SPEED = 60; // px/s (반지름 유지 속도)

export function circle(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  if (enemy.circleAngle === undefined) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    enemy.circleAngle = Math.atan2(dy, dx);
  }

  const rotSpeed = (enemy.circleSpeed ?? 1.5) * deltaTime; // rad/s
  enemy.circleAngle += rotSpeed;

  const targetX = player.x + Math.cos(enemy.circleAngle) * CIRCLE_RADIUS;
  const targetY = player.y + Math.sin(enemy.circleAngle) * CIRCLE_RADIUS;
  moveToward(enemy, targetX, targetY, (enemy.speed ?? 60) + CIRCLE_APPROACH_SPEED, deltaTime);
}
