import {
  migrateSessionState,
  normalizeSessionState,
  SESSION_VERSION,
} from '../../../state/session/sessionMigrations.js';
import {
  SESSION_STORAGE_KEY,
  buildSessionStorageKeys,
} from '../../../state/session/sessionStorageKeys.js';
import {
  parseSessionState,
  serializeSessionState,
} from '../../../state/session/sessionStateCodec.js';
import { logRuntimeWarn } from '../../../utils/runtimeLogger.js';
import { resolveSessionStorage } from './sessionStorageDriver.js';

function buildSnapshotSummary(session = null) {
  if (!session) return null;
  return {
    currency: session.meta?.currency ?? 0,
    totalRuns: session.meta?.totalRuns ?? 0,
    stageId: session.meta?.selectedStageId ?? 'ash_plains',
    lastRunOutcome: session.last?.kills != null ? session.meta?.recentRuns?.[0]?.outcome ?? null : null,
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
  const {
    storageKey = SESSION_STORAGE_KEY,
    storage = null,
    migrateSessionStateImpl = migrateSessionState,
    host = globalThis,
  } = options;
  const resolvedStorage = resolveSessionStorage({ storage, host });
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
  const {
    storageKey = SESSION_STORAGE_KEY,
    storage = null,
    normalizeSessionStateImpl = normalizeSessionState,
    sessionVersion = SESSION_VERSION,
    host = globalThis,
  } = options;
  const resolvedStorage = resolveSessionStorage({ storage, host });
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

export function loadSessionWithRecovery({
  storage = null,
  storageKey = SESSION_STORAGE_KEY,
  createSessionStateImpl,
  migrateSessionStateImpl = migrateSessionState,
} = {}) {
  if (!storage?.getItem) return createSessionStateImpl();

  const storageKeys = buildSessionStorageKeys(storageKey);
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
      logRuntimeWarn('SessionState', '불러오기 실패, 기본값 사용:', primaryResult.error);
    }
    return createSessionStateImpl();
  } catch (error) {
    logRuntimeWarn('SessionState', '불러오기 실패, 기본값 사용:', error);
    return createSessionStateImpl();
  }
}
