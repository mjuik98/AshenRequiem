import { distanceSq } from '../../math/Vector2.js';
import { normalize, sub } from '../../math/Vector2.js';
import { PICKUP_DEFAULTS } from '../../data/constants.js';

/**
 * ExperienceSystem — 경험치 수집 + 픽업 자석 이동
 *
 * 입력: events.pickupCollected, player, pickups, deltaTime
 * 쓰기: 플레이어 XP, 픽업 상태
 */
export const ExperienceSystem = {
  update({ events, player, pickups, deltaTime }) {
    if (!player || !player.isAlive) return;

    // 1) 자석 범위 내 픽업을 플레이어 쪽으로 끌어당김
    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;

      const dSq = distanceSq(player, pk);
      if (dSq <= magnetRadSq) {
        pk.magnetized = true;
      }

      if (pk.magnetized) {
        const dir = normalize(sub(player, pk));
        pk.x += dir.x * PICKUP_DEFAULTS.magnetSpeed * deltaTime;
        pk.y += dir.y * PICKUP_DEFAULTS.magnetSpeed * deltaTime;
      }
    }

    // 2) 수집된 픽업에서 XP 획득
    const collected = events.pickupCollected;
    for (let i = 0; i < collected.length; i++) {
      player.xp += collected[i].pickup.xpValue;
    }
  },
};
