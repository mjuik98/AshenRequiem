export {
  createLocalSessionRepository,
  getSessionRepository,
  loadSessionState,
  saveSessionState,
  setSessionRepository,
  resetSessionRepository,
  SESSION_STORAGE_KEY,
  serializeSessionState,
  parseSessionState,
  inspectStoredSessionSnapshots,
  restoreStoredSessionSnapshot,
} from '../../adapters/browser/session/sessionRepository.js';
