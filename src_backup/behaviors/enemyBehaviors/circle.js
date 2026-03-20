import { moveToward } from './behaviorUtils.js';

/**
 * circle — 포위 회전
 * 플레이어 주변을 원형으로 회전하며 접근한다.
 *
 * BUGFIX: enemy.speed → enemy.moveSpeed
 */
const CIRCLE_RADIUS        = 180;
const CIRCLE_APPROACH_SPEED = 60;

export function circle(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  if (enemy.circleAngle === undefined) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    enemy.circleAngle = Math.atan2(dy, dx);
  }

  const rotSpeed = (enemy.circleSpeed ?? 1.5) * deltaTime;
  enemy.circleAngle += rotSpeed;

  const targetX = player.x + Math.cos(enemy.circleAngle) * CIRCLE_RADIUS;
  const targetY = player.y + Math.sin(enemy.circleAngle) * CIRCLE_RADIUS;

  // FIX: enemy.speed → enemy.moveSpeed
  moveToward(enemy, targetX, targetY, (enemy.moveSpeed ?? 60) + CIRCLE_APPROACH_SPEED, deltaTime);
}
