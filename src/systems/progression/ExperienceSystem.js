/**
 * src/systems/progression/ExperienceSystem.js — 픽업 자기력 흡수 + XP 적용
 *
 * FIX(1): 상자 chestCollected 중복 발행 수정
 *   Before: pickupCollected 루프 + 자석 루프 두 경로 모두에서 chestCollected를 push
 *           → 같은 프레임 내 두 번 발행 가능 → 보상 UI가 2배로 열림
 *   After:  chestCollected는 pickupCollected 루프에서만 발행.
 *           자석 루프는 직접 수집 시 pickupCollected에만 push하고
 *           XP/chest 처리는 pickupCollected 루프에 위임.
 *
 * FIX(2): 상자는 자석에 반응하지 않음 — 플레이어가 직접 밟아야 수집
 *   Before: 모든 픽업이 magnetRadius 이내면 magnetized = true
 *   After:  pickupType === 'chest'는 magnetize 및 자석 이동 대상에서 제외.
 *           CollisionSystem의 반경 체크는 그대로이므로 직접 밟으면 수집됨.
 */
import { distanceSq }       from '../../math/Vector2.js';
import { PICKUP_BEHAVIOR }  from '../../data/constants.js';

export const ExperienceSystem = {
  update({ world: { events, player, pickups, deltaTime } }) {
    if (!player?.isAlive) return;

    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    const speed       = PICKUP_BEHAVIOR.magnetSpeed * deltaTime;
    const xpMult      = player.xpMult ?? 1.0;

    // ── 1단계: pickupCollected 처리 (XP / 상자 이벤트 발행) ─────────────
    // 이 루프에서만 chestCollected를 발행한다 — 중복 방지.
    const collected = events.pickupCollected;
    for (let i = 0; i < collected.length; i++) {
      const pk = collected[i].pickup;
      if (!pk.isAlive || pk.pendingDestroy) continue;

      if (pk.pickupType === 'chest') {
        // 상자: XP 없이 chestCollected 발행
        events.chestCollected?.push({
          pickupId: pk.id,
          pickup:   pk,
          playerId: player.id,
        });
      } else {
        // 일반 픽업: XP 지급
        player.xp += Math.ceil((pk.xpValue ?? 0) * xpMult);
      }

      pk.isAlive        = false;
      pk.pendingDestroy = true;
    }

    // ── 2단계: 자석 이동 (상자는 제외) ───────────────────────────────────
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;

      // FIX(2): 상자는 자석 대상에서 완전 제외
      if (pk.pickupType === 'chest') continue;

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
          // FIX(1): pickupCollected에만 push → 위 루프에서 XP/chest 처리
          events.pickupCollected.push({ pickup: pk, playerId: player.id });
          pk.isAlive        = false;
          pk.pendingDestroy = true;
        }
      }
    }
  },
};
