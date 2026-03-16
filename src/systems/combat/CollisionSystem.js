import { distanceSq }            from '../../math/Vector2.js';
import { COLLISION_CULL_MARGIN } from '../../data/constants.js';

/**
 * CollisionSystem — 충돌 판정 전용
 *
 * PERF: 투사체 루프 진입 전 nearEnemies 사전 필터링으로 O(n×m) 완화
 * 계약: 직접 상태 수정 금지 → events.hits / events.pickupCollected 에만 기록
 *
 * FIX(bug): 투사체 vs 적 블록에서 ownerId 미검사로 인한 충돌 누락 수정
 *   - 기존: 모든 투사체를 nearEnemies 에 대해서만 검사
 *     → 적 소유 투사체가 플레이어에게 충돌하지 않는 버그 발생
 *   - 수정:
 *     1) 투사체 vs 적   → p.ownerId === player.id 인 경우만 검사
 *     2) 적 투사체 vs 플레이어 → p.ownerId !== player.id 인 경우 별도 블록으로 검사
 */
export const CollisionSystem = {
  update({ player, enemies, projectiles, pickups, events, camera }) {
    if (!player?.isAlive) return;

    const hasCull  = !!camera;
    const cullMinX = hasCull ? camera.x - COLLISION_CULL_MARGIN : -Infinity;
    const cullMaxX = hasCull ? camera.x + COLLISION_CULL_MARGIN :  Infinity;
    const cullMinY = hasCull ? camera.y - COLLISION_CULL_MARGIN : -Infinity;
    const cullMaxY = hasCull ? camera.y + COLLISION_CULL_MARGIN :  Infinity;

    // PERF: 사전 필터 — 화면 근처의 살아있는 적만 추림
    const nearEnemies = [];
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (!e.isAlive || e.pendingDestroy) continue;
      if (e.x < cullMinX || e.x > cullMaxX || e.y < cullMinY || e.y > cullMaxY) continue;
      nearEnemies.push(e);
    }

    // ── 플레이어 투사체 vs 적 ─────────────────────────────────
    // FIX: player.id 소유 투사체만 적에 대해 충돌 검사
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;
      if (p.ownerId !== player.id) continue; // FIX: 적 소유 투사체 제외

      for (let j = 0; j < nearEnemies.length; j++) {
        const e = nearEnemies[j];
        if (!e.isAlive || e.pendingDestroy) continue;
        if (p.hitTargets.has(e.id))         continue;

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

    // ── 적 투사체 vs 플레이어 (무적 중 스킵) ─────────────────
    // FIX: 적 소유 투사체(ownerId !== player.id)를 플레이어에 대해 검사
    if (player.invincibleTimer <= 0) {
      for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i];
        if (!p.isAlive || p.pendingDestroy) continue;
        if (p.ownerId === player.id)        continue; // 플레이어 소유 투사체 제외
        if (p.hitTargets.has(player.id))    continue;

        const rSum = p.radius + player.radius;
        if (distanceSq(p, player) <= rSum * rSum) {
          events.hits.push({
            attackerId:   p.ownerId,
            targetId:     player.id,
            target:       player,
            damage:       p.damage,
            projectileId: p.id,
            projectile:   p,
          });
          p.hitTargets.add(player.id);
          p.hitCount++;
          break; // 프레임당 1회 (적 몸체 충돌과 동일한 정책)
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
          break; // 프레임당 1회
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
      }
    }
  },
};
