import {
  applyComputedSessionUnlockProgress,
  computeSessionUnlockProgress,
} from '../unlockProgressFacade.js';
import { ensureSessionMeta } from './sessionMetaState.js';

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
