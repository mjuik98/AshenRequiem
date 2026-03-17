/**
 * src/systems/progression/SynergySystem.js
 *
 * CHANGE(P0-②): synergyData.js 단일 경로 참조로 통일
 *   Before: applyAll({ player, upgradeData }) — upgradeData의 requires 필드를 읽음
 *           → synergyData.js가 사실상 미활용, AGENTS.md 6.4 규칙과 불일치
 *   After:  applyAll({ player }) — synergyData를 직접 import
 *           → 시너지 추가/수정은 synergyData.js 1파일에서만 수행
 *
 * 사용 방법:
 *   // PlayScene._showLevelUpUI 콜백, 또는 PlayContext services에서 정적 호출
 *   SynergySystem.applyAll({ player });
 */

import { synergyData } from '../../data/synergyData.js';

/**
 * 플레이어가 특정 upgradeId / weaponId를 보유하고 있는지 확인.
 * acquiredUpgrades: Set | Map<id, level> | string[] | {id}[] 모두 지원.
 *
 * @param {object} player
 * @param {string} upgradeId
 * @returns {boolean}
 */
function playerHasUpgrade(player, upgradeId) {
  // 보유 무기 id 체크
  if (Array.isArray(player.weapons)) {
    if (player.weapons.some(w => w.id === upgradeId)) return true;
  }
  // acquiredUpgrades 체크
  const au = player.acquiredUpgrades;
  if (!au) return false;
  if (au instanceof Set)  return au.has(upgradeId);
  if (au instanceof Map)  return (au.get(upgradeId) ?? 0) > 0;
  if (Array.isArray(au))  return au.some(u => (typeof u === 'string' ? u : u.id) === upgradeId);
  return false;
}

export const SynergySystem = {
  /**
   * 활성 시너지를 전부 재계산하고 보너스를 적용한다.
   * UpgradeSystem.applyUpgrade() 직후 또는 런 시작 시 1회 호출.
   *
   * CHANGE(P0-②): upgradeData 인자 제거 — synergyData를 직접 import해 사용
   *
   * @param {{ player: object }} param
   */
  applyAll({ player }) {
    if (!player) return;

    player.activeSynergies = player.activeSynergies ?? [];
    const previousIds = new Set(player.activeSynergies.map(s => s.id));
    const newActive   = [];

    for (const synergy of synergyData) {
      if (!Array.isArray(synergy.requires) || synergy.requires.length === 0) continue;

      const allMet = synergy.requires.every(reqId => playerHasUpgrade(player, reqId));
      if (!allMet) continue;

      newActive.push({ id: synergy.id, name: synergy.name });

      // 신규 발동 시만 보너스 적용 (전체 재계산이지만 누적 방지)
      if (!previousIds.has(synergy.id)) {
        this._applyBonus(player, synergy.bonus);
        console.log(`[SynergySystem] 시너지 발동: "${synergy.name}"`);
      }
    }

    player.activeSynergies = newActive;
  },

  /**
   * synergyData.js의 bonus 객체를 player에 적용.
   *
   * @param {object} player
   * @param {object} bonus  synergyData의 bonus 필드
   */
  _applyBonus(player, bonus) {
    if (!bonus) return;

    if (typeof bonus.maxHpDelta === 'number') {
      player.maxHp += bonus.maxHpDelta;
      player.hp     = Math.min(player.hp + bonus.maxHpDelta, player.maxHp);
    }
    if (typeof bonus.speedMult === 'number') {
      player.moveSpeed = Math.round((player.moveSpeed ?? 0) * bonus.speedMult);
    }
    if (typeof bonus.lifestealDelta === 'number') {
      player.lifesteal = Math.min(1, (player.lifesteal ?? 0) + bonus.lifestealDelta);
    }
    if (typeof bonus.magnetDelta === 'number') {
      player.magnetRadius = (player.magnetRadius ?? 60) + bonus.magnetDelta;
    }
    // 특정 무기 강화 보너스 (weaponId 지정)
    if (bonus.weaponId && typeof bonus.damageDelta === 'number') {
      const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
      if (weapon) weapon.damage += bonus.damageDelta;
    }
  },
};
