import { distanceSq } from '../../math/Vector2.js';
import { PICKUP_DEFAULTS } from '../../data/constants.js';

/**
 * ExperienceSystem — 픽업 자기력 흡수 + XP 적용
 *
 * PERF(refactor): normalize(sub(...)) 매 프레임 임시 객체 생성 제거.
 *   이전: const dir = normalize(sub(player, pk)) → sub() 1회, normalize() 1회 객체 할당.
 *         픽업이 많을 때 (후반 대량 킬) GC 압박으로 FPS 저하 유발.
 *   이후: dx/dy 인라인 계산 → 임시 객체 0개.
 *         Vector2 import 도 distanceSq 만 유지 (normalize, sub 제거).
 */
export const ExperienceSystem = {
  update({ events, player, pickups, deltaTime }) {
    if (!player || !player.isAlive) return;

    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    const speed       = PICKUP_DEFAULTS.magnetSpeed * deltaTime;

    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;

      // 자기력 범위 내 진입 시 magnetized 활성화
      if (!pk.magnetized && distanceSq(player, pk) <= magnetRadSq) {
        pk.magnetized = true;
      }

      // PERF: normalize(sub(...)) 임시 객체 제거 → 인라인 계산
      if (pk.magnetized) {
        const dx = player.x - pk.x;
        const dy = player.y - pk.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        pk.x += (dx / len) * speed;
        pk.y += (dy / len) * speed;
      }
    }

    // XP 적용 + 픽업 비활성화
    // FIX(contract): CollisionSystem 에서 이곳으로 이전.
    //   XP 를 먼저 적용한 뒤 픽업을 비활성화하여 같은 프레임 이중 수집 방지.
    const collected = events.pickupCollected;
    for (let i = 0; i < collected.length; i++) {
      const pk = collected[i].pickup;

      // FIX(bug): 방어적 중복 수집 가드 (같은 프레임 두 번 처리 차단)
      if (!pk.isAlive || pk.pendingDestroy) continue;

      player.xp += pk.xpValue;

      // FIX(contract): 픽업 비활성화는 ExperienceSystem 이 담당
      pk.isAlive        = false;
      pk.pendingDestroy = true;
    }
  },
};
