import { mergeSessionOptions } from '../../state/sessionOptions.js';
import { purchasePermanentUpgrade } from '../../state/session/sessionCommands.js';
import { saveSessionState } from '../../state/session/sessionRepository.js';

export function createSessionPersistenceService({
  persistSessionImpl = saveSessionState,
  mergeSessionOptionsImpl = mergeSessionOptions,
  purchasePermanentUpgradeImpl = purchasePermanentUpgrade,
} = {}) {
  function persistSession(session) {
    persistSessionImpl(session);
    return session;
  }

  function setActiveRunAndSave(session, activeRun) {
    if (!session) return null;
    session.activeRun = activeRun;
    persistSession(session);
    return session.activeRun;
  }

  function clearActiveRunAndSave(session) {
    if (!session) return null;
    session.activeRun = null;
    persistSession(session);
    return session.activeRun;
  }

  function updateSessionOptionsAndSave(session, nextOptions) {
    session.options = mergeSessionOptionsImpl(session?.options, nextOptions);
    persistSession(session);
    return session.options;
  }

  function purchasePermanentUpgradeAndSave(session, upgradeId, cost) {
    const success = purchasePermanentUpgradeImpl(session, upgradeId, cost);
    if (success) {
      persistSession(session);
    }
    return success;
  }

  return {
    persistSession,
    setActiveRunAndSave,
    clearActiveRunAndSave,
    updateSessionOptionsAndSave,
    purchasePermanentUpgradeAndSave,
  };
}

const defaultSessionPersistenceService = createSessionPersistenceService();

export const persistSession = defaultSessionPersistenceService.persistSession;
export const setActiveRunAndSave = defaultSessionPersistenceService.setActiveRunAndSave;
export const clearActiveRunAndSave = defaultSessionPersistenceService.clearActiveRunAndSave;
export const updateSessionOptionsAndSave = defaultSessionPersistenceService.updateSessionOptionsAndSave;
export const purchasePermanentUpgradeAndSave = defaultSessionPersistenceService.purchasePermanentUpgradeAndSave;
