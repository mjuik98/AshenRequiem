import { createDefaultSessionMeta, reconcileSessionUnlocks } from '../sessionMeta.js';
import {
  SESSION_OPTION_DEFAULTS,
  normalizeSessionOptions,
} from '../sessionOptions.js';
import { SESSION_MIGRATION_STEPS } from './migrations/sessionMigrationSteps.js';

export const SESSION_VERSION = 8;

function createDefaultLast() {
  return {
    kills: 0,
    survivalTime: 0,
    level: 1,
    weaponsUsed: [],
  };
}

function createDefaultBest() {
  return {
    kills: 0,
    survivalTime: 0,
    level: 1,
  };
}

function createDefaultOptions() {
  return normalizeSessionOptions(SESSION_OPTION_DEFAULTS);
}

export function createSessionState() {
  return {
    _version: SESSION_VERSION,
    last: createDefaultLast(),
    best: createDefaultBest(),
    meta: createDefaultSessionMeta(),
    options: createDefaultOptions(),
    activeRun: null,
  };
}

export function normalizeSessionState(state) {
  const defaults = createSessionState();

  const normalized = {
    _version: SESSION_VERSION,
    last: {
      ...defaults.last,
      ...(state?.last ?? {}),
      weaponsUsed: Array.isArray(state?.last?.weaponsUsed) ? [...state.last.weaponsUsed] : [],
    },
    best: {
      ...defaults.best,
      ...(state?.best ?? {}),
    },
    meta: {
      ...defaults.meta,
      ...(state?.meta ?? {}),
      permanentUpgrades: { ...(state?.meta?.permanentUpgrades ?? {}) },
      enemyKills: { ...(state?.meta?.enemyKills ?? {}) },
      unlockedWeapons: Array.isArray(state?.meta?.unlockedWeapons)
        ? [...state.meta.unlockedWeapons]
        : [...defaults.meta.unlockedWeapons],
      unlockedAccessories: Array.isArray(state?.meta?.unlockedAccessories)
        ? [...state.meta.unlockedAccessories]
        : [...defaults.meta.unlockedAccessories],
      accessoriesOwnedAll: Array.isArray(state?.meta?.accessoriesOwnedAll)
        ? [...state.meta.accessoriesOwnedAll]
        : [...defaults.meta.accessoriesOwnedAll],
      completedUnlocks: Array.isArray(state?.meta?.completedUnlocks)
        ? [...state.meta.completedUnlocks]
        : [...defaults.meta.completedUnlocks],
      selectedStartWeaponId: typeof state?.meta?.selectedStartWeaponId === 'string'
        ? state.meta.selectedStartWeaponId
        : defaults.meta.selectedStartWeaponId,
      selectedStartAccessoryId: typeof state?.meta?.selectedStartAccessoryId === 'string'
        ? state.meta.selectedStartAccessoryId
        : defaults.meta.selectedStartAccessoryId,
      selectedArchetypeId: typeof state?.meta?.selectedArchetypeId === 'string'
        ? state.meta.selectedArchetypeId
        : defaults.meta.selectedArchetypeId,
      selectedRiskRelicId: typeof state?.meta?.selectedRiskRelicId === 'string'
        ? state.meta.selectedRiskRelicId
        : defaults.meta.selectedRiskRelicId,
      selectedStageId: typeof state?.meta?.selectedStageId === 'string'
        ? state.meta.selectedStageId
        : defaults.meta.selectedStageId,
      selectedSeedMode: typeof state?.meta?.selectedSeedMode === 'string'
        ? state.meta.selectedSeedMode
        : defaults.meta.selectedSeedMode,
      selectedSeedText: typeof state?.meta?.selectedSeedText === 'string'
        ? state.meta.selectedSeedText
        : defaults.meta.selectedSeedText,
      claimedDailyRewardSeeds: Array.isArray(state?.meta?.claimedDailyRewardSeeds)
        ? [...state.meta.claimedDailyRewardSeeds]
        : [...defaults.meta.claimedDailyRewardSeeds],
      dailyChallengeStreak: Number.isFinite(state?.meta?.dailyChallengeStreak)
        ? state.meta.dailyChallengeStreak
        : defaults.meta.dailyChallengeStreak,
      bestDailyChallengeStreak: Number.isFinite(state?.meta?.bestDailyChallengeStreak)
        ? state.meta.bestDailyChallengeStreak
        : defaults.meta.bestDailyChallengeStreak,
      lastDailyRewardSeed: typeof state?.meta?.lastDailyRewardSeed === 'string'
        ? state.meta.lastDailyRewardSeed
        : defaults.meta.lastDailyRewardSeed,
      recentRuns: Array.isArray(state?.meta?.recentRuns)
        ? [...state.meta.recentRuns]
        : [...defaults.meta.recentRuns],
      selectedAscensionLevel: state?.meta?.selectedAscensionLevel ?? defaults.meta.selectedAscensionLevel,
      highestAscensionCleared: state?.meta?.highestAscensionCleared ?? defaults.meta.highestAscensionCleared,
    },
    options: {
      ...normalizeSessionOptions({
        ...defaults.options,
        ...(state?.options ?? {}),
      }),
    },
    activeRun: state?.activeRun ?? null,
  };

  return reconcileSessionUnlocks(normalized);
}

export function migrateSessionState(raw) {
  if (!raw) return createSessionState();

  let state = { ...raw };
  let version = state._version ?? state.version ?? 0;

  for (const migration of SESSION_MIGRATION_STEPS) {
    if (version === migration.from) {
      state = migration.migrate(state);
      version = state._version;
    }
  }

  if (version > SESSION_VERSION) {
    console.warn(
      `[SessionState] 저장 버전(${version})이 현재(${SESSION_VERSION})보다 높음 — 기본값으로 초기화`,
    );
    return createSessionState();
  }

  return normalizeSessionState(state);
}
