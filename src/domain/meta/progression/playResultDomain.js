import { buildRunAnalytics } from './runAnalyticsDomain.js';
import { buildRunRecommendations } from './runRecommendationDomain.js';

export function buildRunResult(world) {
  return {
    kills: world.run.killCount,
    survivalTime: world.run.elapsedTime,
    level: world.entities.player?.level ?? 1,
    weaponsUsed: (world.entities.player?.weapons ?? []).map((weapon) => weapon.id),
    accessoriesUsed: (world.entities.player?.accessories ?? []).map((accessory) => accessory.id),
    currencyEarned: world.run.runCurrencyEarned ?? 0,
    highestCurse: world.entities.player?.curse ?? 0,
    ascensionLevel: world.run.ascensionLevel ?? 0,
    ascensionCleared: world.run.runOutcome?.type === 'victory' ? (world.run.ascensionLevel ?? 0) : null,
    outcome: world.run.runOutcome?.type ?? 'defeat',
    bossKillCount: world.run.bossKillCount ?? 0,
    archetypeId: world.run.archetypeId ?? 'vanguard',
    archetypeName: world.run.archetype?.name ?? world.run.archetypeId ?? 'vanguard',
    riskRelicId: world.run.riskRelicId ?? null,
    riskRelicName: world.run.riskRelic?.name ?? world.run.riskRelicId ?? null,
    stageId: world.run.stageId ?? 'ash_plains',
    stageName: world.run.stage?.name ?? world.run.stageId ?? 'ash_plains',
    seedMode: world.run.seedMode ?? 'none',
    seedLabel: world.run.seedLabel ?? '',
    deathCause: world.run.lastDamageSource?.label ?? world.run.lastDamageSource?.attackerId ?? null,
  };
}

export function buildWeaponSummary(world) {
  return (world.entities.player?.weapons ?? []).map((weapon) => ({
    name: weapon.name ?? weapon.id,
    level: weapon.level ?? 1,
    isEvolved: Boolean(weapon.isEvolved),
  }));
}

export function buildRecentRunEntry(world, runResult) {
  return {
    recordedAt: Date.now(),
    outcome: runResult.outcome,
    stageId: runResult.stageId,
    stageName: runResult.stageName,
    survivalTime: runResult.survivalTime,
    killCount: runResult.kills,
    level: runResult.level,
    currencyEarned: runResult.currencyEarned,
    highestCurse: runResult.highestCurse ?? 0,
    ascensionLevel: runResult.ascensionLevel ?? world.run.ascensionLevel ?? 0,
    archetypeId: runResult.archetypeId ?? world.run.archetypeId ?? 'vanguard',
    archetypeName: runResult.archetypeName ?? world.run.archetype?.name ?? world.run.archetypeId ?? 'vanguard',
    riskRelicId: runResult.riskRelicId ?? world.run.riskRelicId ?? null,
    riskRelicName: runResult.riskRelicName ?? world.run.riskRelic?.name ?? world.run.riskRelicId ?? null,
    seedMode: runResult.seedMode ?? world.run.seedMode ?? 'none',
    seedLabel: runResult.seedLabel ?? '',
    weaponIds: [...(runResult.weaponsUsed ?? [])],
    accessoryIds: [...(runResult.accessoriesUsed ?? [])],
    deathCause: runResult.deathCause ?? null,
  };
}

function buildDeathRecap({ runResult, recommendations = [] } = {}) {
  if (runResult?.outcome === 'victory') return null;

  const cause = runResult?.deathCause ?? '알 수 없는 압박';
  const stageName = runResult?.stageName ?? runResult?.stageId ?? '현재 스테이지';
  const minutes = Math.floor((runResult?.survivalTime ?? 0) / 60);
  const seconds = String(Math.floor((runResult?.survivalTime ?? 0) % 60)).padStart(2, '0');
  const leadRecommendation = recommendations[0];

  return {
    headline: `${cause}에 밀려 전열이 무너졌습니다.`,
    detail: `${stageName}에서 ${minutes}:${seconds} 지점에 전투가 종료됐습니다.`,
    action: leadRecommendation?.title
      ? `${leadRecommendation.title}부터 다시 점검하세요.`
      : '방어 장신구와 회피 여유를 먼저 확보하세요.',
  };
}

export function buildPlayResultSummary(world, session, {
  startCurrency = 0,
  prevBestTime = 0,
  prevBestLevel = 1,
  prevBestKills = 0,
  newUnlockRewardTexts = [],
  nextGoals = [],
  dailyReward = null,
} = {}) {
  const runResult = buildRunResult(world);
  const currencyEarned = Math.max(
    0,
    world.run.runCurrencyEarned ?? 0,
    (session?.meta?.currency ?? 0) - startCurrency,
  );
  const analytics = buildRunAnalytics(session?.meta ?? {});
  const recommendations = buildRunRecommendations({ analytics });
  const deathRecap = buildDeathRecap({ runResult, recommendations });

  return {
    killCount: runResult.kills,
    survivalTime: runResult.survivalTime,
    level: runResult.level,
    outcome: world.run.runOutcome?.type ?? 'defeat',
    currencyEarned,
    totalCurrency: session?.meta?.currency ?? 0,
    bestTime: prevBestTime,
    bestLevel: prevBestLevel,
    bestKills: prevBestKills,
    ascensionLevel: world.run.ascensionLevel ?? 0,
    archetypeName: world.run.archetype?.name ?? world.run.archetypeId ?? 'vanguard',
    riskRelicName: world.run.riskRelic?.name ?? world.run.riskRelicId ?? null,
    stageName: world.run.stage?.name ?? world.run.stageId ?? 'ash_plains',
    seedLabel: world.run.seedLabel ?? '',
    dailyReward,
    deathCause: world.run.lastDamageSource?.label ?? world.run.lastDamageSource?.attackerId ?? null,
    highestAscensionCleared: session?.meta?.highestAscensionCleared ?? 0,
    weapons: buildWeaponSummary(world),
    newUnlocks: [...(newUnlockRewardTexts ?? [])],
    nextGoals: [...(nextGoals ?? [])],
    recentRuns: [...(session?.meta?.recentRuns ?? [])].slice(0, 5),
    analytics,
    recommendations,
    deathRecap,
  };
}
