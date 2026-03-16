import { distanceSq, normalize, sub } from '../../math/Vector2.js';

/**
 * WeaponSystem — 무기 쿨다운 관리 + 공격 생성 요청
 *
 * FIX(bug): areaBurst — 타겟 탐색을 spawnQueue push 이전으로 이동.
 *   이전: areaBurst 투사체를 먼저 push → 타겟 없으면 쿨다운 0 리셋.
 *         타겟 없는 프레임마다 areaBurst 폭발이 연속 발생하고 쿨다운이 0으로 유지됨.
 *   이후: 타겟 탐색 먼저 → 타겟 없으면 쿨다운 0 후 continue (areaBurst push 없음).
 *         areaBurst + targetProjectile 복합 패턴도 타겟 확인 후 양쪽 모두 push.
 *
 * REF(refactor): areaBurst 복합 패턴에 주석 추가.
 *   holy_aura, frost_nova: areaBurst(범위 폭발) + targetProjectile(유도탄) 동시 발사.
 *   weaponData에 projectileCount 가 설정된 경우에만 targetProjectile push.
 *
 * FIX(bug): targetProjectile 타깃 없을 때 continue (쿨다운 건드리지 않음).
 * FIX(bug): areaBurst maxLifetime → weapon.burstDuration ?? 0.3.
 * FIX(perf): console.log 제거.
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
      // FIX(bug): 타겟 탐색을 areaBurst push 이전으로 이동.
      //   areaBurst 단독 무기(holy_aura, frost_nova): 범위 내 적이 있을 때만 발동.
      //   areaBurst + targetProjectile 복합 패턴도 타겟 확인 후 양쪽 push.
      } else if (weapon.behaviorId === 'areaBurst') {
        // 타겟 탐색 먼저
        const target = this._findClosestEnemy(player, enemies, weapon.range);

        // 범위 내 적 없으면 다음 프레임 즉시 재시도 (areaBurst push 없음)
        if (!target) {
          weapon.currentCooldown = 0;
          continue;
        }

        // 타겟이 있을 때만 areaBurst 투사체 push
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

        // REF: areaBurst + targetProjectile 복합 패턴
        //   weaponData에 projectileCount 가 정의된 경우에만 유도탄 추가 발사.
        //   (holy_aura, frost_nova 등 areaBurst 단독 무기는 projectileCount 미정의)
        if (weapon.projectileCount && weapon.projectileCount > 0) {
          const dir   = normalize(sub({ x: target.x, y: target.y }, { x: player.x, y: player.y }));
          const count = weapon.projectileCount;
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

      // ── targetProjectile ───────────────────────────────────
      } else {
        const target = this._findClosestEnemy(player, enemies, weapon.range);
        if (!target) continue; // 쿨다운 유지 (다음 tick에 다시 시도)

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
