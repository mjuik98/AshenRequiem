function clampWindowSeconds(value, fallback = 300) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function findActiveWave(waveData = [], timeSeconds = 0) {
  return waveData.find((wave) => timeSeconds >= wave.from && timeSeconds < wave.to)
    ?? waveData[waveData.length - 1]
    ?? null;
}

function computeAverageWaveRates(waveData = [], stageWindowSeconds = 300) {
  let weightedSpawn = 0;
  let weightedProp = 0;
  let coveredSeconds = 0;
  let peakSpawnPerSecond = 0;
  let peakEliteChance = 0;

  for (const wave of waveData) {
    const from = Number.isFinite(wave?.from) ? wave.from : 0;
    const to = Number.isFinite(wave?.to) ? Math.min(wave.to, stageWindowSeconds) : stageWindowSeconds;
    if (to <= from) continue;

    const duration = to - from;
    coveredSeconds += duration;
    weightedSpawn += (wave.spawnPerSecond ?? 0) * duration;
    weightedProp += (wave.propSpawnPerSecond ?? 0) * duration;
    peakSpawnPerSecond = Math.max(peakSpawnPerSecond, wave.spawnPerSecond ?? 0);
    peakEliteChance = Math.max(peakEliteChance, wave.eliteChance ?? 0);
  }

  const denominator = coveredSeconds > 0 ? coveredSeconds : stageWindowSeconds;
  return {
    averageSpawnPerSecond: weightedSpawn / denominator,
    averagePropSpawnPerSecond: weightedProp / denominator,
    peakSpawnPerSecond,
    peakEliteChance,
  };
}

function computeTimelineStats(stage = {}, stageWindowSeconds = 300) {
  const timeline = stage.encounterTimeline ?? [];
  if (timeline.length === 0) {
    return {
      averageSpawnRateMult: 1,
      peakSpawnRateMult: 1,
      averageGimmickIntervalMult: 1,
      bossWindowLeadSeconds: stageWindowSeconds,
      beatCount: 0,
    };
  }

  let weightedSpawnRate = 0;
  let weightedGimmickInterval = 0;
  let coveredSeconds = 0;
  let peakSpawnRateMult = 1;
  let lastBeatStart = 0;

  for (const beat of timeline) {
    const from = Number.isFinite(beat?.from) ? beat.from : 0;
    const to = Number.isFinite(beat?.to) ? Math.min(beat.to, stageWindowSeconds) : stageWindowSeconds;
    if (to <= from) continue;

    const duration = to - from;
    coveredSeconds += duration;
    weightedSpawnRate += (beat.spawnRateMult ?? 1) * duration;
    weightedGimmickInterval += (beat.gimmickIntervalMult ?? 1) * duration;
    peakSpawnRateMult = Math.max(peakSpawnRateMult, beat.spawnRateMult ?? 1);
    lastBeatStart = Math.max(lastBeatStart, from);
  }

  const denominator = coveredSeconds > 0 ? coveredSeconds : stageWindowSeconds;
  return {
    averageSpawnRateMult: weightedSpawnRate / denominator,
    peakSpawnRateMult,
    averageGimmickIntervalMult: weightedGimmickInterval / denominator,
    bossWindowLeadSeconds: Math.max(0, stageWindowSeconds - lastBeatStart),
    beatCount: timeline.length,
  };
}

function computeGimmickCadence(stage = {}, stageWindowSeconds = 300) {
  let totalTriggers = 0;

  for (const gimmick of stage.gimmicks ?? []) {
    const startAt = Number.isFinite(gimmick?.startAt) ? gimmick.startAt : 0;
    if (startAt >= stageWindowSeconds) continue;

    const interval = Number.isFinite(gimmick?.interval) && gimmick.interval > 0
      ? gimmick.interval
      : stageWindowSeconds;
    const remainingWindow = Math.max(0, stageWindowSeconds - startAt);
    totalTriggers += 1 + Math.floor(remainingWindow / interval);
  }

  return (totalTriggers / stageWindowSeconds) * 300;
}

function roundMetric(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

export function buildEncounterAuthoringMetrics({
  stageData = [],
  waveData = [],
  bossData = [],
  stageWindowSeconds = 300,
} = {}) {
  const normalizedWindow = clampWindowSeconds(stageWindowSeconds, 300);
  const firstBossAt = bossData[0]?.at ?? normalizedWindow;
  const lastBossAt = bossData[bossData.length - 1]?.at ?? firstBossAt;
  const cadenceSamples = bossData
    .slice(1)
    .map((boss, index) => boss.at - bossData[index].at)
    .filter((value) => Number.isFinite(value) && value > 0);
  const waveRates = computeAverageWaveRates(waveData, normalizedWindow);

  const stages = stageData.map((stage) => {
    const timeline = computeTimelineStats(stage, normalizedWindow);
    const midpointWave = findActiveWave(waveData, normalizedWindow / 2);
    const baseEliteChance = midpointWave?.eliteChance ?? waveRates.peakEliteChance ?? 0;
    const gimmicksPerFiveMinutes = computeGimmickCadence(stage, normalizedWindow);
    const expectedAvgSpawnPerSecond = waveRates.averageSpawnPerSecond
      * (stage.spawnRateMult ?? 1)
      * timeline.averageSpawnRateMult;
    const expectedPeakSpawnPerSecond = waveRates.peakSpawnPerSecond
      * (stage.spawnRateMult ?? 1)
      * timeline.peakSpawnRateMult;
    const pressureScore = expectedAvgSpawnPerSecond
      * (stage.enemyHpMult ?? 1)
      * (stage.enemySpeedMult ?? 1)
      * (1 + ((baseEliteChance + (stage.eliteChanceBonus ?? 0)) * 2))
      * (1 + (gimmicksPerFiveMinutes / 20));

    return {
      stageId: stage.id,
      stageName: stage.name ?? stage.id,
      pressureScore: roundMetric(pressureScore),
      gimmicksPerFiveMinutes: roundMetric(gimmicksPerFiveMinutes),
      expectedAvgSpawnPerSecond: roundMetric(expectedAvgSpawnPerSecond),
      expectedPeakSpawnPerSecond: roundMetric(expectedPeakSpawnPerSecond),
      expectedRewardMultiplier: roundMetric(stage.rewardMult ?? 1),
      bossWindowLeadSeconds: roundMetric(Math.min(firstBossAt, timeline.bossWindowLeadSeconds)),
      beatCount: timeline.beatCount,
      stageDirectiveTitle: stage.stageDirective?.title ?? '',
    };
  });

  return {
    global: {
      stageWindowSeconds: normalizedWindow,
      averageSpawnPerSecond: roundMetric(waveRates.averageSpawnPerSecond),
      peakSpawnPerSecond: roundMetric(waveRates.peakSpawnPerSecond),
      averagePropSpawnPerSecond: roundMetric(waveRates.averagePropSpawnPerSecond),
      bossCount: bossData.length,
      firstBossAt: roundMetric(firstBossAt),
      lastBossAt: roundMetric(lastBossAt),
      averageBossCadenceSeconds: roundMetric(
        cadenceSamples.length > 0
          ? cadenceSamples.reduce((sum, value) => sum + value, 0) / cadenceSamples.length
          : 0,
      ),
    },
    stages,
  };
}
