/**
 * src/systems/combat/CollisionSystem.js
 *
 * REFACTOR (R-05): 모듈 레벨 _grid → createCollisionSystem() 팩토리
 *
 * Before (AGENTS.md R-05 위반):
 *   export const CollisionSystem = { _grid: new SpatialGrid(...) }
 *   → 모듈 레벨 상태 — 두 PlayScene 동시 존재 시 그리드 오염 가능
 *   → 테스트 간 격리 불가
 *
 * After:
 *   export function createCollisionSystem() → 클로저로 _grid 캡슐화
 *   → 인스턴스마다 독립적인 SpatialGrid
 *   → PipelineBuilder에서 생성, PlayContext가 생명주기 관리
 *
 * (기존 버그 수정 사항은 유지)
 * FIX(BUG-I): 적 vs 플레이어 다중 적 처리 break 제거
 * FIX(BUG-J): 적 투사체 vs 플레이어 ownerId 비교 방향 명확화
 */

import { distanceSq }                   from '../../math/Vector2.js';
import { getCullBounds, isInsideBounds } from '../../utils/cameraCull.js';
import { SpatialGrid }                   from '../../managers/SpatialGrid.js';
import { COLLISION_CULL_MARGIN }         from '../../data/constants.js';
import { isLive }                        from '../../utils/entityUtils.js';

const GRID_CELL_SIZE = 120;

/**
 * CollisionSystem 인스턴스를 생성한다.
 * 내부 SpatialGrid를 클로저로 캡슐화하여 인스턴스 간 상태 격리를 보장한다.
 *
 * @returns {{ update: Function }}
 */
export function createCollisionSystem() {
  const _grid = new SpatialGrid(GRID_CELL_SIZE);

  return {
    update({ world }) {
      const { player, enemies, projectiles, pickups, events, camera } = world;
      if (!isLive(player)) return;

      const bounds = getCullBounds(camera, COLLISION_CULL_MARGIN);

      _grid.clear();
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (isLive(e) && isInsideBounds(e, bounds)) {
          _grid.insert(e);
        }
      }

      // ── 플레이어 투사체 vs 적 ─────────────────────────────────────────
      for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i];
        if (!isLive(p) || p.ownerId !== player.id) continue;

        const queuedHitTargets = new Set(p.hitTargets);
        let queuedHitCount = p.hitCount ?? 0;
        const candidates = _grid.queryUnique(p);
        for (const e of candidates) {
          if (!isLive(e)) continue;
          if (queuedHitTargets.has(e.id)) continue;

          const rSum = p.radius + e.radius;
          const dSq  = distanceSq(p, e);
          if (dSq <= rSum * rSum) {
            queuedHitTargets.add(e.id);
            queuedHitCount++;
            events.hits.push({
              attackerId:   p.ownerId,
              targetId:     e.id,
              target:       e,
              damage:       p.damage,
              projectileId: p.id,
              projectile:   p,
            });

            if (queuedHitCount >= p.pierce) break;
          }
        }
      }

      // ── 적/투사체 vs 플레이어 — 무적 프레임 중엔 전체 생략 ────────────────
      if (player.invincibleTimer <= 0) {

        // 적 투사체 vs 플레이어
        // (p.ownerId === player.id: 플레이어 소유 투사체는 건너뜀, 의도된 방향)
        for (let i = 0; i < projectiles.length; i++) {
          const p = projectiles[i];
          if (!isLive(p) || p.ownerId === player.id) continue;
          const rSum = p.radius + player.radius;
          if (distanceSq(p, player) <= rSum * rSum) {
            events.hits.push({
              attackerId: p.ownerId,
              targetId:   player.id,
              target:     player,
              damage:     p.damage,
              projectile: p,
            });
            break; // 투사체 1발에 한 번만 피격
          }
        }

        // FIX(BUG-I): break 제거 — 겹친 모든 적이 동시에 타격
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!isLive(e)) continue;
          const rSum = player.radius + e.radius;
          if (distanceSq(player, e) <= rSum * rSum) {
            events.hits.push({
              attackerId: e.id,
              targetId:   player.id,
              target:     player,
              damage:     e.damage,
            });
          }
        }
      }

      // ── 픽업 수집 ────────────────────────────────────────────────────
      for (let i = 0; i < pickups.length; i++) {
        const pk = pickups[i];
        if (isLive(pk) &&
            distanceSq(player, pk) <= (player.radius + pk.radius) ** 2) {
          events.pickupCollected.push({
            pickupId: pk.id,
            pickup:   pk,
            playerId: player.id,
          });
        }
      }
    },
  };
}
