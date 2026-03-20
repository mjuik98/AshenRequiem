import { moveToward } from './behaviorUtils.js';

/**
 * chase — 기본 추적
 * 플레이어를 향해 직선으로 이동한다.
 */
export function chase(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;
  moveToward(enemy, player.x, player.y, enemy.speed, deltaTime);
}
