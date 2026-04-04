import { persistSession } from '../session/sessionPersistenceService.js';
import {
  applyActiveRunSnapshot,
  encodeActiveRunSnapshot,
} from './activeRunSnapshotCodec.js';

export function captureActiveRunSnapshot(world) {
  return encodeActiveRunSnapshot(world);
}

export function restoreActiveRunSnapshot(world, player, snapshot) {
  return applyActiveRunSnapshot(world, player, snapshot);
}

export function saveActiveRunAndPersist(session, world, {
  captureActiveRunSnapshotImpl = captureActiveRunSnapshot,
  persistSessionImpl = persistSession,
} = {}) {
  if (!session || !world?.entities?.player || world?.run?.runOutcome) {
    return { saved: false, activeRun: session?.activeRun ?? null };
  }

  const snapshot = captureActiveRunSnapshotImpl(world);
  if (!snapshot) {
    return { saved: false, activeRun: session?.activeRun ?? null };
  }

  session.activeRun = snapshot;
  persistSessionImpl(session);
  return { saved: true, activeRun: snapshot };
}

export function clearActiveRunAndPersist(session, {
  persistSessionImpl = persistSession,
} = {}) {
  if (!session) return { saved: false, activeRun: null };
  session.activeRun = null;
  persistSessionImpl(session);
  return { saved: true, activeRun: null };
}
