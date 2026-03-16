import { distanceSq, normalize, sub } from '../../math/Vector2.js';

/**
 * WeaponSystem — 무기 쿨다운 관리 + 공격 생성 요청
 *
 * FIX(bug): areaBurst — 타겟 탐색을 spawnQueue push 이전으로 이동
 *   타겟 없으면 쿨다운 0 후 continue → 연속 발동 방지
 * FIX(bug): targetProjectile 타깃 없으면 쿨다운 유지 후 continue
 * BAL: orbit lifetime 계수 1.02 (공백 제거)
 */
export const WeaponSystem = {
  update({ player, enemies, deltaTime, spawnQueue }) {
    if (!player?.isAlive) return;

    for (let i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i];

      weapon.currentCooldown -= deltaTime;
      if (weapon.currentCooldown > 0) continue;
      weapon.currentCooldown = weapon.cooldown;

      // ── orbit ──────────────────────────────────────────────
      if (weapon.behaviorId === 'orbit') {
        const count    = weapon.orbitCount || 3;
        const lifetime = weapon.cooldown * 1.02; // BAL: 공백 방지

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
        // FIX(bug): 타겟 확인 먼저 — 없으면 areaBurst push 없이 즉시 재시도
        const target = this._findClosestEnemy(player, enemies, weapon.range);
        if (!target) { weapon.currentCooldown = 0; continue; }

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
            maxLifetime: weapon.burstDuration ?? 0.3,
            ownerId: player.id,
            statusEffectId:     weapon.statusEffectId    ?? null,
            statusEffectChance: weapon.statusEffectChance ?? 1.0,
          },
        });

        // areaBurst + targetProjectile 복합 패턴
        if (weapon.projectileCount && weapon.projectileCount > 0) {
          const dir    = normalize(sub(target, player));
          const count  = weapon.projectileCount;
          const spread = Math.PI / 14;
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

      // ── targetProjectile ───────────────────────────────────
      } else {
        const target = this._findClosestEnemy(player, enemies, weapon.range);
        if (!target) continue; // 쿨다운 유지

        const dir   = normalize(sub(target, player));
        const count = weapon.projectileCount || 1;
        const spread = Math.PI / 14;

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
