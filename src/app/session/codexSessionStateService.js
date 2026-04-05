import { ensureCodexMeta } from '../../state/session/sessionMetaState.js';
import { reconcileSessionUnlocks } from '../../state/session/sessionUnlockState.js';

export function prepareCodexSessionState(session) {
  ensureCodexMeta(session);
  reconcileSessionUnlocks(session);
  return session;
}
