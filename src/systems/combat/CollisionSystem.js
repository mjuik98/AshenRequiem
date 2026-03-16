import { distanceSq }                   from '../../math/Vector2.js';
import { getCullBounds, isInsideBounds } from '../../utils/cameraCull.js';
import { SpatialGrid }                   from '../../utils/SpatialGrid.js';
import { COLLISION_CULL_MARGIN }         from '../../data/constants.js';

/**
 * CollisionSystem — 충돌 판정 전용
 *
 * 계약: 직접 상태 수정 금지 → events.hits / events.pickupCollected 에만 기록
 *
 * FIX(bug): nearEnemies 컬링 좌표 오류 수정
 *   getCullBounds(camera, MARGIN) 사용 — camera.x + canvasWidth + margin 올바르게 계산
 *
 * FIX(bug): 투사체 vs 적 ownerId 미검사 수정
 *   1) 플레이어 투사체 → 적 충돌 검사
 *   2) 적 투사체 → 플레이어 충돌 검사 (별도 블록)
 *
 * PERF(P3): SpatialGrid broad-phase 추가
 *   - nearEnemies 를 매 프레임 그리드에 삽입
 *   - 각 투사체마다 그리드에서 후보만 조회
 *   - 내부 루프 O(nearEnemies) → O(grid_candidates)
 *   - 적 수가 적을 때(< GRID_THRESHOLD) 오버헤드를 피하기 위해
 *     임계값 이하에서는 선형 스캔으로 폴백
 */

/** 이 수 이상 nearEnemies 가 있을 때 SpatialGrid 활성화 */
const GRID_THRESHOLD = 30;

/** 그리드 셀 크기(px) — 가장 큰 적 radius(32) × 3 */
const GRID_CELL_SIZE = 96;

/**
 * 최대 적 반지름 추정값.
 * query 반경 = proj.radius + MAX_ENEMY_RADIUS 로 사용.
 * 실제 최대값(boss_lich: 32)보다 여유 있게 설정.
 */
const MAX_ENEMY_RADIUS = 40;

export const CollisionSystem = {
  /** @private 프레임 간 재사용 그리드 인스턴스 */
  _grid: new SpatialGrid(GRID_CELL_SIZE),

  update({ player, enemies, projectiles, pickups, events, camera }) {
    if (!player?.isAlive) return;

    // FIX: getCullBounds — camera.x + canvasWidth + margin 올바르게 계산
    const bounds = getCullBounds(camera, COLLISION_CULL_MARGIN);

    // 사전 필터 — 화면 근처의 살아있는 적만 추림
    const nearEnemies = [];
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (!e.isAlive || e.pendingDestroy) continue;
      if (!isInsideBounds(e, bounds))     continue;
      nearEnemies.push(e);
    }

    // PERF(P3): nearEnemies 가 GRID_THRESHOLD 이상일 때 SpatialGrid 활성화
    const useGrid = nearEnemies.length >= GRID_THRESHOLD;
    if (useGrid) {
      this._grid.clear();
      for (let j = 0; j < nearEnemies.length; j++) {
        this._grid.insert(nearEnemies[j]);
      }
    }

    // ── 플레이어 투사체 vs 적 ─────────────────────────────────
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;
      if (p.ownerId !== player.id)        continue; // 적 소유 투사체 제외

      // PERF: 그리드 활성 시 후보만 조회, 비활성 시 nearEnemies 전체 순회
      const candidates = useGrid
        ? this._grid.query(p.x, p.y, p.radius + MAX_ENEMY_RADIUS)
        : nearEnemies;

      for (const e of candidates) {
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
          break; // 프레임당 1회
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
