import {
  createSessionState,
  migrateSessionState,
  normalizeSessionState,
  SESSION_VERSION,
} from './sessionMigrations.js';

const STORAGE_KEY = 'ashenRequiem_session';

let sessionStorageOverride;

function getSessionStorage() {
  if (sessionStorageOverride !== undefined) {
    return sessionStorageOverride;
  }

  return typeof globalThis.localStorage !== 'undefined'
    ? globalThis.localStorage
    : null;
}

export function saveSession(session) {
  const storage = getSessionStorage();
  if (!storage?.setItem) return;

  try {
    const normalized = normalizeSessionState(session);
    const toSave = {
      _version: SESSION_VERSION,
      best: normalized.best,
      meta: normalized.meta,
      options: normalized.options,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.warn('[SessionState] 저장 실패:', error);
  }
}

export function loadSession() {
  const storage = getSessionStorage();
  if (!storage?.getItem) return createSessionState();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createSessionState();
    return migrateSessionState(JSON.parse(raw));
  } catch (error) {
    console.warn('[SessionState] 불러오기 실패, 기본값 사용:', error);
    return createSessionState();
  }
}

export function setSessionStorage(storage) {
  sessionStorageOverride = storage ?? null;
}

export function resetSessionStorage() {
  sessionStorageOverride = undefined;
}
