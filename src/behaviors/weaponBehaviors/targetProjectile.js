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
 *
 * REFACTOR: 로컬 findClosestEnemy() 제거 → weaponBehaviorUtils 공유 함수 사용
 *   Before: 이 파일에 areaBurst.js와 동일한 findClosestEnemy() 로컬 복사 존재
 *   After:  weaponBehaviorUtils.findClosestEnemy import 한 줄로 대체
 */

import { normalize, sub }    from '../../math/Vector2.js';
import { findClosestEnemy }  from './weaponBehaviorUtils.js';

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
