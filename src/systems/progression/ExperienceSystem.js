import { distanceSq }     from '../../math/Vector2.js';
import { PICKUP_DEFAULTS } from '../../data/constants.js';

/**
 * ExperienceSystem — 픽업 자기력 흡수 + XP 적용
 *
 * PERF: normalize(sub(...)) 임시 객체 제거 → 인라인 계산
 */
export const ExperienceSystem = {
  update({ events, player, pickups, deltaTime }) {
    if (!player?.isAlive) return;

    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    const speed       = PICKUP_DEFAULTS.magnetSpeed * deltaTime;

    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;

      if (!pk.magnetized && distanceSq(player, pk) <= magnetRadSq) {
        pk.magnetized = true;
      }

      // PERF: 인라인 계산 (임시 객체 없음)
      if (pk.magnetized) {
        const dx = player.x - pk.x;
        const dy = player.y - pk.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        pk.x += (dx / len) * speed;
        pk.y += (dy / len) * speed;
      }
    }

    // XP 적용 + 픽업 비활성화
    const collected = events.pickupCollected;
    for (let i = 0; i < collected.length; i++) {
      const pk = collected[i].pickup;
      if (!pk.isAlive || pk.pendingDestroy) continue;
      player.xp += pk.xpValue;
      pk.isAlive        = false;
      pk.pendingDestroy = true;
    }
  },
};
