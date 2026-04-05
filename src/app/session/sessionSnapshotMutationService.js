import { applySessionOptionsToRuntime } from './sessionRuntimeApplicationService.js';
import { persistSession } from './sessionPersistenceService.js';
import { replaceSessionState } from './sessionSnapshotCodec.js';

export function applySessionStateMutation({
  session,
  nextState,
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
  persistSessionImpl = persistSession,
  replaceSessionStateImpl = replaceSessionState,
} = {}) {
  replaceSessionStateImpl(session, nextState);
  applySessionOptionsToRuntime(session.options, {
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
  });

  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }

  persistSessionImpl(session);
  return session;
}
