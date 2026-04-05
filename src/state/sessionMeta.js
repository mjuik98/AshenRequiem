/**
 * Compatibility facade for session meta helpers.
 * Real owner modules live under src/state/session/*.
 */
export {
  appendUnique,
  createDefaultSessionMeta,
  ensureSessionMeta,
  ensureCodexMeta,
} from './session/sessionMetaState.js';
export { reconcileSessionUnlocks } from './session/sessionUnlockState.js';
