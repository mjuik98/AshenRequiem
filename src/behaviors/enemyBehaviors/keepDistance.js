import { dist2 } from './behaviorUtils.js';

/**
 * keepDistance — 원거리 유지
 * 최소 거리 안에 들어오면 후퇴, 너무 멀면 접근.
 */
const KEEP_MIN_DIST_SQ = 200 * 200;
const KEEP_MAX_DIST_SQ = 350 * 350;

export function keepDistance(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  const d2   = dist2(enemy, player);
  const dx   = player.x - enemy.x;
  const dy   = player.y - enemy.y;
  const d    = Math.sqrt(d2) || 1;
  const dirX = dx / d;
  const dirY = dy / d;

  const speed = (enemy.speed ?? 60);

  if (d2 < KEEP_MIN_DIST_SQ) {
    // 후퇴
    enemy.x -= dirX * speed * deltaTime;
    enemy.y -= dirY * speed * deltaTime;
  } else if (d2 > KEEP_MAX_DIST_SQ) {
    // 접근
    enemy.x += dirX * speed * deltaTime;
    enemy.y += dirY * speed * deltaTime;
  }
}
