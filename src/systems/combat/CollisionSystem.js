import { distanceSq } from '../../math/Vector2.js';
import { COLLISION_CULL_MARGIN } from '../../data/constants.js';

/**
 * CollisionSystem — 충돌 판정 전용
 *
 * FIX(perf): 적 배열 사전 필터링으로 O(n×m) 브루트포스 완화.
 *   이전: 모든 투사체 루프 안에서 매번 전체 enemies 배열을 순회.
 *         투사체 80개 × 적 300마리 = 프레임당 24,000회 거리 계산.
 *   이후: 투사체 루프 진입 전 카메라 컬링 범위 내 살아있는 적만 nearEnemies 로 분리.
 *         투사체 루프는 nearEnemies 만 순회 → 화면 밖 적 검사 비용 제거.
 *         조건 분기 중복도 제거 (culling 조건을 사전 필터에서 처리).
 *
 * 계약:
 *   입력: player, enemies, projectiles, pickups, events, camera
 *   읽기: 위치, 반지름, 생존 상태
 *   쓰기: 없음 (직접 상태 수정 금지)
 *   출력: events.hits, events.pickupCollected
 */
export const CollisionSystem = {
  update({ player, enemies, projectiles, pickups, events, camera }) {
    if (!player || !player.isAlive) return;

    const hasCull = !!camera;
    const cullMinX = hasCull ? camera.x - COLLISION_CULL_MARGIN : -Infinity;
    const cullMaxX = hasCull ? camera.x + COLLISION_CULL_MARGIN : Infinity;
    const cullMinY = hasCull ? camera.y - COLLISION_CULL_MARGIN : -Infinity;
    const cullMaxY = hasCull ? camera.y + COLLISION_CULL_MARGIN : Infinity;

    // PERF: 투사체 루프 진입 전 살아있고 화면 범위 내인 적만 추려 재사용
    //   매 투사체마다 culling 조건을 반복 평가하는 비용을 제거한다.
    const nearEnemies = [];
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (!e.isAlive || e.pendingDestroy) continue;
      if (e.x < cullMinX || e.x > cullMaxX || e.y < cullMinY || e.y > cullMaxY) continue;
      nearEnemies.push(e);
    }

    // ── 투사체 vs 적 ──────────────────────────────────────────
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;

      for (let j = 0; j < nearEnemies.length; j++) {
        const e = nearEnemies[j];
        // nearEnemies 생성 후 같은 프레임 내 pendingDestroy 된 경우 재확인
        if (!e.isAlive || e.pendingDestroy) continue;

        if (p.hitTargets.has(e.id)) continue;

        const rSum = p.radius + e.radius;
        if (distanceSq(p, e) <= rSum * rSum) {
          events.hits.push({
            attackerId:   p.ownerId,
            targetId:     e.id,
            target:       e,
            damage:       p.damage,
            projectileId: p.id,
            projectile:   p,
          });
          p.hitTargets.add(e.id);
          p.hitCount++;
        }
      }
    }

    // ── 적 vs 플레이어 (무적 중 스킵) ────────────────────────
    if (player.invincibleTimer <= 0) {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.isAlive || e.pendingDestroy) continue;
        const rSum = player.radius + e.radius;
        if (distanceSq(player, e) <= rSum * rSum) {
          events.hits.push({
            attackerId:   e.id,
            targetId:     player.id,
            target:       player,
            damage:       e.damage,
            projectileId: null,
            projectile:   null,
          });
          break; // 프레임당 1회만 피격
        }
      }
    }

    // ── 픽업 vs 플레이어 ──────────────────────────────────────
    // 픽업 비활성화는 ExperienceSystem 에서 XP 적용 후 일괄 처리.
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;
      const rSum = player.radius + pk.radius;
      if (distanceSq(player, pk) <= rSum * rSum) {
        events.pickupCollected.push({ pickupId: pk.id, pickup: pk, playerId: player.id });
      }
    }
  },
};
