/**
 * src/behaviors/weaponBehaviorRegistry.js
 *
 * CHANGE(P0-①): getRegisteredBehaviorIds() 추가
 *   - validateData.js가 KNOWN_WEAPON_BEHAVIORS를 하드코딩하지 않고
 *     이 함수를 import해 자동 동기화하도록 변경.
 *
 * CHANGE(P-⑭): boomerang, chainLightning 2종 추가
 *   Before: targetProjectile, orbit, areaBurst 3종
 *   After:  + boomerang, chainLightning (registry 2줄 추가)
 */

import { targetProjectile } from './weaponBehaviors/targetProjectile.js';
import { orbit }            from './weaponBehaviors/orbit.js';
import { areaBurst }        from './weaponBehaviors/areaBurst.js';
import { boomerang }        from './weaponBehaviors/boomerangWeapon.js';
import { chainLightning }   from './weaponBehaviors/chainLightning.js';
import { omnidirectional } from './weaponBehaviors/omnidirectional.js';
import { laserBeam } from './weaponBehaviors/laserBeam.js';
import { groundZone } from './weaponBehaviors/groundZone.js';
import { ricochetProjectile } from './weaponBehaviors/ricochetProjectile.js';

/** @type {Map<string, Function>} */
export const weaponBehaviorRegistry = new Map([
  ['targetProjectile', targetProjectile],
  ['orbit',            orbit],
  ['areaBurst',        areaBurst],
  ['boomerang',        boomerang],
  ['chainLightning',   chainLightning],
  ['omnidirectional',  omnidirectional],
  ['laserBeam',        laserBeam],
  ['groundZone',       groundZone],
  ['ricochetProjectile', ricochetProjectile],
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

/**
 * 현재 등록된 모든 behaviorId 목록을 반환한다.
 * validateData.js가 import해 하드코딩 없이 자동 동기화한다.
 *
 * @returns {Set<string>}
 */
export function getRegisteredBehaviorIds() {
  return new Set(weaponBehaviorRegistry.keys());
}
