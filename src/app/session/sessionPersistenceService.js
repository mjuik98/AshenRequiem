import {
  purchasePermanentUpgrade,
  saveSession,
} from '../../state/createSessionState.js';
import { mergeSessionOptions } from '../../state/sessionOptions.js';

export function persistSession(session) {
  saveSession(session);
  return session;
}

export function setActiveRunAndSave(session, activeRun) {
  if (!session) return null;
  session.activeRun = activeRun;
  persistSession(session);
  return session.activeRun;
}

export function clearActiveRunAndSave(session) {
  if (!session) return null;
  session.activeRun = null;
  persistSession(session);
  return session.activeRun;
}

export function updateSessionOptionsAndSave(session, nextOptions) {
  session.options = mergeSessionOptions(session?.options, nextOptions);
  persistSession(session);
  return session.options;
}

export function purchasePermanentUpgradeAndSave(session, upgradeId, cost) {
  const success = purchasePermanentUpgrade(session, upgradeId, cost);
  if (success) {
    persistSession(session);
  }
  return success;
}
