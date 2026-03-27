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

function resolveStorage(hasExplicitStorage, storage) {
  return hasExplicitStorage ? storage : resolveBrowserStorage();
}

function buildSnapshotSummary(session = null) {
  if (!session) return null;
  return {
    currency: session.meta?.currency ?? 0,
    totalRuns: session.meta?.totalRuns ?? 0,
    stageId: session.meta?.selectedStageId ?? 'ash_plains',
    lastRunOutcome: session.last?.kills != null ? session.meta?.recentRuns?.[0]?.outcome ?? null : null,
  };
}

function buildSerializableSessionState(
  session,
  {
    normalizeSessionStateImpl = normalizeSessionState,
    sessionVersion = SESSION_VERSION,
  } = {},
) {
  const normalized = normalizeSessionStateImpl(session);
  return {
    _version: sessionVersion,
    last: normalized.last,
    best: normalized.best,
    meta: normalized.meta,
    options: normalized.options,
    activeRun: normalized.activeRun,
  };
}

export function serializeSessionState(
  session,
  {
    normalizeSessionStateImpl = normalizeSessionState,
    sessionVersion = SESSION_VERSION,
  } = {},
) {
  return JSON.stringify(buildSerializableSessionState(session, {
    normalizeSessionStateImpl,
    sessionVersion,
  }));
}

export function parseSessionState(
  raw,
  {
    migrateSessionStateImpl = migrateSessionState,
    normalizeSessionStateImpl = normalizeSessionState,
  } = {},
) {
  const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (
    payload
    && (Object.prototype.hasOwnProperty.call(payload, 'last')
      || Object.prototype.hasOwnProperty.call(payload, 'best')
      || Object.prototype.hasOwnProperty.call(payload, 'meta')
      || Object.prototype.hasOwnProperty.call(payload, 'options')
      || Object.prototype.hasOwnProperty.call(payload, 'activeRun'))
    && (payload._version == null && payload.version == null)
  ) {
    return normalizeSessionStateImpl(payload);
  }
  return migrateSessionStateImpl(payload);
}

function tryLoadSessionPayload(raw, migrateSessionStateImpl) {
  if (!raw) {
    return { ok: false, error: null, session: null };
  }

  try {
    return {
      ok: true,
      error: null,
      session: parseSessionState(raw, { migrateSessionStateImpl }),
    };
  } catch (error) {
    return {
      ok: false,
      error,
      session: null,
    };
  }
}

export function inspectStoredSessionSnapshots(options = {}) {
  const hasExplicitStorage = Object.prototype.hasOwnProperty.call(options, 'storage');
  const {
    storageKey = SESSION_STORAGE_KEY,
    storage = null,
    migrateSessionStateImpl = migrateSessionState,
  } = options;
  const resolvedStorage = resolveStorage(hasExplicitStorage, storage);
  const storageKeys = buildSessionStorageKeys(storageKey);

  function inspectSlot(key) {
    const raw = resolvedStorage?.getItem?.(key) ?? null;
    if (!raw) {
      return {
        key,
        raw: null,
        status: 'missing',
        session: null,
        summary: null,
      };
    }

    try {
      const session = parseSessionState(raw, { migrateSessionStateImpl });
      return {
        key,
        raw,
        status: 'ok',
        session,
        summary: buildSnapshotSummary(session),
      };
    } catch (error) {
      return {
        key,
        raw,
        status: 'invalid',
        session: null,
        error,
        summary: null,
      };
    }
  }

  return {
    primary: inspectSlot(storageKeys.primary),
    backup: inspectSlot(storageKeys.backup),
    corrupt: inspectSlot(storageKeys.corrupt),
  };
}

export function restoreStoredSessionSnapshot(target = 'backup', options = {}) {
  const hasExplicitStorage = Object.prototype.hasOwnProperty.call(options, 'storage');
  const {
    storageKey = SESSION_STORAGE_KEY,
    storage = null,
    normalizeSessionStateImpl = normalizeSessionState,
    sessionVersion = SESSION_VERSION,
  } = options;
  const resolvedStorage = resolveStorage(hasExplicitStorage, storage);
  const inspection = inspectStoredSessionSnapshots({
    storageKey,
    storage: resolvedStorage,
  });
  const targetSnapshot = inspection[target];
  if (!targetSnapshot || targetSnapshot.status !== 'ok' || !targetSnapshot.session) {
    throw new Error(`복구할 수 없는 저장 슬롯입니다: ${target}`);
  }

  const serialized = serializeSessionState(targetSnapshot.session, {
    normalizeSessionStateImpl,
    sessionVersion,
  });
  const storageKeys = buildSessionStorageKeys(storageKey);
  resolvedStorage?.setItem?.(storageKeys.primary, serialized);
  resolvedStorage?.setItem?.(storageKeys.backup, serialized);
  return targetSnapshot.session;
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
    return resolveStorage(hasExplicitStorage, options.storage);
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
