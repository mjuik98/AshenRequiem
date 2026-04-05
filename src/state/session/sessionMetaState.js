import {
  getDefaultUnlockedAccessoryIds,
  getDefaultUnlockedWeaponIds,
  mergeUnlockedAccessoryIds,
  mergeUnlockedWeaponIds,
} from '../../data/unlockAvailability.js';
import { normalizeAscensionLevel } from '../../domain/meta/loadout/startLoadoutDomain.js';

export function createDefaultSessionMeta() {
  return {
    currency: 0,
    permanentUpgrades: {},
    enemyKills: {},
    enemiesEncountered: [],
    killedBosses: [],
    weaponsUsedAll: [],
    accessoriesOwnedAll: [],
    evolvedWeapons: [],
    totalRuns: 0,
    unlockedWeapons: getDefaultUnlockedWeaponIds(),
    unlockedAccessories: getDefaultUnlockedAccessoryIds(),
    completedUnlocks: [],
    selectedStartWeaponId: 'magic_bolt',
    selectedStartAccessoryId: null,
    selectedArchetypeId: 'vanguard',
    selectedRiskRelicId: null,
    selectedStageId: 'ash_plains',
    selectedSeedMode: 'none',
    selectedSeedText: '',
    claimedDailyRewardSeeds: [],
    dailyChallengeStreak: 0,
    bestDailyChallengeStreak: 0,
    lastDailyRewardSeed: '',
    recentRuns: [],
    selectedAscensionLevel: 0,
    highestAscensionCleared: 0,
  };
}

export function ensureSessionMeta(session) {
  const defaults = createDefaultSessionMeta();
  const meta = session.meta ??= {};

  meta.currency ??= defaults.currency;
  meta.permanentUpgrades = { ...(meta.permanentUpgrades ?? defaults.permanentUpgrades) };
  meta.enemyKills = { ...(meta.enemyKills ?? defaults.enemyKills) };
  meta.enemiesEncountered = Array.isArray(meta.enemiesEncountered)
    ? [...meta.enemiesEncountered]
    : [...defaults.enemiesEncountered];
  meta.killedBosses = Array.isArray(meta.killedBosses)
    ? [...meta.killedBosses]
    : [...defaults.killedBosses];
  meta.weaponsUsedAll = Array.isArray(meta.weaponsUsedAll)
    ? [...meta.weaponsUsedAll]
    : [...defaults.weaponsUsedAll];
  meta.accessoriesOwnedAll = Array.isArray(meta.accessoriesOwnedAll)
    ? [...meta.accessoriesOwnedAll]
    : [...defaults.accessoriesOwnedAll];
  meta.evolvedWeapons = Array.isArray(meta.evolvedWeapons)
    ? [...meta.evolvedWeapons]
    : [...defaults.evolvedWeapons];
  meta.totalRuns ??= defaults.totalRuns;
  meta.unlockedWeapons = mergeUnlockedWeaponIds(
    Array.isArray(meta.unlockedWeapons) ? meta.unlockedWeapons : defaults.unlockedWeapons,
  );
  meta.unlockedAccessories = mergeUnlockedAccessoryIds(
    Array.isArray(meta.unlockedAccessories) ? meta.unlockedAccessories : defaults.unlockedAccessories,
  );
  meta.completedUnlocks = Array.isArray(meta.completedUnlocks)
    ? [...meta.completedUnlocks]
    : [...defaults.completedUnlocks];
  meta.selectedStartAccessoryId = typeof meta.selectedStartAccessoryId === 'string'
    && meta.unlockedAccessories.includes(meta.selectedStartAccessoryId)
    ? meta.selectedStartAccessoryId
    : null;
  meta.selectedArchetypeId = typeof meta.selectedArchetypeId === 'string'
    ? meta.selectedArchetypeId
    : defaults.selectedArchetypeId;
  meta.selectedRiskRelicId = typeof meta.selectedRiskRelicId === 'string'
    ? meta.selectedRiskRelicId
    : defaults.selectedRiskRelicId;
  meta.selectedStageId = typeof meta.selectedStageId === 'string'
    ? meta.selectedStageId
    : defaults.selectedStageId;
  meta.selectedSeedMode = typeof meta.selectedSeedMode === 'string'
    ? meta.selectedSeedMode
    : defaults.selectedSeedMode;
  meta.selectedSeedText = typeof meta.selectedSeedText === 'string'
    ? meta.selectedSeedText
    : defaults.selectedSeedText;
  meta.claimedDailyRewardSeeds = Array.isArray(meta.claimedDailyRewardSeeds)
    ? [...meta.claimedDailyRewardSeeds]
    : [...defaults.claimedDailyRewardSeeds];
  meta.dailyChallengeStreak = Number.isFinite(meta.dailyChallengeStreak)
    ? Math.max(0, meta.dailyChallengeStreak)
    : defaults.dailyChallengeStreak;
  meta.bestDailyChallengeStreak = Number.isFinite(meta.bestDailyChallengeStreak)
    ? Math.max(meta.dailyChallengeStreak ?? 0, meta.bestDailyChallengeStreak)
    : Math.max(meta.dailyChallengeStreak ?? 0, defaults.bestDailyChallengeStreak);
  meta.lastDailyRewardSeed = typeof meta.lastDailyRewardSeed === 'string'
    ? meta.lastDailyRewardSeed
    : defaults.lastDailyRewardSeed;
  meta.recentRuns = Array.isArray(meta.recentRuns)
    ? [...meta.recentRuns]
    : [...defaults.recentRuns];
  meta.selectedStartWeaponId = typeof meta.selectedStartWeaponId === 'string'
    && meta.unlockedWeapons.includes(meta.selectedStartWeaponId)
    ? meta.selectedStartWeaponId
    : meta.unlockedWeapons[0] ?? defaults.selectedStartWeaponId;
  meta.selectedAscensionLevel = normalizeAscensionLevel(
    {},
    meta.selectedAscensionLevel ?? defaults.selectedAscensionLevel,
  );
  meta.highestAscensionCleared = Math.max(
    0,
    normalizeAscensionLevel({}, meta.highestAscensionCleared ?? defaults.highestAscensionCleared),
  );

  return meta;
}

export const ensureCodexMeta = ensureSessionMeta;

export function appendUnique(base = [], additions = []) {
  return [...new Set([...(base ?? []), ...(additions ?? [])])];
}
