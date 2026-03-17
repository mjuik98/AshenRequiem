/**
 * src/systems/combat/WeaponSystem.js  (리팩터링 버전)
 *
 * CHANGE(P2): if/else behaviorId 분기 → weaponBehaviorRegistry 위임
 *
 * Before:
 *   weapon.behaviorId === 'orbit' ? ... : weapon.behaviorId === 'areaBurst' ? ... : ...
 *   → 새 무기 패턴마다 이 파일을 수정해야 했음
 *
 * After:
 *   const fn = getWeaponBehavior(weapon.behaviorId);
 *   const fired = fn({ weapon, player, enemies, spawnQueue });
 *   → 새 무기는 behaviorBehaviors/ 파일 + registry 1줄 추가로 끝
 *
 * 기존 동작은 100% 보존 (targetProjectile/orbit/areaBurst 모두 동일 로직)
 */

import { getWeaponBehavior } from '../../behaviors/weaponBehaviorRegistry.js';

export const WeaponSystem = {
  update({ world: { player, enemies, deltaTime, spawnQueue } }) {
    if (!player?.isAlive) return;

    for (let i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i];

      weapon.currentCooldown -= deltaTime;
      if (weapon.currentCooldown > 0) continue;

      // 쿨다운 소비 (실패 시 아래에서 0으로 초기화)
      weapon.currentCooldown = weapon.cooldown;

      // behaviorId로 동작 함수 조회 후 실행
      const behaviorFn = getWeaponBehavior(weapon.behaviorId);
      const fired = behaviorFn({ weapon, player, enemies, spawnQueue });

      // 발동 실패 (적 없음 등) → 즉시 재시도를 위해 쿨다운 0으로 초기화
      if (!fired) {
        weapon.currentCooldown = 0;
      }
    }
  },
};
