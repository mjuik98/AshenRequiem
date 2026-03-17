/**
 * src/behaviors/weaponBehaviors/targetProjectile.js
 *
 * 역할:
 *   가장 가까운 적을 향해 투사체를 발사하는 무기 동작.
 *   단일 발사 및 다중 확산(projectileCount) 모두 처리.
 *
 * 계약:
 *   입력: { weapon, player, enemies, spawnQueue }
 *   출력: spawnQueue에 'projectile' 타입 요청 추가
 *   부수효과: 없음 (상태 직접 수정 금지)
 */

import { normalize, sub } from '../../math/Vector2.js';

/**
 * 플레이어에서 가장 가까운 살아있는 적 반환.
 * @param {{x:number, y:number}} player
 * @param {object[]} enemies
 * @param {number} range  최대 탐지 거리 (px)
 * @returns {object|null}
 */
function findClosestEnemy(player, enemies, range) {
  let closest  = null;
  let minDistSq = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.isAlive || e.pendingDestroy) continue;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDistSq) { minDistSq = dSq; closest = e; }
  }
  return closest;
}

/**
 * targetProjectile 무기 동작 실행.
 *
 * @param {{
 *   weapon:     object,
 *   player:     object,
 *   enemies:    object[],
 *   spawnQueue: object[],
 * }} ctx
 * @returns {boolean} 실제로 발사했으면 true, 대상 없으면 false
 */
export function targetProjectile({ weapon, player, enemies, spawnQueue }) {
  const target = findClosestEnemy(player, enemies, weapon.range);
  if (!target) return false;

  const dir    = normalize(sub(target, player));
  const count  = weapon.projectileCount ?? 1;
  const spread = Math.PI / 14;   // 약 12.8° 간격 (다중 발사 시 확산)

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spread;
    const cos = Math.cos(offset);
    const sin = Math.sin(offset);
    spawnQueue.push({
      type: 'projectile',
      config: {
        x: player.x,
        y: player.y,
        dirX:  dir.x * cos - dir.y * sin,
        dirY:  dir.x * sin + dir.y * cos,
        speed:      weapon.projectileSpeed ?? 350,
        damage:     weapon.damage,
        radius:     weapon.radius ?? 5,
        color:      weapon.projectileColor,
        pierce:     weapon.pierce ?? 1,
        maxRange:   weapon.range,
        behaviorId: 'targetProjectile',
        ownerId:    player.id,
        statusEffectId:     weapon.statusEffectId     ?? null,
        statusEffectChance: weapon.statusEffectChance ?? 1.0,
      },
    });
  }

  return true;
}
