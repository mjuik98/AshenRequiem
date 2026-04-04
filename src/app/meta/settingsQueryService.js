import {
  inspectStoredSessionSnapshots as inspectStoredSessionSnapshotsImpl,
  parseSessionState,
  serializeSessionState,
} from '../../adapters/browser/session/sessionRepository.js';
import { buildSessionPreviewDiff, buildSessionPreviewSummary } from './settingsPreviewDiff.js';

export function exportSessionSnapshot({ session } = {}) {
  return serializeSessionState(session);
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

export function inspectStoredSessionSnapshots(options = {}) {
  return inspectStoredSessionSnapshotsImpl(options);
}
