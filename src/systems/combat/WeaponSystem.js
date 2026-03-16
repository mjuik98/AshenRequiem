import { distanceSq, normalize, sub } from '../../math/Vector2.js';

/**
 * WeaponSystem — 무기 쿨다운 관리 + 공격 생성 요청
 *
 * FIX(bug): targetProjectile 타깃 없을 때 continue (쿨다운 건드리지 않음).
 * FIX(bug): areaBurst maxLifetime → weapon.burstDuration ?? 0.3.
 * FIX(perf): console.log('[WeaponSystem] Firing at target:...) 제거.
 *   이전: 매 발사마다 console.log → 후반 고밀도 시 실질적인 성능 저하 유발.
 *   이후: 완전 제거.
 * BAL: orbit lifetime 계수 0.97 → 1.02 (오브 교체 공백 제거).
 */
export const WeaponSystem = {
  update({ player, enemies, deltaTime, spawnQueue }) {
    if (!player || !player.isAlive) return;

    for (let i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i];

      weapon.currentCooldown -= deltaTime;
      if (weapon.currentCooldown > 0) continue;
      weapon.currentCooldown = weapon.cooldown;

      // ── orbit ──────────────────────────────────────────────
      if (weapon.behaviorId === 'orbit') {
        const count = weapon.orbitCount || 3;
        // BAL: 0.97 → 1.02 (오브 전환 공백 제거)
        const lifetime = weapon.cooldown * 1.02;

        for (let o = 0; o < count; o++) {
          const angle = (o / count) * Math.PI * 2;
          spawnQueue.push({
            type: 'projectile',
            config: {
              x: player.x + Math.cos(angle) * (weapon.orbitRadius || 72),
              y: player.y + Math.sin(angle) * (weapon.orbitRadius || 72),
              dirX: 0, dirY: 0, speed: 0,
              damage: weapon.damage,
              radius: weapon.radius || 9,
              color: weapon.projectileColor,
              pierce: weapon.pierce || 999,
              maxRange: 0,
              behaviorId: 'orbit',
              maxLifetime: lifetime,
              ownerId: player.id,
              statusEffectId:     weapon.statusEffectId    ?? null,
              statusEffectChance: weapon.statusEffectChance ?? 1.0,
              orbitAngle:  angle,
              orbitRadius: weapon.orbitRadius || 72,
              orbitSpeed:  weapon.orbitSpeed  || 2.8,
            },
          });
        }

      // ── areaBurst ──────────────────────────────────────────
      } else if (weapon.behaviorId === 'areaBurst') {
        spawnQueue.push({
          type: 'projectile',
          config: {
            x: player.x, y: player.y,
            dirX: 0, dirY: 0, speed: 0,
            damage: weapon.damage,
            radius: weapon.radius,
            color: weapon.projectileColor,
            pierce: weapon.pierce,
            maxRange: 0,
            behaviorId: 'areaBurst',
            // FIX: 하드코딩 0.3 → weapon.burstDuration 참조
            maxLifetime: weapon.burstDuration ?? 0.3,
            ownerId: player.id,
            statusEffectId:     weapon.statusEffectId    ?? null,
            statusEffectChance: weapon.statusEffectChance ?? 1.0,
          },
        });

      // ── targetProjectile (멀티샷 지원) ─────────────────────
      } else {
        const target = this._findClosestEnemy(player, enemies, weapon.range);
        // FIX: 타깃 없을 때 currentCooldown 건드리지 않고 continue
        if (!target) continue;

        // FIX(perf): console.log 제거 (매 발사마다 호출되어 성능 저하)
        const dir    = normalize(sub({ x: target.x, y: target.y }, { x: player.x, y: player.y }));
        const count  = weapon.projectileCount || 1;
        const spread = Math.PI / 14; // ~12.8도

        for (let p = 0; p < count; p++) {
          const offset = (p - (count - 1) / 2) * spread;
          const cos = Math.cos(offset), sin = Math.sin(offset);
          spawnQueue.push({
            type: 'projectile',
            config: {
              x: player.x, y: player.y,
              dirX: dir.x * cos - dir.y * sin,
              dirY: dir.x * sin + dir.y * cos,
              speed: weapon.projectileSpeed,
              damage: weapon.damage,
              radius: weapon.radius || 5,
              color: weapon.projectileColor,
              pierce: weapon.pierce,
              maxRange: weapon.range,
              behaviorId: 'targetProjectile',
              ownerId: player.id,
              statusEffectId:     weapon.statusEffectId    ?? null,
              statusEffectChance: weapon.statusEffectChance ?? 1.0,
            },
          });
        }
      }
    }
  },

  /** 범위 내 가장 가까운 적 찾기 */
  _findClosestEnemy(player, enemies, range) {
    let closest = null, closestDistSq = range * range;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      const dSq = distanceSq(player, e);
      if (dSq < closestDistSq) { closestDistSq = dSq; closest = e; }
    }
    return closest;
  },
};
