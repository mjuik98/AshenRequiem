/**
 * src/behaviors/weaponBehaviorRegistry.js
 *
 * 역할:
 *   behaviorId → 실행 함수 매핑 레지스트리.
 *   WeaponSystem이 if/else 분기 없이 behaviorId만으로 동작을 실행할 수 있게 한다.
 *
 * 새 무기 패턴 추가 방법:
 *   1. src/behaviors/weaponBehaviors/myNewBehavior.js 파일 생성
 *   2. 이 파일에 import 추가
 *   3. registry.set('myNewBehavior', myNewBehavior) 한 줄 추가
 *   → WeaponSystem, weaponData 수정 불필요
 *
 * 동작 함수 계약:
 *   ({ weapon, player, enemies, spawnQueue }) => boolean
 *   - true:  발동 성공 → 쿨다운 정상 소비
 *   - false: 발동 실패 (예: 범위 내 적 없음) → WeaponSystem이 쿨다운을 0으로 초기화해 즉시 재시도
 */

import { targetProjectile } from './weaponBehaviors/targetProjectile.js';
import { orbit }            from './weaponBehaviors/orbit.js';
import { areaBurst }        from './weaponBehaviors/areaBurst.js';
import { boomerang }        from './weaponBehaviors/boomerang.js';
import { chainLightning }   from './weaponBehaviors/chainLightning.js';

/**
 * @type {Map<string, (ctx: {weapon:object, player:object, enemies:object[], spawnQueue:object[], events?:object}) => boolean>}
 */
export const weaponBehaviorRegistry = new Map([
  ['targetProjectile', targetProjectile],
  ['orbit',            orbit],
  ['areaBurst',        areaBurst],
  ['boomerang',        boomerang],
  ['chainLightning',   chainLightning],
]);

/**
 * behaviorId로 동작 함수를 조회한다.
 * 등록되지 않은 id는 targetProjectile 폴백.
 *
 * @param {string} behaviorId
 * @returns {Function}
 */
export function getWeaponBehavior(behaviorId) {
  const fn = weaponBehaviorRegistry.get(behaviorId);
  if (!fn) {
    console.warn(`[weaponBehaviorRegistry] 알 수 없는 behaviorId: "${behaviorId}" — targetProjectile로 폴백`);
    return targetProjectile;
  }
  return fn;
}
