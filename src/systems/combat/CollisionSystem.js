/**
 * src/systems/combat/CollisionSystem.js
 *
 * FIX(BUG-I): 적 vs 플레이어 — 다중 적 처리 break 제거
 *
 *   Before: 적 순회 중 첫 번째 충돌 적만 hit 처리 후 break
 *           → 같은 프레임에 여러 적이 플레이어와 겹쳐도 첫 번째 적만 데미지 발생
 *           → DamageSystem에서 invincibleTimer가 설정되므로 다음 프레임엔 무적
 *              → 사실상 "겹친 적 중 1마리만 항상 타격" 로직으로 고정됨
 *   After:  break 제거 — 같은 프레임 invincibleTimer <= 0 구간 안에서
 *           충돌한 모든 적이 hit 이벤트를 발행
 *           invincibleTimer 기반 프레임간 무적은 DamageSystem이 담당하므로
 *           CollisionSystem은 충돌 판정만 책임지는 단일 책임 원칙 유지
 *
 * FIX(BUG-J): 적 투사체 vs 플레이어 — ownerId 비교 방향 오류
 *
 *   Before: p.ownerId === player.id  ← continue (플레이어 투사체 건너뜀) 코드가
 *           아래 적 투사체 처리 블록에서도 동일 조건으로 반복되어 있어
 *           p.ownerId !== player.id 여야 하는 조건이 혼동되기 쉬움
 *           현재 코드는 `p.ownerId === player.id`를 continue로 쓰므로 맞지만
 *           주석이 누락되어 리뷰어가 버그로 오해할 위험 높음
 *   After:  명시적 주석 추가로 의도 명확화
 */

import { distanceSq }                   from '../../math/Vector2.js';
import { getCullBounds, isInsideBounds } from '../../utils/cameraCull.js';
import { SpatialGrid }                   from '../../managers/SpatialGrid.js';
import { COLLISION_CULL_MARGIN }         from '../../data/constants.js';

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
        const dSq  = distanceSq(p, e);
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

          if (p.hitCount >= p.pierce) break;
        }
      }
    }

    // ── 적/투사체 vs 플레이어 — 무적 프레임 중엔 전체 생략 ────────────
    if (player.invincibleTimer <= 0) {

      // 적 투사체 vs 플레이어
      // (p.ownerId === player.id: 플레이어 소유 투사체는 건너뜀, 의도된 방향)
      for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i];
        if (!p.isAlive || p.pendingDestroy || p.ownerId === player.id) continue;
        const rSum = p.radius + player.radius;
        if (distanceSq(p, player) <= rSum * rSum) {
          events.hits.push({
            attackerId: p.ownerId,
            targetId:   player.id,
            target:     player,
            damage:     p.damage,
            projectile: p,
          });
          // 적 투사체 1발에 한 번만 피격 (break 유지 — 투사체는 pierce와 별도 처리)
          break;
        }
      }

      // FIX(BUG-I): 적 vs 플레이어 — break 제거
      // Before: 첫 번째 충돌 적에서 break → 동일 프레임 나머지 적 데미지 무시
      // After:  break 없이 충돌한 모든 적을 hit 이벤트로 발행
      //         → DamageSystem에서 첫 hit 처리 후 invincibleTimer 설정,
      //            이후 프레임에서 무적이 적용되므로 burst 사망 위험은 제한됨
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.isAlive || e.pendingDestroy) continue;
        const rSum = player.radius + e.radius;
        if (distanceSq(player, e) <= rSum * rSum) {
          events.hits.push({
            attackerId: e.id,
            targetId:   player.id,
            target:     player,
            damage:     e.damage,
          });
          // break 삭제 — 겹친 모든 적이 동시에 타격
        }
      }
    }

    // ── 픽업 수집 ────────────────────────────────────────────
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (pk.isAlive && !pk.pendingDestroy &&
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
