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
import { getLiveEnemies, findClosestEnemy } from './weaponBehaviorUtils.js';

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

  const dx  = nearest.x - player.x;
  const dy  = nearest.y - player.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // 보너스 투사체 반영을 위해 spawnDirectionalProjectiles 패턴 사용
  // 단, boomerang은 고유 config가 있으므로 직접 루프 구현
  const bonus = player?.bonusProjectileCount ?? 0;
  const count = 1 + Math.floor(bonus);
  const spread = 0.2; // 약 11.5도

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spread;
    const cos = Math.cos(offset);
    const sin = Math.sin(offset);

    // 기본 방향 벡터 (dirX, dirY)를 offset만큼 회전
    const rx = (dx / len) * cos - (dy / len) * sin;
    const ry = (dx / len) * sin + (dy / len) * cos;

    spawnQueue.push({
      type: 'projectile',
      config: {
        x:                player.x,
        y:                player.y,
        dirX:             rx,
        dirY:             ry,
        speed:            weapon.projectileSpeed ?? weapon.speed ?? 280,
        damage:           weapon.damage          ?? 8,
        radius:           weapon.radius          ?? 10,
        color:            weapon.projectileColor ?? weapon.color ?? '#ffd54f',
        pierce:           weapon.pierce          ?? 3,
        maxRange:         weapon.maxRange        ?? 600,
        behaviorId:       'boomerang',
        ownerId:          player.id,
        _reversed:        false,
        distanceTraveled: 0,
      },
    });
  }

  return true;
}
