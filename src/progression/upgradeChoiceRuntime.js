import { shuffle } from '../utils/random.js';
import {
  buildEvolutionChoicePool,
  buildUpgradeChoicePool,
} from './upgradeChoicePool.js';
import {
  fillWithFallbackChoices,
  getFallbackUpgradeChoice,
} from './upgradeFallbackChoices.js';

export function buildAvailableUpgradePool(player, options = {}, data = {}) {
  return buildUpgradeChoicePool(player, options, data);
}

export function fillUpgradeFallbackChoices(result, seedExcludeIds = [], data = {}, rng) {
  return fillWithFallbackChoices(result, seedExcludeIds, data, {
    rng,
    getFallbackChoice: (excludeIds, nextData, nextRng) => getFallbackUpgradeChoice(excludeIds, nextData, nextRng),
  });
}

export { getFallbackUpgradeChoice };

export function generateUpgradeChoices(player, options = {}, data = {}) {
  const rng = options?.rng;
  const evolutionPicks = buildEvolutionChoicePool(player, options, data);
  const picks = buildAvailableUpgradePool(player, {
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

  if (result.length < 3) {
    result = fillUpgradeFallbackChoices(result, options.excludeChoiceIds ?? [], data, rng);
  }

  return result;
}

export function replaceUpgradeChoiceAtIndex(player, currentChoices, index, options = {}, data = {}) {
  const nextChoices = [...currentChoices];
  const rng = options?.rng;
  const excludeChoiceIds = currentChoices
    .filter((choice, choiceIndex) => choiceIndex !== index || choice?.id === currentChoices[index]?.id)
    .map((choice) => choice?.id)
    .filter(Boolean);
  const pool = shuffle(buildAvailableUpgradePool(player, {
    ...options,
    excludeChoiceIds,
  }, data), rng);
  const replacement = pool[0] ?? getFallbackUpgradeChoice(excludeChoiceIds, data, rng);
  if (replacement) {
    nextChoices[index] = replacement;
  }
  return nextChoices;
}
