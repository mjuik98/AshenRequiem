/**
 * src/behaviors/weaponBehaviors/boomerangWeapon.js
 *
 * 부메랑 — 플레이어로부터 가장 가까운 적 방향으로 발사,
 *           maxRange/2 도달 후 방향을 반전해 플레이어 쪽으로 귀환하는 투사체.
 *
 * CHANGE(P2-C): 완료된 to-do 주석 제거
 *   ProjectileSystem.js에 boomerang 이동 분기가 이미 구현 완료됨.
 *   잔류하던 "추가해야 할 코드" 가이드 주석 삭제.
 *
 * 투사체 이동/귀환 로직: src/systems/combat/ProjectileSystem.js 참조
 * weaponData.js 항목: { id: 'boomerang', behaviorId: 'boomerang', ... }
 */
import { getLiveEnemies, findClosestEnemy, buildTargetedDirections, getProjectileLifetimeMult } from './weaponBehaviorUtils.js';
import { AIM_PATTERN } from '../../data/constants/aiming.js';
import { spawnProjectile } from '../../domain/play/state/spawnRequest.js';

/**
 * boomerang — 가장 가까운 적 방향으로 부메랑 투사체 발사
 *
 * @param {{ weapon: object, player: object, enemies: object[], spawnQueue: object[] }} ctx
 * @returns {boolean}  발동 성공 여부
 */
export function boomerang({ weapon, player, enemies, spawnQueue }) {
  const alive   = getLiveEnemies(enemies);
  if (alive.length === 0) return false;

  const range   = weapon.range ?? 500;
  const nearest = findClosestEnemy(player, alive, range);
  if (!nearest) return false;

  const bonus = player?.bonusProjectileCount ?? 0;
  const count = (weapon.projectileCount ?? 1) + Math.floor(bonus);
  const defaultAimSpread = 0.2;
  const lifetimeMult = getProjectileLifetimeMult(player);
  const maxRange = (weapon.maxRange ?? 600) * lifetimeMult;
  const directions = buildTargetedDirections(weapon, player, nearest, count, defaultAimSpread);

  for (let i = 0; i < count; i++) {
    const direction = directions[i];

    spawnQueue.push(spawnProjectile({
      x: player.x,
      y: player.y,
      config: {
        x:                player.x,
        y:                player.y,
        dirX:             direction.x,
        dirY:             direction.y,
        angle:            Math.atan2(direction.y, direction.x),
        speed:            weapon.projectileSpeed ?? weapon.speed ?? 280,
        damage:           weapon.damage          ?? 8,
        radius:           weapon.radius          ?? 10,
        color:            weapon.projectileColor ?? weapon.color ?? '#ffd54f',
        pierce:           weapon.pierce          ?? 3,
        aimPattern:       weapon.aimPattern ?? AIM_PATTERN.GUARANTEED_HIT,
        aimSpread:        weapon.aimSpread ?? defaultAimSpread,
        maxRange,
        behaviorId:       'boomerang',
        ownerId:          player.id,
        _reversed:        false,
        distanceTraveled: 0,
      },
    }));
  }

  return true;
}
