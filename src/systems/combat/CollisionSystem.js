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
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;
      const rSum = player.radius + pk.radius;
      if (distanceSq(player, pk) <= rSum * rSum) {
        events.pickupCollected.push({ pickupId: pk.id, pickup: pk, playerId: player.id });
        pk.isAlive = false;
        pk.pendingDestroy = true;
      }
    }
  },
};
