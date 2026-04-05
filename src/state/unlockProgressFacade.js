import { unlockData } from '../data/unlockData.js';
import {
  applyUnlockProgress,
  computeUnlockProgress,
} from '../domain/meta/progression/unlockProgressRuntime.js';

export function computeSessionUnlockProgress(session, runResult, unlockEntries = unlockData) {
  return computeUnlockProgress(session, runResult, unlockEntries);
}

export function applyComputedSessionUnlockProgress(session, unlockProgress) {
  return applyUnlockProgress(session, unlockProgress);
}

export function applySessionUnlockProgress(session, runResult, unlockEntries = unlockData) {
  const unlockProgress = computeSessionUnlockProgress(session, runResult, unlockEntries);
  applyComputedSessionUnlockProgress(session, unlockProgress);
  return unlockProgress;
}
