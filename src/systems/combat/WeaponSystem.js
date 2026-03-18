/**
 * src/systems/combat/WeaponSystem.js
 *
 * FIX(BUG-WEAPON-EVENTS): behaviorFn 호출 시 events 미전달 버그 수정
 *
 *   Before (버그):
 *     const fired = behaviorFn({ weapon, player, enemies, spawnQueue });
 *
 *     chainLightning.js 시그니처:
 *       export function chainLightning({ weapon, player, enemies, spawnQueue, events }) { ... }
 *
 *     events가 undefined이면 chainLightning의 주 공격 경로(events.hits 직접 등록)를
 *     건너뛰고 무조건 areaBurst 투사체 스폰 폴백을 실행함.
 *     → chainLightning 데미지가 DamageSystem을 통해 처리되지 않음
 *     → chainLightning 피격 이펙트(hitFlash, 넉백 등) 전혀 발생 안 함
 *     → 침묵 버그: 플레이가 겉으로 작동하는 것처럼 보이지만
 *                  실제로는 올바른 피해 경로가 실행되지 않음
 *
 *   After (수정):
 *     const fired = behaviorFn({ weapon, player, enemies, spawnQueue, events });
 *
 *     world를 구조분해할당에서 events도 함께 추출하여 전달.
 *     chainLightning은 events.hits가 존재하면 즉발 hit 등록 → DamageSystem 처리.
 *
 *   AGENTS.md §6.3:
 *     발동 함수 시그니처: ({ weapon, player, enemies, spawnQueue, events? }) => boolean
 *     → events?는 선택적이지만 WeaponSystem에서 항상 전달해야 함
 *
 * CHANGE(P2): if/else behaviorId 분기 → weaponBehaviorRegistry 위임 (기존 유지)
 */

import { getWeaponBehavior } from '../../behaviors/weaponBehaviorRegistry.js';

export const WeaponSystem = {
  // FIX: world 구조분해에 events 추가
  update({ world: { player, enemies, deltaTime, spawnQueue, events } }) {
    if (!player?.isAlive) return;

    for (let i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i];

      weapon.currentCooldown -= deltaTime;
      if (weapon.currentCooldown > 0) continue;

      // 쿨다운 소비 (실패 시 아래에서 0으로 초기화)
      weapon.currentCooldown = weapon.cooldown;

      // behaviorId로 동작 함수 조회 후 실행
      // FIX: events 전달 추가 → chainLightning이 events.hits 경로 사용 가능
      const behaviorFn = getWeaponBehavior(weapon.behaviorId);
      const fired = behaviorFn({ weapon, player, enemies, spawnQueue, events });

      // 발동 실패 (적 없음 등) → 즉시 재시도를 위해 쿨다운 0으로 초기화
      if (!fired) {
        weapon.currentCooldown = 0;
      }
    }
  },
};
