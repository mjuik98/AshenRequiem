import {
  createLocalSessionRepository,
  loadSessionState,
  resetSessionRepository,
  saveSessionState,
  setSessionRepository,
} from './sessionRepository.js';

export function saveSession(session) {
  saveSessionState(session);
}

export function loadSession() {
  return loadSessionState();
}

export function setSessionStorage(storage) {
  setSessionRepository(createLocalSessionRepository({ storage }));
}

export function resetSessionStorage() {
  resetSessionRepository();
}
