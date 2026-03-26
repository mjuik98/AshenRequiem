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

export function createLocalSessionRepository(options = {}) {
  const hasExplicitStorage = Object.prototype.hasOwnProperty.call(options, 'storage');
  const {
    storageKey = SESSION_STORAGE_KEY,
    createSessionStateImpl = createSessionState,
    migrateSessionStateImpl = migrateSessionState,
    normalizeSessionStateImpl = normalizeSessionState,
    sessionVersion = SESSION_VERSION,
  } = options;

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
          best: normalized.best,
          meta: normalized.meta,
          options: normalized.options,
        };
        storage.setItem(storageKey, JSON.stringify(toSave));
      } catch (error) {
        console.warn('[SessionState] 저장 실패:', error);
      }
    },

    load() {
      const storage = getStorage();
      if (!storage?.getItem) return createSessionStateImpl();

      try {
        const raw = storage.getItem(storageKey);
        if (!raw) return createSessionStateImpl();
        return migrateSessionStateImpl(JSON.parse(raw));
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
