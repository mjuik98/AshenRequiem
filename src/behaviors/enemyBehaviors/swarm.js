import { dist2 } from './behaviorUtils.js';

/**
 * swarm — 군집 이동
 * 다른 swarm 적들과 뭉치면서 플레이어를 향해 이동.
 */
const SWARM_SEPARATION_DIST_SQ = 40 * 40;
const SWARM_SEPARATION_FORCE   = 0.4;

export function swarm(enemy, { player, enemies, deltaTime }) {
  if (!player?.isAlive) return;

  // 1. 플레이어를 향한 이동 벡터
  let fx = player.x - enemy.x;
  let fy = player.y - enemy.y;
  const d = Math.sqrt(fx * fx + fy * fy) || 1;
  fx /= d; fy /= d;

  // 2. 인접 같은 타입과의 분리 벡터
  for (let i = 0; i < enemies.length; i++) {
    const other = enemies[i];
    if (other === enemy || !other.isAlive || other.behaviorId !== 'swarm') continue;
    const od2 = dist2(enemy, other);
    if (od2 < SWARM_SEPARATION_DIST_SQ && od2 > 0) {
      const od = Math.sqrt(od2);
      fx -= ((other.x - enemy.x) / od) * SWARM_SEPARATION_FORCE;
      fy -= ((other.y - enemy.y) / od) * SWARM_SEPARATION_FORCE;
    }
  }

  const len = Math.sqrt(fx * fx + fy * fy) || 1;
  const speed = (enemy.speed ?? 60);
  enemy.x += (fx / len) * speed * deltaTime;
  enemy.y += (fy / len) * speed * deltaTime;
}
