import { evaluateUnlocks } from './unlockEvaluator.js';

function appendUniqueValues(base = [], additions = []) {
  return [...new Set([...(base ?? []), ...(additions ?? [])])];
}

function buildUnlockRewardTexts(unlockIds = [], unlockEntries = []) {
  return unlockIds
    .map((unlockId) => unlockEntries.find((unlock) => unlock.id === unlockId)?.rewardText)
    .filter(Boolean);
}

export function computeUnlockProgress(session, runResult, unlockEntries = []) {
  const unlockResult = evaluateUnlocks({
    session,
    runResult,
    unlockData: unlockEntries,
  });

  return {
    ...unlockResult,
    nextCompletedUnlocks: appendUniqueValues(
      session?.meta?.completedUnlocks,
      unlockResult.newlyCompletedUnlocks,
    ),
    nextUnlockedWeapons: appendUniqueValues(
      session?.meta?.unlockedWeapons,
      unlockResult.newlyUnlockedWeapons,
    ),
    nextUnlockedAccessories: appendUniqueValues(
      session?.meta?.unlockedAccessories,
      unlockResult.newlyUnlockedAccessories,
    ),
    newUnlockRewardTexts: buildUnlockRewardTexts(
      unlockResult.newlyCompletedUnlocks,
      unlockEntries,
    ),
  };
}

export function applyUnlockProgress(session, unlockProgress) {
  if (!session?.meta || !unlockProgress) return session;

  session.meta.completedUnlocks = [...(unlockProgress.nextCompletedUnlocks ?? [])];
  session.meta.unlockedWeapons = [...(unlockProgress.nextUnlockedWeapons ?? [])];
  session.meta.unlockedAccessories = [...(unlockProgress.nextUnlockedAccessories ?? [])];
  return session;
}
