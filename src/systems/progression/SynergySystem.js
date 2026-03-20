/**
 * src/systems/progression/SynergySystem.js
 *
 * REFACTOR (P1): player 엔티티 오염 제거 → world.synergyState 사용
 */

import { createSynergyState, resetSynergyState } from '../../state/createSynergyState.js';

// ─── 내부 헬퍼 ───────────────────────────────────────────────────────────────

/**
 * 시너지 requires 조건 충족 여부 확인.
 */
function isConditionMet(player, requires) {
  if (!requires || requires.length === 0) return false;
  return requires.every(reqId =>
    (player.upgradeCounts?.[reqId] ?? 0) > 0 ||
    player.weapons?.some(w => w.id === reqId)
  );
}

/**
 * SynergySystem 인스턴스를 생성한다.
 * AGENTS.md R-series 설계 원칙에 따라 싱글턴 대신 팩토리 패턴을 사용한다.
 * 
 * @returns {{ update: Function, applyAll: Function, _rollback: Function, _apply: Function }}
 */
export function createSynergySystem() {
  return {
    update({ world, data }) {
      if (!world?.player || !data?.synergyData) return;

      const synergyState = world.synergyState ?? createSynergyState();
      this.applyAll({ player: world.player, synergyData: data.synergyData, synergyState });
    },

    /**
     * 시너지 조건을 재검사하고 보너스를 완전 재계산한다.
     * 멱등성 보장: 반복 호출해도 동일한 결과 (역산 후 재적용).
     */
    applyAll({ player, synergyData, synergyState }) {
      if (!player || !synergyData) return;

      const state = synergyState ?? createSynergyState();

      // 1. 이전 시너지 효과 역산
      this._rollback(player, state);

      // 2. 상태 초기화
      resetSynergyState(state);

      // 3. 조건 검사 및 누적 계산
      for (const synergy of synergyData) {
        if (!isConditionMet(player, synergy.requires)) continue;

        state.activeSynergies.push(synergy.id);

        const bonus = synergy.bonus;
        if (!bonus) continue;

        if (bonus.speedMult) {
          state.appliedSpeedMult *= bonus.speedMult;
        }
        if (bonus.lifestealDelta) {
          state.appliedLifesteal += bonus.lifestealDelta;
        }
        if (bonus.weaponId) {
          const wb = state.appliedWeaponBonuses[bonus.weaponId] ?? {
            damageDelta: 0, pierceDelta: 0, cooldownMult: 1, orbitDelta: 0,
          };
          if (bonus.damageDelta)      wb.damageDelta    += bonus.damageDelta;
          if (bonus.pierceDelta)      wb.pierceDelta    += bonus.pierceDelta;
          if (bonus.cooldownMult)     wb.cooldownMult   *= bonus.cooldownMult;
          if (bonus.orbitRadiusDelta) wb.orbitDelta     += bonus.orbitRadiusDelta;
          state.appliedWeaponBonuses[bonus.weaponId] = wb;
        }
      }

      // 4. 최종 보너스 적용
      this._apply(player, state);

      // player.activeSynergies 동기화 (HUD / UI 참조용)
      player.activeSynergies = [...state.activeSynergies];
    },

    _rollback(player, state) {
      if (state.appliedSpeedMult !== 1 && player.moveSpeed) {
        player.moveSpeed = Math.round(player.moveSpeed / state.appliedSpeedMult);
      }
      if (state.appliedLifesteal !== 0) {
        player.lifesteal = Math.max(0, (player.lifesteal ?? 0) - state.appliedLifesteal);
      }
      for (const [weaponId, bonuses] of Object.entries(state.appliedWeaponBonuses)) {
        const weapon = player.weapons?.find(w => w.id === weaponId);
        if (!weapon) continue;
        if (bonuses.damageDelta)   weapon.damage -= bonuses.damageDelta;
        if (bonuses.pierceDelta && weapon.pierce !== undefined)
          weapon.pierce -= bonuses.pierceDelta;
        if (bonuses.cooldownMult !== 1)
          weapon.cooldown = weapon.cooldown / bonuses.cooldownMult;
        if (bonuses.orbitDelta && weapon.orbitRadius !== undefined)
          weapon.orbitRadius -= bonuses.orbitDelta;
      }
    },

    _apply(player, state) {
      if (state.appliedSpeedMult !== 1) {
        player.moveSpeed = Math.round((player.moveSpeed ?? 200) * state.appliedSpeedMult);
      }
      if (state.appliedLifesteal !== 0) {
        player.lifesteal = (player.lifesteal ?? 0) + state.appliedLifesteal;
      }
      for (const [weaponId, bonuses] of Object.entries(state.appliedWeaponBonuses)) {
        const weapon = player.weapons?.find(w => w.id === weaponId);
        if (!weapon) continue;
        if (bonuses.damageDelta)
          weapon.damage = (weapon.damage ?? 1) + bonuses.damageDelta;
        if (bonuses.pierceDelta && weapon.pierce !== undefined)
          weapon.pierce += bonuses.pierceDelta;
        if (bonuses.cooldownMult !== 1)
          weapon.cooldown = Math.max(0.1, (weapon.cooldown ?? 1) * bonuses.cooldownMult);
        if (bonuses.orbitDelta && weapon.orbitRadius !== undefined)
          weapon.orbitRadius += bonuses.orbitDelta;
      }
    },
  };
}

/** 
 * SynergySystem 싱글턴 인스턴스 (정적 유틸리티 및 호환성용)
 * AGENTS.md R-series 준수를 위해 PipelineBuilder에서는 createSynergySystem()을 사용한다.
 */
export const SynergySystem = createSynergySystem();
