import { distanceSq } from '../../math/Vector2.js';
import { COLLISION_CULL_MARGIN } from '../../data/constants.js';

/**
 * CollisionSystem — 충돌 판정 전용
 *
 * FIX(perf): hitTargets.includes(e.id) O(n) → hitTargets.has(e.id) O(1)
 *            hitTargets.push(e.id)      → hitTargets.add(e.id)
 *            (createProjectile 및 _resetProjectile 도 함께 변경)
 *
 * FIX(refactor): CULL_MARGIN 하드코딩 → constants.js 의 COLLISION_CULL_MARGIN 으로 이관.
 *   해상도/카메라 zoom 변경 시 constants.js 한 곳만 수정하면 된다.
 *
 * FIX(contract): 픽업 상태 직접 수정 제거 — 계약 위반 수정.
 *   이전: events.pickupCollected.push 후 pk.isAlive = false, pk.pendingDestroy = true 직접 설정.
 *         → CollisionSystem 계약("쓰기: 직접 체력 수정 금지, events 에만 출력")을 위반.
 *   이후: events.pickupCollected.push 만 수행.
 *         픽업 비활성화는 ExperienceSystem.update() 에서 XP 적용 후 일괄 처리.
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

    // ── 투사체 vs 적 ──────────────────────────────────────────
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;

      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (!e.isAlive || e.pendingDestroy) continue;

        if (hasCull && (e.x < cullMinX || e.x > cullMaxX || e.y < cullMinY || e.y > cullMaxY)) {
            continue;
        }

        if (p.hitTargets.has(e.id)) {
            continue;
        }

        const rSum = p.radius + e.radius;
        const dSq = distanceSq(p, e);

        if (dSq <= rSum * rSum) {
          events.hits.push({
            attackerId:  p.ownerId,
            targetId:    e.id,
            target:      e,
            damage:      p.damage,
            projectileId: p.id,
            projectile:  p,
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
            attackerId:  e.id,
            targetId:    player.id,
            target:      player,
            damage:      e.damage,
            projectileId: null,
            projectile:  null,
          });
          break; // 프레임당 1회만 피격
        }
      }
    }

    // ── 픽업 vs 플레이어 ──────────────────────────────────────
    // FIX(contract): pk.isAlive = false, pk.pendingDestroy = true 직접 설정 제거.
    //   픽업 비활성화는 ExperienceSystem 에서 XP 적용 후 일괄 처리.
    //   CollisionSystem 은 events.pickupCollected 에 기록만 한다.
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
