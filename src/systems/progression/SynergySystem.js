/**
 * src/systems/progression/SynergySystem.js
 *
 * P0-③ 개선: SynergySystem 데이터 경로 안정화
 *
 * Before:
 *   applyAll(world, upgradeData) — upgradeData를 인자로 받아
 *   호출 측에서 undefined 전달 시 조용히 실패.
 *   SynergySystem이 외부 인자에 의존하는 불필요한 결합.
 *
 * After:
 *   synergyData.js를 이 파일 내부에서 직접 import.
 *   applyAll(world) 시그니처로 단순화.
 *   데이터 경로가 고정되므로 호출 측 실수 불가.
 *
 * 규칙(AGENTS.md §6.4):
 *   - 시너지는 매 적용 시 전체 조건을 재조사하고 완전 덮어씌우기(재계산).
 *   - SynergySystem.applyAll()은 UpgradeSystem.applyUpgrade() 적용 직후 호출.
 */

import { synergyData } from '../../data/synergyData.js';  // ← 직접 import (P0-③ 핵심)

// ── 내부 유틸 ──────────────────────────────────────────────────────────

/**
 * 플레이어가 requires 조건을 모두 충족하는지 확인.
 * @param {object}   player
 * @param {string[]} requires  업그레이드 ID 배열
 * @returns {boolean}
 */
function isConditionMet(player, requires) {
  if (!requires || requires.length === 0) return false;
  return requires.every(reqId => (player.upgradeCounts?.[reqId] ?? 0) > 0);
}

/**
 * 시너지 보너스를 플레이어에게 적용한다.
 * 재계산 방식이므로 기존 시너지 효과를 먼저 초기화 후 적용.
 * @param {object} player
 * @param {object} synergy
 */
function applySynergyBonus(player, synergy) {
  if (!synergy.bonus) return;

  const bonus = synergy.bonus;

  if (bonus.damageMultiplier) {
    player._synergyDamageBonus = (player._synergyDamageBonus ?? 1) * bonus.damageMultiplier;
  }
  if (bonus.speedMultiplier) {
    player._synergySeedBonus = (player._synergySeedBonus ?? 1) * bonus.speedMultiplier;
  }
  if (bonus.hpBonus) {
    player._synergyHpBonus = (player._synergyHpBonus ?? 0) + bonus.hpBonus;
  }
  // 추가 bonus 타입은 여기에 확장
}

// ── Public API ────────────────────────────────────────────────────────

export const SynergySystem = {
  /**
   * 플레이어의 업그레이드 조합을 전체 재조사하여 활성 시너지를 갱신한다.
   *
   * Before: applyAll(world, upgradeData) — 인자로 데이터 수신
   * After:  applyAll(world)              — 내부 import 사용
   *
   * @param {{ player: object }} world
   */
  applyAll({ player }) {
    if (!player) return;

    // 이전 시너지 효과 초기화 (재계산 원칙)
    player.activeSynergies    = [];
    player._synergyDamageBonus = 1;
    player._synergySeedBonus  = 1;
    player._synergyHpBonus    = 0;

    // 전체 시너지 재조사
    for (const synergy of synergyData) {
      if (isConditionMet(player, synergy.requires)) {
        player.activeSynergies.push(synergy.id);
        applySynergyBonus(player, synergy);
      }
    }
  },

  /**
   * Pipeline System 인터페이스용 update().
   * UpgradeSystem 이후 priority에 등록한다.
   * @param {{ world: object }} ctx
   */
  update({ world }) {
    this.applyAll(world);
  },
};
