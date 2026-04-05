/**
 * src/domain/play/state/createSynergyState.js — SynergySystem 추적 상태
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
    activeSynergies: [],
    appliedSpeedMult: 1,
    appliedLifesteal: 0,
    appliedWeaponBonuses: {},
  };
}

/**
 * synergyState를 초기값으로 리셋한다.
 *
 * @param {ReturnType<typeof createSynergyState>} state
 */
export function resetSynergyState(state) {
  state.activeSynergies.length = 0;
  state.appliedSpeedMult = 1;
  state.appliedLifesteal = 0;
  state.appliedWeaponBonuses = {};
}
