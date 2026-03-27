import {
  createSessionState,
  migrateSessionState,
  normalizeSessionState,
  SESSION_VERSION,
} from './sessionMigrations.js';

export const SESSION_STORAGE_KEY = 'ashenRequiem_session';

let repositoryOverride;

function resolveBrowserStorage() {
  return typeof globalThis.localStorage !== 'undefined'
    ? globalThis.localStorage
    : null;
}

function buildSessionStorageKeys(storageKey) {
  return {
    primary: storageKey,
    backup: `${storageKey}_backup`,
    corrupt: `${storageKey}_corrupt`,
  };
}

function tryLoadSessionPayload(raw, migrateSessionStateImpl) {
  if (!raw) {
    return { ok: false, error: null, session: null };
  }

  try {
    return {
      ok: true,
      error: null,
      session: migrateSessionStateImpl(JSON.parse(raw)),
    };
  } catch (error) {
    return {
      ok: false,
      error,
      session: null,
    };
  }
}

export function createLocalSessionRepository(options = {}) {
  const hasExplicitStorage = Object.prototype.hasOwnProperty.call(options, 'storage');
  const {
    storageKey = SESSION_STORAGE_KEY,
    createSessionStateImpl = createSessionState,
    migrateSessionStateImpl = migrateSessionState,
    normalizeSessionStateImpl = normalizeSessionState,
    sessionVersion = SESSION_VERSION,
  } = options;
  const storageKeys = buildSessionStorageKeys(storageKey);

  function getStorage() {
    return hasExplicitStorage ? options.storage : resolveBrowserStorage();
  }

  return {
    save(session) {
      const storage = getStorage();
      if (!storage?.setItem) return;

      try {
        const normalized = normalizeSessionStateImpl(session);
        const toSave = {
          _version: sessionVersion,
          last: normalized.last,
          best: normalized.best,
          meta: normalized.meta,
          options: normalized.options,
          activeRun: normalized.activeRun,
        };
        const serialized = JSON.stringify(toSave);
        storage.setItem(storageKeys.primary, serialized);
        storage.setItem(storageKeys.backup, serialized);
      } catch (error) {
        console.warn('[SessionState] 저장 실패:', error);
      }
    },

    load() {
      const storage = getStorage();
      if (!storage?.getItem) return createSessionStateImpl();

      const primaryRaw = storage.getItem(storageKeys.primary);
      const primaryResult = tryLoadSessionPayload(primaryRaw, migrateSessionStateImpl);
      if (primaryResult.ok) {
        return primaryResult.session;
      }

      const backupRaw = storage.getItem(storageKeys.backup);
      const backupResult = tryLoadSessionPayload(backupRaw, migrateSessionStateImpl);
      if (backupResult.ok) {
        try {
          if (primaryRaw && storage?.setItem) {
            storage.setItem(storageKeys.corrupt, primaryRaw);
          }
          if (backupRaw && storage?.setItem) {
            storage.setItem(storageKeys.primary, backupRaw);
          }
        } catch {}
        return backupResult.session;
      }

      try {
        if (primaryResult.error) {
          console.warn('[SessionState] 불러오기 실패, 기본값 사용:', primaryResult.error);
        }
        return createSessionStateImpl();
      } catch (error) {
        console.warn('[SessionState] 불러오기 실패, 기본값 사용:', error);
        return createSessionStateImpl();
      }
    },
  };
}

export function getSessionRepository() {
  return repositoryOverride ?? createLocalSessionRepository();
}

export function saveSessionState(session) {
  getSessionRepository()?.save?.(session);
}

export function loadSessionState() {
  const loaded = getSessionRepository()?.load?.();
  return loaded ?? createSessionState();
}

export function setSessionRepository(repository) {
  repositoryOverride = repository ?? null;
}

export function resetSessionRepository() {
  repositoryOverride = undefined;
}
