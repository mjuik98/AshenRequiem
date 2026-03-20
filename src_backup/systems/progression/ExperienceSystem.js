/**
 * src/systems/progression/ExperienceSystem.js — 픽업 자기력 흡수 + XP 적용
 *
 * CHANGE (Phase 2): PICKUP_DEFAULTS → PICKUP_BEHAVIOR 사용
 * CHANGE (Phase 4): player.xpMult 반영
 *   xpMult가 1.0보다 크면 획득 XP에 배율을 곱한다.
 *   Math.ceil로 올림하여 소수점 XP가 누적되지 않도록 처리한다.
 */
import { distanceSq }       from '../../math/Vector2.js';
import { PICKUP_BEHAVIOR }  from '../../data/constants.js';

export const ExperienceSystem = {
  update({ world: { events, player, pickups, deltaTime } }) {
    if (!player?.isAlive) return;

    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    const speed       = PICKUP_BEHAVIOR.magnetSpeed * deltaTime;

    // xpMult 캐싱 (매 프레임 반복 접근 최적화)
    const xpMult = player.xpMult ?? 1.0;

    // ── 1단계: XP 적용 + 픽업 비활성화 ──────────────────────────────────
    const collected = events.pickupCollected;
    for (let i = 0; i < collected.length; i++) {
      const pk = collected[i].pickup;
      if (!pk.isAlive || pk.pendingDestroy) continue;
      // Phase 4: xpMult 적용 (올림 처리로 소수점 손실 방지)
      player.xp        += Math.ceil((pk.xpValue ?? 0) * xpMult);
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
          // Phase 4: xpMult 적용
          player.xp        += Math.ceil((pk.xpValue ?? 0) * xpMult);
          pk.isAlive        = false;
          pk.pendingDestroy = true;
        }
      }
    }
  },
};

