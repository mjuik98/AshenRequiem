import { distanceSq } from '../../math/Vector2.js';

/**
 * CollisionSystem — 충돌 판정
 *
 * 입력: player, enemies, projectiles, pickups
 * 쓰기: 직접 HP 수정 금지
 * 출력: events.hits, events.pickupCollected
 */
export const CollisionSystem = {
  update({ player, enemies, projectiles, pickups, events }) {
    if (!player || !player.isAlive) return;

    // 1) 투사체 vs 적
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;

      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (!e.isAlive || e.pendingDestroy) continue;

        // 이미 타격한 적은 건너뜀 (관통 무기)
        if (p.hitTargets.includes(e.id)) continue;

        const rSum = p.radius + e.radius;
        if (distanceSq(p, e) <= rSum * rSum) {
          events.hits.push({
            attackerId: p.ownerId,
            targetId: e.id,
            target: e,
            damage: p.damage,
            projectileId: p.id,
            projectile: p,
          });

          p.hitTargets.push(e.id);
          p.hitCount++;
        }
      }
    }

    // 2) 적 vs 플레이어 (접촉 데미지)
    if (player.invincibleTimer <= 0) {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.isAlive || e.pendingDestroy) continue;

        const rSum = player.radius + e.radius;
        if (distanceSq(player, e) <= rSum * rSum) {
          events.hits.push({
            attackerId: e.id,
            targetId: player.id,
            target: player,
            damage: e.damage,
            projectileId: null,
            projectile: null,
          });
          // 한 프레임에 한 번만 피격
          break;
        }
      }
    }

    // 3) 플레이어 vs 픽업
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;

      const rSum = player.radius + pk.radius;
      if (distanceSq(player, pk) <= rSum * rSum) {
        events.pickupCollected.push({
          pickupId: pk.id,
          pickup: pk,
          playerId: player.id,
        });
        pk.isAlive = false;
        pk.pendingDestroy = true;
      }
    }
  },
};
