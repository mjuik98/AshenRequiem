import { createSessionState } from '../../state/createSessionState.js';
import {
  normalizeSessionOptions,
} from '../../state/sessionOptions.js';
import { applySessionOptionsToRuntime } from '../session/sessionRuntimeApplicationService.js';
import {
  inspectStoredSessionSnapshots as inspectStoredSessionSnapshotsImpl,
  parseSessionState,
  restoreStoredSessionSnapshot as restoreStoredSessionSnapshotImpl,
  serializeSessionState,
} from '../../state/session/sessionRepository.js';
import {
  persistSession,
  updateSessionOptionsAndSave,
} from '../session/sessionPersistenceService.js';
import { buildSessionPreviewDiff, buildSessionPreviewSummary } from './settingsPreviewDiff.js';
import { buildResetState } from './settingsSessionCodec.js';
import { applySessionStateMutation } from './settingsSessionMutation.js';

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

export function exportSessionSnapshot({ session } = {}) {
  return serializeSessionState(session);
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

export function previewSessionSnapshotImport({
  session,
  rawSnapshot = '',
} = {}) {
  const importedSession = parseSessionState(rawSnapshot);
  return {
    summary: buildSessionPreviewSummary(importedSession),
    diffLines: buildSessionPreviewDiff(session, importedSession),
    importedSession,
  };
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

export function inspectStoredSessionSnapshots(options = {}) {
  return inspectStoredSessionSnapshotsImpl(options);
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
