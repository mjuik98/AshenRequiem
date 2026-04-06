import {
  inspectStoredSessionSnapshots as inspectStoredSessionSnapshotsImpl,
  parseSessionState,
  serializeSessionState,
} from './sessionRepositoryPort.js';
import { buildSessionPreviewDiff, buildSessionPreviewSummary } from './sessionSnapshotPreview.js';

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
