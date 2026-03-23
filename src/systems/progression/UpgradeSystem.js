/**
 * src/systems/progression/UpgradeSystem.js
 *
 * CHANGE: 레벨업 보상 개편
 *   - 스탯/슬롯 업그레이드 제거 → 무기/장신구 중심
 *   - accessory_upgrade 타입 추가 (보유 장신구 Lv5까지 강화)
 *   - stat_heal은 무기/장신구 후보가 없을 때만 폴백으로 등장
 */
import { shuffle } from '../../utils/random.js';
import { applyUpgradeRuntime } from './upgradeApplyRuntime.js';
import {
  buildUpgradeChoicePool,
} from './upgradeChoicePool.js';
import {
  fillWithFallbackChoices,
  getFallbackUpgradeChoice,
} from './upgradeFallbackChoices.js';
import { SynergySystem } from './SynergySystem.js';

export const UpgradeSystem = {

  generateChoices(player, options = {}, data = {}) {
    const picks = this._buildAvailablePool(player, options, data);
    let result  = shuffle(picks).slice(0, 3);

    // 폴백: 후보 풀이 바닥나면 회복/골드를 중복 없이 보충한다.
    if (result.length < 3) {
      result = this._fillWithFallbackChoices(result, options.excludeChoiceIds ?? [], data);
    }

    return result;
  },

  /**
   * 무기/장신구 관련 선택지만 수집한다.
   * stat/slot 타입은 완전히 제외된다.
   */
  _buildAvailablePool(player, options = {}, data = {}) {
    return buildUpgradeChoicePool(player, options, data);
  },

  replaceChoiceAtIndex(player, currentChoices, index, options = {}, data = {}) {
    const nextChoices = [...currentChoices];
    const excludeChoiceIds = currentChoices
      .filter((choice, choiceIndex) => choiceIndex !== index || choice?.id === currentChoices[index]?.id)
      .map((choice) => choice?.id)
      .filter(Boolean);
    const pool = shuffle(this._buildAvailablePool(player, {
      ...options,
      excludeChoiceIds,
    }, data));
    const replacement = pool[0] ?? this._getFallbackChoice(excludeChoiceIds, data);
    if (replacement) {
      nextChoices[index] = replacement;
    }
    return nextChoices;
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

    SynergySystem.applyAll({ player, synergyData, synergyState });
  },
};

// ── fallback 선택지 ─────────────────────────────────────────────────────────

UpgradeSystem._fillWithFallbackChoices = function _fillWithFallbackChoices(result, seedExcludeIds = [], data = {}) {
  return fillWithFallbackChoices(result, seedExcludeIds, data, {
    getFallbackChoice: (excludeIds, nextData) => this._getFallbackChoice(excludeIds, nextData),
  });
};

UpgradeSystem._getFallbackChoice = function _getFallbackChoice(excludeIds = [], data = {}) {
  return getFallbackUpgradeChoice(excludeIds, data);
};
