/**
 * src/state/createSynergyState.js — SynergySystem 추적 상태 (P1)
 *
 * REFACTOR: SynergySystem 롤백 상태를 player 엔티티에서 분리.
 */

/**
 * SynergySystem 추적 상태 초기값 생성.
 *
 * @returns {{
 *   activeSynergies:      string[],
 *   appliedSpeedMult:     number,
 *   appliedLifesteal:     number,
 *   appliedWeaponBonuses: Record<string, {
 *     damageDelta:  number,
 *     pierceDelta:  number,
 *     cooldownMult: number,
 *     orbitDelta:   number
 *   }>
 * }}
 */
export function createSynergyState() {
  return {
    /** 현재 활성화된 시너지 ID 목록 (UI 참조용) */
    activeSynergies: [],
    /** 직전 applyAll에서 player.moveSpeed에 곱한 배율 (역산용) */
    appliedSpeedMult: 1,
    /** 직전 applyAll에서 player.lifesteal에 더한 값 (역산용) */
    appliedLifesteal: 0,
    /**
     * 직전 applyAll에서 각 무기에 적용한 보너스 (역산용)
     * key: weaponId, value: 적용한 수치들
     */
    appliedWeaponBonuses: {},
  };
}

/**
 * synergyState를 초기값으로 리셋한다.
 * applyAll() 내부에서 재계산 전 상태 초기화에 사용.
 *
 * @param {ReturnType<typeof createSynergyState>} state
 */
export function resetSynergyState(state) {
  state.activeSynergies.length = 0;
  state.appliedSpeedMult       = 1;
  state.appliedLifesteal       = 0;
  state.appliedWeaponBonuses   = {};
}
