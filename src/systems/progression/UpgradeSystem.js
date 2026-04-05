/**
 * src/systems/progression/UpgradeSystem.js
 *
 * CHANGE: 레벨업 보상 개편
 *   - 스탯/슬롯 업그레이드 제거 → 무기/장신구 중심
 *   - accessory_upgrade 타입 추가 (보유 장신구 Lv5까지 강화)
 *   - stat_heal은 무기/장신구 후보가 없을 때만 폴백으로 등장
 */
import { applyUpgradeRuntime } from './upgradeApplyRuntime.js';
import { applySynergies } from '../../domain/play/progression/synergyRuntime.js';
import {
  buildAvailableUpgradePool,
  fillUpgradeFallbackChoices,
  generateUpgradeChoices,
  getFallbackUpgradeChoice,
  replaceUpgradeChoiceAtIndex,
} from '../../domain/play/progression/upgradeChoiceRuntime.js';

export const UpgradeSystem = {

  generateChoices(player, options = {}, data = {}) {
    return generateUpgradeChoices(player, options, data);
  },

  /**
   * 무기/장신구 관련 선택지만 수집한다.
   * stat/slot 타입은 완전히 제외된다.
   */
  _buildAvailablePool(player, options = {}, data = {}) {
    return buildAvailableUpgradePool(player, options, data);
  },

  replaceChoiceAtIndex(player, currentChoices, index, options = {}, data = {}) {
    return replaceUpgradeChoiceAtIndex(player, currentChoices, index, options, data);
  },

  /**
   * @param {object}             player
   * @param {object}             upgrade
   * @param {object[]|undefined} synergyData
   * @param {object|undefined}   synergyState
   */
  applyUpgrade(player, upgrade, synergyData, synergyState, data = {}) {
    applyUpgradeRuntime(player, upgrade, data);

    player.upgradeCounts = player.upgradeCounts ?? {};
    player.upgradeCounts[upgrade.id] = (player.upgradeCounts[upgrade.id] ?? 0) + 1;

    player.acquiredUpgrades = player.acquiredUpgrades ?? new Set();
    player.acquiredUpgrades.add(upgrade.id);

    applySynergies({ player, synergyData, synergyState });
  },
};

// ── fallback 선택지 ─────────────────────────────────────────────────────────

UpgradeSystem._fillWithFallbackChoices = function _fillWithFallbackChoices(result, seedExcludeIds = [], data = {}, rng) {
  return fillUpgradeFallbackChoices(result, seedExcludeIds, data, rng);
};

UpgradeSystem._getFallbackChoice = function _getFallbackChoice(excludeIds = [], data = {}, rng) {
  return getFallbackUpgradeChoice(excludeIds, data, rng);
};
