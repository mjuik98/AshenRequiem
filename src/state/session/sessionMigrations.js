import { createDefaultSessionMeta, reconcileSessionUnlocks } from '../sessionMeta.js';
import {
  SESSION_OPTION_DEFAULTS,
  normalizeSessionOptions,
} from '../sessionOptions.js';

export const SESSION_VERSION = 5;

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
  return { ...SESSION_OPTION_DEFAULTS };
}

export function createSessionState() {
  return {
    _version: SESSION_VERSION,
    last: createDefaultLast(),
    best: createDefaultBest(),
    meta: createDefaultSessionMeta(),
    options: createDefaultOptions(),
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
      completedUnlocks: Array.isArray(state?.meta?.completedUnlocks)
        ? [...state.meta.completedUnlocks]
        : [...defaults.meta.completedUnlocks],
      selectedStartWeaponId: typeof state?.meta?.selectedStartWeaponId === 'string'
        ? state.meta.selectedStartWeaponId
        : defaults.meta.selectedStartWeaponId,
    },
    options: {
      ...normalizeSessionOptions({
        ...defaults.options,
        ...(state?.options ?? {}),
      }),
    },
  };

  return reconcileSessionUnlocks(normalized);
}

export function migrateSessionState(raw) {
  if (!raw) return createSessionState();

  let state = { ...raw };
  let version = state._version ?? state.version ?? 0;

  const migrations = [
    {
      from: 0,
      migrate(s) {
        return {
          ...s,
          _version: 1,
          best: {
            kills: s.best?.kills ?? s.best?.killCount ?? 0,
            survivalTime: s.best?.survivalTime ?? s.best?.elapsedTime ?? 0,
            level: s.best?.level ?? s.best?.playerLevel ?? 1,
          },
          meta: {
            currency: s.meta?.currency ?? 0,
            permanentUpgrades: s.meta?.permanentUpgrades ?? {},
          },
          options: {
            ...SESSION_OPTION_DEFAULTS,
            soundEnabled: s.options?.soundEnabled ?? s.options?.soundOn ?? SESSION_OPTION_DEFAULTS.soundEnabled,
            musicEnabled: s.options?.musicEnabled ?? SESSION_OPTION_DEFAULTS.musicEnabled,
            showFps: s.options?.showFps ?? SESSION_OPTION_DEFAULTS.showFps,
          },
        };
      },
    },
    {
      from: 1,
      migrate(s) {
        return {
          ...s,
          _version: 2,
          last: {
            kills: s.last?.kills ?? 0,
            survivalTime: s.last?.survivalTime ?? 0,
            level: s.last?.level ?? 1,
            weaponsUsed: s.last?.weaponsUsed ?? [],
          },
        };
      },
    },
    {
      from: 2,
      migrate(s) {
        return {
          ...s,
          _version: 3,
          options: {
            ...SESSION_OPTION_DEFAULTS,
            ...s.options,
          },
        };
      },
    },
    {
      from: 3,
      migrate(s) {
        return {
          ...s,
          _version: 4,
          meta: {
            ...s.meta,
            enemyKills: s.meta?.enemyKills ?? {},
            enemiesEncountered: s.meta?.enemiesEncountered ?? [],
            killedBosses: s.meta?.killedBosses ?? [],
            weaponsUsedAll: s.meta?.weaponsUsedAll ?? [],
            evolvedWeapons: s.meta?.evolvedWeapons ?? [],
            totalRuns: s.meta?.totalRuns ?? 0,
          },
        };
      },
    },
    {
      from: 4,
      migrate(s) {
        return {
          ...s,
          _version: 5,
          meta: {
            ...s.meta,
            unlockedWeapons: Array.isArray(s.meta?.unlockedWeapons) ? s.meta.unlockedWeapons : ['magic_bolt'],
            unlockedAccessories: Array.isArray(s.meta?.unlockedAccessories) ? s.meta.unlockedAccessories : [],
            completedUnlocks: Array.isArray(s.meta?.completedUnlocks) ? s.meta.completedUnlocks : [],
            selectedStartWeaponId: typeof s.meta?.selectedStartWeaponId === 'string'
              ? s.meta.selectedStartWeaponId
              : 'magic_bolt',
          },
        };
      },
    },
  ];

  for (const migration of migrations) {
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
