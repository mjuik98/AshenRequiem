/**
 * src/systems/progression/ExperienceSystem.js — 픽업 자기력 흡수 + XP 적용
 *
 * CHANGE(P2): PICKUP_DEFAULTS → PICKUP_BEHAVIOR 사용
 */
import { distanceSq }       from '../../math/Vector2.js';
import { PICKUP_BEHAVIOR }  from '../../data/constants.js';

export const ExperienceSystem = {
  update({ world: { events, player, pickups, deltaTime } }) {
    if (!player?.isAlive) return;

    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    const speed       = PICKUP_BEHAVIOR.magnetSpeed * deltaTime;

    // ── 1단계: XP 적용 + 픽업 비활성화 ──────────────────────────────────
    const collected = events.pickupCollected;
    for (let i = 0; i < collected.length; i++) {
      const pk = collected[i].pickup;
      if (!pk.isAlive || pk.pendingDestroy) continue;
      player.xp        += pk.xpValue ?? 0;
      pk.isAlive        = false;
      pk.pendingDestroy = true;
    }

    // ── 2단계: 자석 이동 + 자체 pick up ──────────────────────────────────
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      // FIX(BUG-PICKUP-DOUBLE): 이미 수집/처리된 픽업 스킵
      if (!pk.isAlive || pk.pendingDestroy) continue;

      if (!pk.magnetized && distanceSq(player, pk) <= magnetRadSq) {
        pk.magnetized = true;
      }

      if (pk.magnetized) {
        const dx      = player.x - pk.x;
        const dy      = player.y - pk.y;
        const distSq2 = dx * dx + dy * dy;
        const len     = Math.sqrt(distSq2) || 1;
        pk.x += (dx / len) * speed;
        pk.y += (dy / len) * speed;

        const catchRadSq = (player.radius + pk.radius) * (player.radius + pk.radius);
        if (distSq2 < catchRadSq) {
          events.pickupCollected.push({ pickup: pk, playerId: player.id });
          player.xp        += pk.xpValue ?? 0;
          pk.isAlive        = false;
          pk.pendingDestroy = true;
        }
      }
    }
  },
};
