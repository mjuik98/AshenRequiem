import {
  createSessionState,
  migrateSessionState,
  normalizeSessionState,
  SESSION_VERSION,
} from './sessionMigrations.js';
import {
  SESSION_STORAGE_KEY,
  buildSessionStorageKeys,
} from './sessionStorageKeys.js';
import {
  parseSessionState,
  serializeSessionState,
} from './sessionStateCodec.js';
import {
  inspectStoredSessionSnapshots,
  loadSessionWithRecovery,
  restoreStoredSessionSnapshot,
} from './sessionRecoveryPolicy.js';
import { resolveSessionStorage } from './sessionStorageDriver.js';

let repositoryOverride;

export {
  SESSION_STORAGE_KEY,
  serializeSessionState,
  parseSessionState,
  inspectStoredSessionSnapshots,
  restoreStoredSessionSnapshot,
};

export function createLocalSessionRepository(options = {}) {
  const {
    storageKey = SESSION_STORAGE_KEY,
    createSessionStateImpl = createSessionState,
    migrateSessionStateImpl = migrateSessionState,
    normalizeSessionStateImpl = normalizeSessionState,
    sessionVersion = SESSION_VERSION,
    host = globalThis,
  } = options;
  const storageKeys = buildSessionStorageKeys(storageKey);

  function getStorage() {
    return resolveSessionStorage({
      storage: options.storage,
      host,
    });
  }

  return {
    save(session) {
      const storage = getStorage();
      if (!storage?.setItem) return;

      try {
        const serialized = serializeSessionState(session, {
          normalizeSessionStateImpl,
          sessionVersion,
        });
        storage.setItem(storageKeys.primary, serialized);
        storage.setItem(storageKeys.backup, serialized);
      } catch (error) {
        console.warn('[SessionState] 저장 실패:', error);
      }
    },

    load() {
      return loadSessionWithRecovery({
        storage: getStorage(),
        storageKey,
        createSessionStateImpl,
        migrateSessionStateImpl,
      });
    },

    inspect() {
      return inspectStoredSessionSnapshots({
        storageKey,
        storage: getStorage(),
        migrateSessionStateImpl,
      });
    },

    restore(target = 'backup') {
      return restoreStoredSessionSnapshot(target, {
        storageKey,
        storage: getStorage(),
        normalizeSessionStateImpl,
        sessionVersion,
      });
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
