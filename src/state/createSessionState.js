/**
 * Public compatibility barrel.
 * Real session state ownership lives in src/state/session/* and
 * browser persistence ownership lives in src/adapters/browser/session/*.
 */
export {
  createSessionState,
  normalizeSessionState as _normalizeSessionState,
  migrateSessionState as _migrate,
} from './session/sessionMigrations.js';
export {
  updateSessionBest,
  earnCurrency,
  purchasePermanentUpgrade,
} from './session/sessionCommands.js';
export {
  saveSession,
  loadSession,
  setSessionStorage,
  resetSessionStorage,
} from '../adapters/browser/session/sessionStorage.js';
export {
  createLocalSessionRepository,
  getSessionRepository,
  loadSessionState,
  saveSessionState,
  setSessionRepository,
  resetSessionRepository,
} from '../adapters/browser/session/sessionRepository.js';

/** @typedef {import('./session/sessionMigrations.js').SessionState} SessionState */

export {};
