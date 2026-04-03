import {
  migrateSessionState,
  normalizeSessionState,
  SESSION_VERSION,
} from './sessionMigrations.js';

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
