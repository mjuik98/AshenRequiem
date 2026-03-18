/**
 * src/behaviors/weaponBehaviors/weaponBehaviorUtils.js
 *
 * 무기 행동(weaponBehaviors/*.js)에서 공통으로 사용하는 유틸리티 함수 모음.
 *
 * ── 개선 이력 ──────────────────────────────────────────────────────
 * [기존] findClosestEnemy / findNearestFrom / getLiveEnemies 중앙화 완료.
 *
 * [추가 ⑤] spawnDirectionalProjectiles — 확산 투사체 spawnQueue push 로직 추출
 *   Before:
 *     targetProjectile.js 와 areaBurst.js 가 동일한 spread 계산 + spawnQueue.push 루프를
 *     각각 복붙해서 유지. 투사체 필드(statusEffectId 등) 추가 시 두 파일 수정 필요.
 *   After:
 *     spawnDirectionalProjectiles(weapon, player, target, spawnQueue) 로 추출.
 *     targetProjectile.js, areaBurst.js 는 이 함수 1줄 호출로 대체.
 * ──────────────────────────────────────────────────────────────────
 *
 * 공개 API:
 *   getLiveEnemies(enemies)
 *   findClosestEnemy(origin, enemies, maxRange)
 *   findNearestFrom(origin, candidates, maxRange, visited?)
 *   spawnDirectionalProjectiles(weapon, player, target, spawnQueue)  ← 신규
 */

import { distanceSq, normalize, sub } from '../../math/Vector2.js';

// ─────────────────────────────────────────────────────────────────────
// 적 목록 필터링
// ─────────────────────────────────────────────────────────────────────

/**
 * 살아있는 적 목록 반환 (pendingDestroy 제외).
 *
 * @param {object[]} enemies
 * @returns {object[]}
 */
export function getLiveEnemies(enemies) {
  return enemies.filter(e => e.isAlive && !e.pendingDestroy);
}

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
    if (!e.isAlive || e.pendingDestroy) continue;
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
// 확산 투사체 생성 — 신규 추출 (⑤)
// ─────────────────────────────────────────────────────────────────────

/**
 * target 방향으로 weapon.projectileCount 개의 확산 투사체를 spawnQueue에 추가한다.
 *
 * ── 추출 배경 ──────────────────────────────────────────────────────
 * Before:
 *   targetProjectile.js 와 areaBurst.js 가 동일한 spread 계산 + push 루프 복붙.
 *   const dir = normalize(sub(target, player));
 *   for (let i = 0; i < count; i++) {
 *     const offset = (i - (count-1)/2) * spread;
 *     ... spawnQueue.push({ type:'projectile', config:{ ... } });
 *   }
 *   → statusEffectId 등 필드 추가 시 두 파일 모두 수정 필요.
 *
 * After:
 *   이 함수 1줄 호출로 대체. 필드 변경은 이 함수 안에서만.
 * ──────────────────────────────────────────────────────────────────
 *
 * @param {object}   weapon
 * @param {object}   player
 * @param {object}   target      방향 기준 적 엔티티
 * @param {object[]} spawnQueue
 */
export function spawnDirectionalProjectiles(weapon, player, target, spawnQueue) {
  const dir    = normalize(sub(target, player));
  const count  = weapon.projectileCount ?? 1;
  const spread = Math.PI / 14;  // ~12.8° 간격

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spread;
    const cos = Math.cos(offset);
    const sin = Math.sin(offset);

    spawnQueue.push({
      type: 'projectile',
      config: {
        x:      player.x,
        y:      player.y,
        dirX:   dir.x * cos - dir.y * sin,
        dirY:   dir.x * sin + dir.y * cos,
        speed:              weapon.projectileSpeed ?? 350,
        damage:             weapon.damage,
        radius:             weapon.radius ?? 5,
        color:              weapon.projectileColor,
        pierce:             weapon.pierce ?? 1,
        maxRange:           weapon.range,
        behaviorId:         'targetProjectile',
        ownerId:            player.id,
        statusEffectId:     weapon.statusEffectId     ?? null,
        statusEffectChance: weapon.statusEffectChance ?? 1.0,
      },
    });
  }
}
