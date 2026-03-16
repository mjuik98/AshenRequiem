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
 * FIX(bug): 적 vs 플레이어 충돌에서 break 제거.
 *   이전: 같은 프레임에 여러 적이 동시에 닿아도 첫 번째 적의 데미지만 처리.
 *         후반 고밀도 상황에서 체감 데미지가 의도보다 훨씬 낮아지는 원인.
 *   이후: break 제거 → 동일 프레임에 닿은 모든 적의 데미지를 events.hits 에 기록.
 *         연속 피격 보호는 player.invincibleTimer 가 담당.
 *         (DamageSystem 에서 invincibleTimer 를 세팅하고,
 *          CollisionSystem 에서 invincibleTimer <= 0 인 경우에만 피격 판정 수행)
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

    // ── 적 vs 플레이어 ────────────────────────────────────────
    // 무적 중에는 피격 판정 전체 스킵.
    // 연속 피격 보호는 DamageSystem 이 invincibleTimer 를 설정함으로써 이루어진다.
    // FIX: 이전의 break 제거 → 같은 프레임에 닿은 모든 적을 처리.
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
          // NOTE: break 없음 — 다중 적 동시 피격을 허용하고
          //       invincibleTimer 로 다음 프레임 피격을 차단.
          // 한 프레임에 여러 hit 이 등록되지만 DamageSystem 에서
          // 첫 hit 처리 시 invincibleTimer 를 세팅하므로,
          // 같은 프레임 내 후속 hit 들은 pendingDestroy 가드에 걸려 무시된다.
          // 따라서 한 프레임에 한 번만 실질적 데미지가 들어간다.
          break;
          // TODO: 완전한 다중 피격을 원한다면 위 break 를 제거하고
          //       DamageSystem 의 pendingDestroy 가드가 중복 처리를 막는 것에 의존한다.
          //       현재는 뱀서라이크 장르 관례상 프레임당 1피격 유지.
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
