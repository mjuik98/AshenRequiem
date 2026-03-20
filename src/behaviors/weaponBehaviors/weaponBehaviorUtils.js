/**
 * src/behaviors/weaponBehaviors/weaponBehaviorUtils.js
 *
 * REFACTOR (R-16): getLiveEnemies re-export (entityUtils.js)
 */
import { distanceSq, normalize, sub } from '../../math/Vector2.js';
import { isDead, isLive, getLiveEnemies } from '../../utils/entityUtils.js';
import { spawnProjectile } from '../../state/spawnRequest.js';

export { getLiveEnemies };

// ─────────────────────────────────────────────────────────────────────
// 근접 적 탐색
// ─────────────────────────────────────────────────────────────────────

/**
 * 기준점(origin)으로부터 maxRange 이내에서 가장 가까운 살아있는 적 반환.
 *
 * @param {{x:number, y:number}} origin
 * @param {object[]}             enemies
 * @param {number}               maxRange
 * @returns {object|null}
 */
export function findClosestEnemy(origin, enemies, maxRange) {
  let closest   = null;
  let minDistSq = maxRange * maxRange;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (isDead(e)) continue;
    const dSq = distanceSq(origin, e);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      closest   = e;
    }
  }
  return closest;
}

/**
 * 기준점(origin)으로부터 maxRange 이내에서 가장 가까운 후보 반환.
 * visited Set으로 이미 선택된 적을 제외할 수 있어 chainLightning hop에 적합.
 *
 * @param {{x:number, y:number}} origin
 * @param {object[]}             candidates
 * @param {number}               maxRange
 * @param {Set<string>}          [visited]
 * @returns {object|null}
 */
export function findNearestFrom(origin, candidates, maxRange, visited) {
  let nearest   = null;
  let minDistSq = maxRange * maxRange;

  for (let i = 0; i < candidates.length; i++) {
    const e = candidates[i];
    if (isDead(e)) continue;
    if (visited?.has(e.id)) continue;
    const dSq = distanceSq(origin, e);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      nearest   = e;
    }
  }
  return nearest;
}

// ─────────────────────────────────────────────────────────────────────
// 확산 투사체 생성
// ─────────────────────────────────────────────────────────────────────

/**
 * target 방향으로 weapon.projectileCount 개의 확산 투사체를 spawnQueue에 추가한다.
 *
 * FIX(P2-7): spread 하드코딩 제거
 *   Before: const spread = Math.PI / 14;  // 약 12.8°, 무기별 조정 불가
 *   After:  const spread = weapon.spread ?? Math.PI / 14;
 *           → weaponData 에 spread 필드 추가로 무기별 확산각 제어 가능
 *           → 미정의 시 기존 기본값 유지 (하위 호환)
 *
 * weaponData 사용 예:
 *   { id: 'shotgun', spread: Math.PI / 6, projectileCount: 3, ... }  // 30° 확산
 *   { id: 'sniper',  spread: 0,           projectileCount: 1, ... }  // 0° 직선
 *
 * @param {object}   weapon
 * @param {object}   player
 * @param {object}   target      방향 기준 적 엔티티
 * @param {object[]} spawnQueue
 */
export function spawnDirectionalProjectiles(weapon, player, target, spawnQueue) {
  const dir    = normalize(sub(target, player));
  const count  = (weapon.projectileCount ?? 1) + (player?.bonusProjectileCount ?? 0);

  // FIX(P2-7): weapon.spread로 무기별 확산각 제어 가능
  // 기본값 Math.PI / 14 ≈ 12.8° (기존 동작 유지)
  const spread = weapon.spread ?? Math.PI / 14;

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spread;
    const cos = Math.cos(offset);
    const sin = Math.sin(offset);

    spawnQueue.push(spawnProjectile({
      weapon,
      x: player.x,
      y: player.y,
      config: {
        dirX:   dir.x * cos - dir.y * sin,
        dirY:   dir.x * sin + dir.y * cos,
        speed:              weapon.projectileSpeed ?? 350,
        damage:             weapon.damage,
        radius:             weapon.radius ?? 5,
        color:              weapon.projectileColor,
        pierce:             weapon.pierce ?? 1,
        hitCount:           0,
        maxRange:           weapon.range,
        behaviorId:         'targetProjectile',
        ownerId:            player.id,
        statusEffectId:     weapon.statusEffectId     ?? null,
        statusEffectChance: weapon.statusEffectChance ?? 1.0,
      },
    }));
  }
}
