/**
 * src/systems/combat/WeaponSystem.js
 *
 * FIX(BUG-WEAPON-EVENTS): behaviorFn 호출 시 events 미전달 버그 수정 (기존 유지)
 *
 * CHANGE (Phase 4): 플레이어 능력치 배율을 무기 발동 시 반영
 *
 *   cooldownMult (기본 1.0, 낮을수록 빠름):
 *     weapon.currentCooldown = weapon.cooldown * player.cooldownMult
 *
 *   projectileSpeedMult / projectileSizeMult:
 *     각 무기 behavior 함수에 effectiveWeapon을 전달해 투사체 생성 시 반영.
 *     원본 weapon 객체는 수정하지 않는다 (불변성 유지).
 *
 *   적용 범위:
 *     - projectileSpeed / speed : projSpeedMult 곱연산
 *     - radius                  : projSizeMult  곱연산
 *     - 사거리(range), orbitRadius는 의도적으로 스케일하지 않음
 *       (range = 타게팅 범위, orbitRadius = 궤도 반지름으로 별도 관리)
 */

import { getWeaponBehavior } from '../../behaviors/weaponBehaviorRegistry.js';

export const WeaponSystem = {
  // FIX: world 구조분해에 events 추가
  update({ world: { player, enemies, deltaTime, spawnQueue, events } }) {
    if (!player?.isAlive) return;

    // 플레이어 배율 캐싱 (매 프레임 반복 접근 최적화)
    const cooldownMult    = player.cooldownMult        ?? 1.0;
    const projSpeedMult   = player.projectileSpeedMult ?? 1.0;
    const projSizeMult    = player.projectileSizeMult  ?? 1.0;

    // 배율이 기본값과 다른지 사전 확인 (불필요한 객체 생성 방지)
    const needEffective   = projSpeedMult !== 1.0 || projSizeMult !== 1.0;

    for (let i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i];

      weapon.currentCooldown -= deltaTime;
      if (weapon.currentCooldown > 0) continue;

      // cooldownMult 반영: 낮을수록 다음 발동까지의 대기 시간이 짧아짐
      weapon.currentCooldown = weapon.cooldown * cooldownMult;

      // projSpeedMult / projSizeMult를 반영한 임시 무기 객체 생성
      // 원본 weapon은 수정하지 않음 — behaviorFn이 spawnQueue에 config를 넣고,
      // 실제 투사체 생성은 FlushSystem이 담당하므로 스프레드 비용은 1회뿐
      const effectiveWeapon = needEffective
        ? _makeEffectiveWeapon(weapon, projSpeedMult, projSizeMult)
        : weapon;

      // behaviorId로 동작 함수 조회 후 실행
      // FIX: events 전달 → chainLightning이 events.hits 경로 사용 가능
      const behaviorFn = getWeaponBehavior(weapon.behaviorId);
      const fired = behaviorFn({
        weapon: effectiveWeapon,
        player,
        enemies,
        spawnQueue,
        events,
      });

      // 발동 실패 (적 없음 등) → 즉시 재시도를 위해 쿨다운 0으로 초기화
      if (!fired) {
        weapon.currentCooldown = 0;
      }
    }
  },
};

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────────────

/**
 * 플레이어 능력치 배율이 반영된 임시 무기 객체를 생성한다.
 * 원본 weapon은 절대 수정하지 않는다.
 *
 * 스케일 대상:
 *   projectileSpeed : projSpeedMult 곱 (weaponBehaviorUtils의 speed 기본값 소스)
 *   speed           : projSpeedMult 곱 (boomerang 등 일부 weapon의 fallback)
 *   radius          : projSizeMult  곱 (투사체 충돌 반지름 및 areaBurst 범위)
 *
 * 스케일 제외:
 *   range       : 타게팅 사거리 — 능력치로 변경하지 않음
 *   orbitRadius : 궤도 반지름  — up_holy_aura orbitRadiusDelta로 별도 관리
 *   cooldown    : WeaponSystem 레벨에서 이미 처리됨
 *
 * @param {object} weapon         원본 무기 객체
 * @param {number} projSpeedMult  투사체 속도 배율 (1.0 기본)
 * @param {number} projSizeMult   투사체 크기 배율 (1.0 기본)
 * @returns {object}              배율이 반영된 임시 무기 객체
 */
function _makeEffectiveWeapon(weapon, projSpeedMult, projSizeMult) {
  const eff = Object.assign(Object.create(null), weapon);

  // 투사체 속도
  if (projSpeedMult !== 1.0) {
    if (weapon.projectileSpeed != null) {
      eff.projectileSpeed = weapon.projectileSpeed * projSpeedMult;
    }
    if (weapon.speed != null) {
      eff.speed = weapon.speed * projSpeedMult;
    }
  }

  // 투사체 크기 (반지름)
  if (projSizeMult !== 1.0 && weapon.radius != null) {
    eff.radius = weapon.radius * projSizeMult;
  }

  return eff;
}

