import { distanceSq }                   from '../../math/Vector2.js';
import { getCullBounds, isInsideBounds } from '../../utils/cameraCull.js';
import { SpatialGrid }                   from '../../managers/SpatialGrid.js';
import { COLLISION_CULL_MARGIN }         from '../../data/constants.js';

/**
 * CollisionSystem — 충돌 판정 전용
 *
 * PERF(P1-1): 신규 SpatialGrid (비트 연산 해싱) 도입
 *   - O(n²) 전수 순회 → 공간 분할 최적화
 */

const GRID_CELL_SIZE = 120;

export const CollisionSystem = {
  _grid: new SpatialGrid(GRID_CELL_SIZE),

  update({ world }) {
    const { player, enemies, projectiles, pickups, events, camera } = world;
    if (!player?.isAlive) return;

    const bounds = getCullBounds(camera, COLLISION_CULL_MARGIN);

    this._grid.clear();
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (e.isAlive && !e.pendingDestroy && isInsideBounds(e, bounds)) {
        this._grid.insert(e);
      }
    }

    // ── 플레이어 투사체 vs 적 ─────────────────────────────────
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy || p.ownerId !== player.id) continue;

      const candidates = this._grid.queryUnique(p);
      for (const e of candidates) {
        if (!e.isAlive || e.pendingDestroy) continue;
        if (p.hitTargets.has(e.id)) continue;

        const rSum = p.radius + e.radius;
        const dSq = distanceSq(p, e);
        if (dSq <= rSum * rSum) {
          p.hitTargets.add(e.id);
          p.hitCount++;
          events.hits.push({
            attackerId:   p.ownerId,
            targetId:     e.id,
            target:       e,
            damage:       p.damage,
            projectileId: p.id,
            projectile:   p,
          });

          // FIX(bug): Pierce Leak
          if (p.hitCount >= p.pierce) break;
        }
      }
    }

    // ── 적 투사체 및 엔티티 vs 플레이어 — 생략 (기존 로직 유지 가능하나 
    // 여기서는 P1-1 핵심인 적/투사체 충돌 최적화에 집중)
    // ... 이하 기존 플레이어 충돌 로직 유지 ...
    if (player.invincibleTimer <= 0) {
      // 투사체 vs 플레이어
      for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i];
        if (!p.isAlive || p.pendingDestroy || p.ownerId === player.id) continue;
        const rSum = p.radius + player.radius;
        if (distanceSq(p, player) <= rSum * rSum) {
          events.hits.push({ attackerId: p.ownerId, targetId: player.id, target: player, damage: p.damage, projectile: p });
          break;
        }
      }
      // 적 vs 플레이어
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.isAlive || e.pendingDestroy) continue;
        const rSum = player.radius + e.radius;
        if (distanceSq(player, e) <= rSum * rSum) {
          events.hits.push({ attackerId: e.id, targetId: player.id, target: player, damage: e.damage });
          break;
        }
      }
    }

    // 픽업
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (pk.isAlive && !pk.pendingDestroy && distanceSq(player, pk) <= (player.radius + pk.radius) ** 2) {
        events.pickupCollected.push({ pickupId: pk.id, pickup: pk, playerId: player.id });
      }
    }
  },
};
