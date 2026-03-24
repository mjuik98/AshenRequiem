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
  buildEvolutionChoicePool,
  buildUpgradeChoicePool,
} from './upgradeChoicePool.js';
import {
  fillWithFallbackChoices,
  getFallbackUpgradeChoice,
} from './upgradeFallbackChoices.js';
import { SynergySystem } from './SynergySystem.js';

export const UpgradeSystem = {

  generateChoices(player, options = {}, data = {}) {
    const rng = options?.rng;
    const evolutionPicks = buildEvolutionChoicePool(player, options, data);
    const picks = this._buildAvailablePool(player, {
      ...options,
      excludeChoiceIds: [
        ...(options.excludeChoiceIds ?? []),
        ...evolutionPicks.map((choice) => choice.id),
      ],
    }, data);
    let result = evolutionPicks.slice(0, 3);

    if (result.length < 3) {
      result = result.concat(shuffle(picks, rng).slice(0, 3 - result.length));
    }

    // 폴백: 후보 풀이 바닥나면 회복/골드를 중복 없이 보충한다.
    if (result.length < 3) {
      result = this._fillWithFallbackChoices(result, options.excludeChoiceIds ?? [], data, rng);
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
    const rng = options?.rng;
    const excludeChoiceIds = currentChoices
      .filter((choice, choiceIndex) => choiceIndex !== index || choice?.id === currentChoices[index]?.id)
      .map((choice) => choice?.id)
      .filter(Boolean);
    const pool = shuffle(this._buildAvailablePool(player, {
      ...options,
      excludeChoiceIds,
    }, data), rng);
    const replacement = pool[0] ?? this._getFallbackChoice(excludeChoiceIds, data, rng);
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

UpgradeSystem._fillWithFallbackChoices = function _fillWithFallbackChoices(result, seedExcludeIds = [], data = {}, rng) {
  return fillWithFallbackChoices(result, seedExcludeIds, data, {
    rng,
    getFallbackChoice: (excludeIds, nextData, nextRng) => this._getFallbackChoice(excludeIds, nextData, nextRng),
  });
};

UpgradeSystem._getFallbackChoice = function _getFallbackChoice(excludeIds = [], data = {}, rng) {
  return getFallbackUpgradeChoice(excludeIds, data, rng);
};
