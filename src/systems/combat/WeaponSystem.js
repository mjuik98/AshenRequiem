import { distanceSq, normalize, sub } from '../../math/Vector2.js';

/**
 * WeaponSystem — 무기 쿨다운 관리 + 공격 생성 요청
 *
 * 입력: player, enemies, deltaTime, spawnQueue
 * 읽기: 적 목록, 쿨다운, 무기 데이터
 * 쓰기: 무기 내부 상태 (currentCooldown)
 * 출력: spawnQueue에 투사체 생성 요청
 */
export const WeaponSystem = {
  update({ player, enemies, deltaTime, spawnQueue }) {
    if (!player || !player.isAlive) return;

    for (let i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i];

      // 쿨다운 감소
      weapon.currentCooldown -= deltaTime;
      if (weapon.currentCooldown > 0) continue;

      // 쿨다운 리셋
      weapon.currentCooldown = weapon.cooldown;

      if (weapon.behaviorId === 'areaBurst') {
        // 범위 공격: 플레이어 위치에 areaBurst 투사체 생성
        spawnQueue.push({
          type: 'projectile',
          config: {
            x: player.x,
            y: player.y,
            dirX: 0,
            dirY: 0,
            speed: 0,
            damage: weapon.damage,
            radius: weapon.radius,
            color: weapon.projectileColor,
            pierce: weapon.pierce,
            maxRange: 0,
            behaviorId: 'areaBurst',
            maxLifetime: 0.3,
            ownerId: player.id,
            statusEffectId: weapon.statusEffectId || null,
            statusEffectChance: weapon.statusEffectChance ?? 1.0,
          },
        });
      } else {
        // targetProjectile: 가장 가까운 적을 향해 발사
        const target = this._findClosestEnemy(player, enemies, weapon.range);
        if (!target) {
          // 적이 없으면 쿨다운을 복구해 대기
          weapon.currentCooldown = 0.1;
          continue;
        }

        const dir = normalize(sub(
          { x: target.x, y: target.y },
          { x: player.x, y: player.y },
        ));

        spawnQueue.push({
          type: 'projectile',
          config: {
            x: player.x,
            y: player.y,
            dirX: dir.x,
            dirY: dir.y,
            speed: weapon.projectileSpeed,
            damage: weapon.damage,
            radius: weapon.radius || 5,
            color: weapon.projectileColor,
            pierce: weapon.pierce,
            maxRange: weapon.range,
            behaviorId: 'targetProjectile',
            ownerId: player.id,
            statusEffectId: weapon.statusEffectId || null,
            statusEffectChance: weapon.statusEffectChance ?? 1.0,
          },
        });
      }
    }
  },

  /** 범위 내 가장 가까운 적 찾기 */
  _findClosestEnemy(player, enemies, range) {
    let closest = null;
    let closestDistSq = range * range;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      const dSq = distanceSq(player, e);
      if (dSq < closestDistSq) {
        closestDistSq = dSq;
        closest = e;
      }
    }

    return closest;
  },
};
