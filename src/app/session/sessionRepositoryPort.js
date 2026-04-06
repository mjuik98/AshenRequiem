import {
  inspectStoredSessionSnapshots as inspectStoredSessionSnapshotsImpl,
  parseSessionState as parseSessionStateImpl,
  restoreStoredSessionSnapshot as restoreStoredSessionSnapshotImpl,
  saveSessionState as saveSessionStateImpl,
  serializeSessionState as serializeSessionStateImpl,
} from '../../adapters/browser/session/sessionRepository.js';

export function createSessionRepositoryPort({
  saveSessionState = saveSessionStateImpl,
  serializeSessionState = serializeSessionStateImpl,
  parseSessionState = parseSessionStateImpl,
  inspectStoredSessionSnapshots = inspectStoredSessionSnapshotsImpl,
  restoreStoredSessionSnapshot = restoreStoredSessionSnapshotImpl,
} = {}) {
  return {
    saveSessionState,
    serializeSessionState,
    parseSessionState,
    inspectStoredSessionSnapshots,
    restoreStoredSessionSnapshot,
  };
}

const defaultSessionRepositoryPort = createSessionRepositoryPort();

export const saveSessionState = defaultSessionRepositoryPort.saveSessionState;
export const serializeSessionState = defaultSessionRepositoryPort.serializeSessionState;
export const parseSessionState = defaultSessionRepositoryPort.parseSessionState;
export const inspectStoredSessionSnapshots = defaultSessionRepositoryPort.inspectStoredSessionSnapshots;
export const restoreStoredSessionSnapshot = defaultSessionRepositoryPort.restoreStoredSessionSnapshot;
