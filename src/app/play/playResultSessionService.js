import { updateSessionBest } from '../../state/createSessionState.js';
import { ensureCodexMeta } from '../../state/sessionMeta.js';
import {
  applyComputedSessionUnlockProgress,
  computeSessionUnlockProgress,
} from '../../state/unlockProgressFacade.js';
import { persistSession } from '../session/sessionPersistenceService.js';
import {
  buildPlayResultSummary,
  buildRecentRunEntry,
  buildRunResult,
} from '../../domain/meta/progression/playResultDomain.js';
import { buildUnlockGuideEntries } from '../../domain/meta/progression/unlockGuidanceDomain.js';
import {
  applyDailyRewardToSession,
  buildDailyRewardResult,
} from '../../domain/meta/progression/dailyChallengeDomain.js';

function appendUnique(base = [], additions = []) {
  return [...new Set([...(base ?? []), ...(additions ?? [])])];
}

function appendRecentRun(recentRuns = [], entry = null, limit = 10) {
  if (!entry) return [...(recentRuns ?? [])].slice(0, limit);
  return [entry, ...(recentRuns ?? [])].slice(0, limit);
}

function normalizeUnlockProgress(session, unlockResult = {}) {
  if (
    Array.isArray(unlockResult?.nextCompletedUnlocks)
    || Array.isArray(unlockResult?.nextUnlockedWeapons)
    || Array.isArray(unlockResult?.nextUnlockedAccessories)
  ) {
    return {
      ...unlockResult,
      nextCompletedUnlocks: [...(unlockResult.nextCompletedUnlocks ?? [])],
      nextUnlockedWeapons: [...(unlockResult.nextUnlockedWeapons ?? [])],
      nextUnlockedAccessories: [...(unlockResult.nextUnlockedAccessories ?? [])],
      newUnlockRewardTexts: [...(unlockResult.newUnlockRewardTexts ?? [])],
    };
  }

  const completedUnlockIds = unlockResult.completedUnlockIds ?? unlockResult.newlyCompletedUnlocks ?? [];
  const unlockedWeaponIds = unlockResult.unlockedWeaponIds ?? unlockResult.newlyUnlockedWeapons ?? [];
  const unlockedAccessoryIds = unlockResult.unlockedAccessoryIds ?? unlockResult.newlyUnlockedAccessories ?? [];

  return {
    ...unlockResult,
    nextCompletedUnlocks: appendUnique(session?.meta?.completedUnlocks, completedUnlockIds),
    nextUnlockedWeapons: appendUnique(session?.meta?.unlockedWeapons, unlockedWeaponIds),
    nextUnlockedAccessories: appendUnique(session?.meta?.unlockedAccessories, unlockedAccessoryIds),
    newUnlockRewardTexts: [...(unlockResult.newUnlockRewardTexts ?? [])],
  };
}

export function commitPlayResultSession(session, { world = null, runResult, unlockResult } = {}, {
  ensureCodexMetaImpl = ensureCodexMeta,
  updateSessionBestImpl = updateSessionBest,
  applyComputedSessionUnlockProgressImpl = applyComputedSessionUnlockProgress,
  computeSessionUnlockProgressImpl = computeSessionUnlockProgress,
  persistSessionImpl = persistSession,
} = {}) {
  ensureCodexMetaImpl(session);
  const dailyReward = applyDailyRewardToSession(
    session,
    buildDailyRewardResult(runResult, session.meta),
  );
  session.meta.totalRuns = (session.meta.totalRuns ?? 0) + 1;
  if ((runResult?.ascensionCleared ?? null) != null) {
    session.meta.highestAscensionCleared = Math.max(
      session.meta.highestAscensionCleared ?? 0,
      runResult.ascensionCleared,
    );
  }
  updateSessionBestImpl(session, runResult);
  const unlockProgress = normalizeUnlockProgress(
    session,
    unlockResult ?? computeSessionUnlockProgressImpl(session, runResult),
  );
  applyComputedSessionUnlockProgressImpl(session, unlockProgress);
  session.meta.recentRuns = appendRecentRun(
    session.meta.recentRuns,
    world ? buildRecentRunEntry(world, runResult) : null,
  );
  session.activeRun = null;
  persistSessionImpl(session);
  return {
    unlockProgress,
    dailyReward,
  };
}

export function processPlayResult(world, session, runtimeState = {}, deps = {}) {
  const runResult = buildRunResult(world);
  const { unlockProgress, dailyReward } = commitPlayResultSession(session, {
    world,
    runResult,
  }, deps);
  const nextGoals = buildUnlockGuideEntries(session, undefined, 3)
    .filter((entry) => !entry.done)
    .slice(0, 3)
    .map((entry) => ({
      icon: entry.icon,
      title: entry.title,
      description: entry.description,
      progressText: entry.progressText,
    }));

  return buildPlayResultSummary(world, session, {
    startCurrency: runtimeState.startCurrency,
    prevBestTime: runtimeState.prevBestTime,
    prevBestLevel: runtimeState.prevBestLevel,
    prevBestKills: runtimeState.prevBestKills,
    newUnlockRewardTexts: unlockProgress?.newUnlockRewardTexts,
    nextGoals,
    dailyReward,
  });
}
