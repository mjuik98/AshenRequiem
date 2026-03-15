import { distanceSq } from '../../math/Vector2.js';
import { normalize, sub } from '../../math/Vector2.js';
import { PICKUP_DEFAULTS } from '../../data/constants.js';
export const ExperienceSystem = {
  update({ events, player, pickups, deltaTime }) {
    if (!player || !player.isAlive) return;
    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;
      if (distanceSq(player, pk) <= magnetRadSq) pk.magnetized = true;
      if (pk.magnetized) {
        const dir = normalize(sub(player, pk));
        pk.x += dir.x * PICKUP_DEFAULTS.magnetSpeed * deltaTime;
        pk.y += dir.y * PICKUP_DEFAULTS.magnetSpeed * deltaTime;
      }
    }
    const collected = events.pickupCollected;
    for (let i = 0; i < collected.length; i++) player.xp += collected[i].pickup.xpValue;
  },
};
