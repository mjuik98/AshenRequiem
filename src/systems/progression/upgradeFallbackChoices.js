import { getActiveUpgradeData } from './upgradeChoicePool.js';

export function getFallbackUpgradeChoice(excludeIds = [], data = {}) {
  const excluded = new Set(excludeIds);
  const fallbackPool = ['stat_heal', 'stat_gold']
    .filter((id) => !excluded.has(id))
    .map((id) => getActiveUpgradeData(data).find((upgrade) => upgrade.id === id))
    .filter(Boolean);
  if (fallbackPool.length === 0) return null;
  return { ...fallbackPool[0] };
}

export function fillWithFallbackChoices(result, seedExcludeIds = [], data = {}, {
  getFallbackChoice = getFallbackUpgradeChoice,
} = {}) {
  const next = [...result];
  while (next.length < 3) {
    const fallback = getFallbackChoice([...seedExcludeIds, ...next.map((choice) => choice.id)], data);
    if (!fallback) break;
    next.push(fallback);
  }
  return next;
}
