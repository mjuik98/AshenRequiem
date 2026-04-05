import {
  parseSessionState,
  restoreStoredSessionSnapshot as restoreStoredSessionSnapshotImpl,
} from '../../adapters/browser/session/sessionRepository.js';
import { updateSessionOptionsAndSave } from './sessionPersistenceService.js';
import { applySessionOptionsToRuntime } from './sessionRuntimeApplicationService.js';
import { buildResetState } from './sessionSnapshotCodec.js';
import { applySessionStateMutation } from './sessionSnapshotMutationService.js';

export function saveSettingsAndApplyRuntime({
  session,
  nextOptions,
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
} = {}) {
  const resolvedOptions = updateSessionOptionsAndSave(session, nextOptions);

  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }

  applySessionOptionsToRuntime(resolvedOptions, {
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
  });
  return resolvedOptions;
}

export function importSessionSnapshot({
  session,
  rawSnapshot = '',
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
} = {}) {
  const importedSession = parseSessionState(rawSnapshot);
  applySessionStateMutation({
    session,
    nextState: importedSession,
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
    resizeCanvas,
  });
  return session;
}

export function resetSessionProgress({
  session,
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
} = {}) {
  applySessionStateMutation({
    session,
    nextState: buildResetState(session),
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
    resizeCanvas,
  });
  return session;
}

export function restoreStoredSessionSnapshot({
  session,
  target = 'backup',
  storage = null,
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
} = {}) {
  const restoredSession = restoreStoredSessionSnapshotImpl(target, { storage });
  applySessionStateMutation({
    session,
    nextState: restoredSession,
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
    resizeCanvas,
  });
  return session;
}
