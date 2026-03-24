import { updateSessionBest } from '../../state/createSessionState.js';
import { ensureCodexMeta } from '../../state/sessionMeta.js';
import { persistSession } from '../../state/sessionFacade.js';
import {
  applyComputedSessionUnlockProgress,
  computeSessionUnlockProgress,
} from '../../state/unlockProgressFacade.js';

function appendUnique(base = [], additions = []) {
  return [...new Set([...(base ?? []), ...(additions ?? [])])];
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

function buildRunResult(world) {
  return {
    kills: world.killCount,
    survivalTime: world.elapsedTime,
    level: world.player?.level ?? 1,
    weaponsUsed: (world.player?.weapons ?? []).map((weapon) => weapon.id),
  };
}

function buildWeaponSummary(world) {
  return (world.player?.weapons ?? []).map((weapon) => ({
    name: weapon.name ?? weapon.id,
    level: weapon.level ?? 1,
    isEvolved: Boolean(weapon.isEvolved),
  }));
}

export function buildPlayResultSummary(world, session, {
  startCurrency = 0,
  prevBestTime = 0,
  prevBestLevel = 1,
  prevBestKills = 0,
  newUnlockRewardTexts = [],
} = {}) {
  const runResult = buildRunResult(world);
  const currencyEarned = Math.max(
    0,
    world.runCurrencyEarned ?? 0,
    (session?.meta?.currency ?? 0) - startCurrency,
  );

  return {
    killCount: runResult.kills,
    survivalTime: runResult.survivalTime,
    level: runResult.level,
    outcome: world.runOutcome?.type ?? 'defeat',
    currencyEarned,
    totalCurrency: session?.meta?.currency ?? 0,
    bestTime: prevBestTime,
    bestLevel: prevBestLevel,
    bestKills: prevBestKills,
    weapons: buildWeaponSummary(world),
    newUnlocks: [...(newUnlockRewardTexts ?? [])],
  };
}

export function commitPlayResultSession(session, { runResult, unlockResult } = {}, {
  ensureCodexMetaImpl = ensureCodexMeta,
  updateSessionBestImpl = updateSessionBest,
  applyComputedSessionUnlockProgressImpl = applyComputedSessionUnlockProgress,
  computeSessionUnlockProgressImpl = computeSessionUnlockProgress,
  persistSessionImpl = persistSession,
} = {}) {
  ensureCodexMetaImpl(session);
  session.meta.totalRuns = (session.meta.totalRuns ?? 0) + 1;
  updateSessionBestImpl(session, runResult);
  const unlockProgress = normalizeUnlockProgress(
    session,
    unlockResult ?? computeSessionUnlockProgressImpl(session, runResult),
  );
  applyComputedSessionUnlockProgressImpl(session, unlockProgress);
  persistSessionImpl(session);
  return unlockProgress;
}

export function processPlayResult(world, session, runtimeState = {}, deps = {}) {
  const runResult = buildRunResult(world);
  const unlockProgress = commitPlayResultSession(session, {
    runResult,
  }, deps);

  return buildPlayResultSummary(world, session, {
    startCurrency: runtimeState.startCurrency,
    prevBestTime: runtimeState.prevBestTime,
    prevBestLevel: runtimeState.prevBestLevel,
    prevBestKills: runtimeState.prevBestKills,
    newUnlockRewardTexts: unlockProgress?.newUnlockRewardTexts,
  });
}
