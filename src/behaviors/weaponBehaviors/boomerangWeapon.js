/**
 * src/behaviors/weaponBehaviors/boomerangWeapon.js
 *
 * 부메랑 — 플레이어로부터 가장 가까운 적 방향으로 발사,
 *           maxRange/2 도달 후 방향을 반전해 플레이어 쪽으로 귀환하는 투사체.
 *
 * ─── ProjectileSystem에 추가해야 할 boomerang 이동 분기 ────────────────
 *   } else if (p.behaviorId === 'boomerang') {
 *     const dist = p.speed * deltaTime;
 *     p.x += p.dirX * dist;
 *     p.y += p.dirY * dist;
 *     p.distanceTraveled = (p.distanceTraveled ?? 0) + dist;
 *
 *     // 절반 거리 도달 시 방향 반전
 *     if (!p._reversed && p.distanceTraveled >= p.maxRange / 2) {
 *       p.dirX *= -1;
 *       p.dirY *= -1;
 *       p._reversed = true;
 *     }
 *     // 왕복 완료 시 소멸
 *     if (p.distanceTraveled >= p.maxRange) {
 *       p.isAlive = false;
 *       p.pendingDestroy = true;
 *     }
 *   }
 * ──────────────────────────────────────────────────────────────────────
 *
 * REFACTOR: 인라인 getLiveEnemies 필터 + 근접 탐색 루프 제거
 *   Before:
 *     enemies.filter(e => e.isAlive && !e.pendingDestroy) 인라인 필터
 *     + Math.sqrt 기반 최소 거리 루프 인라인
 *   After:
 *     getLiveEnemies / findClosestEnemy (weaponBehaviorUtils) import로 대체
 *     → chainLightning.js / targetProjectile.js 와 동일 패턴 통일
 *
 * weaponData.js 항목 예시:
 *   {
 *     id: 'boomerang', name: '부메랑', behaviorId: 'boomerang',
 *     damage: 8, cooldown: 1.4, projectileSpeed: 280, range: 400,
 *     radius: 10, pierce: 3, maxRange: 600, projectileColor: '#ffd54f',
 *     maxLevel: 5,
 *   }
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

  // 방향 벡터 정규화
  const dx  = nearest.x - player.x;
  const dy  = nearest.y - player.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  spawnQueue.push({
    type: 'projectile',
    config: {
      x:                player.x,
      y:                player.y,
      dirX:             dx / len,
      dirY:             dy / len,
      speed:            weapon.projectileSpeed ?? weapon.speed ?? 280,
      damage:           weapon.damage          ?? 8,
      radius:           weapon.radius          ?? 10,
      color:            weapon.projectileColor ?? weapon.color ?? '#ffd54f',
      pierce:           weapon.pierce          ?? 3,
      maxRange:         weapon.maxRange        ?? 600,
      behaviorId:       'boomerang',
      ownerId:          player.id,
      // 부메랑 전용 상태 플래그 (ProjectileSystem에서 방향 반전 시 참조)
      _reversed:        false,
      distanceTraveled: 0,
    },
  });

  return true;
}
