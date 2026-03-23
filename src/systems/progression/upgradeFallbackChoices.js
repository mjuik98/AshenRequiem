import { getActiveUpgradeData } from './upgradeChoicePool.js';
import { weightedPick } from '../../utils/weightedPick.js';

export function getFallbackUpgradeChoice(excludeIds = [], data = {}, rng) {
  const excluded = new Set(excludeIds);
  const fallbackPool = ['stat_heal', 'stat_gold']
    .filter((id) => !excluded.has(id))
    .map((id) => getActiveUpgradeData(data).find((upgrade) => upgrade.id === id))
    .filter(Boolean);
  if (fallbackPool.length === 0) return null;
  const selected = rng ? weightedPick(fallbackPool, rng) : fallbackPool[0];
  return selected ? { ...selected } : null;
}

export function fillWithFallbackChoices(result, seedExcludeIds = [], data = {}, {
  getFallbackChoice = getFallbackUpgradeChoice,
  rng,
} = {}) {
  const next = [...result];
  while (next.length < 3) {
    const fallback = getFallbackChoice([...seedExcludeIds, ...next.map((choice) => choice.id)], data, rng);
    if (!fallback) break;
    next.push(fallback);
  }
  return next;
}
