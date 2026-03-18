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
 * ── 개선 이력 ──────────────────────────────────────────────────────
 * Before:
 *   spread 계산 + spawnQueue.push 루프를 이 파일에 직접 인라인.
 *   areaBurst.js 에 동일 루프가 복붙되어 중복 존재.
 *
 * After:
 *   spawnDirectionalProjectiles() 1줄 호출로 대체.
 *   루프·필드 관리는 weaponBehaviorUtils 한 곳에서만.
 * ──────────────────────────────────────────────────────────────────
 */

import { findClosestEnemy, spawnDirectionalProjectiles } from './weaponBehaviorUtils.js';

/**
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

  spawnDirectionalProjectiles(weapon, player, target, spawnQueue);
  return true;
}

