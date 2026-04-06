import { unlockData } from '../../data/unlockData.js';
import {
  applyUnlockProgress,
  computeUnlockProgress,
} from '../../domain/meta/progression/unlockProgressRuntime.js';
import { ensureSessionMeta } from './sessionMetaState.js';

export function computeSessionUnlockProgress(session, runResult, unlockEntries = unlockData) {
  return computeUnlockProgress(session, runResult, unlockEntries);
}

export function applyComputedSessionUnlockProgress(session, unlockProgress) {
  return applyUnlockProgress(session, unlockProgress);
}

export function reconcileSessionUnlocks(session) {
  const meta = ensureSessionMeta(session);
  const unlockProgress = computeSessionUnlockProgress(session, {
    kills: session?.best?.kills ?? 0,
    survivalTime: session?.best?.survivalTime ?? 0,
    level: session?.best?.level ?? 1,
    weaponsUsed: meta.weaponsUsedAll ?? [],
  });
  applyComputedSessionUnlockProgress(session, unlockProgress);

  return session;
}
