function findCurrentBeat(timeline = [], elapsedTime = 0) {
  return timeline.find((beat) => elapsedTime >= (beat.from ?? 0) && elapsedTime < (beat.to ?? Number.POSITIVE_INFINITY)) ?? null;
}

function findNextBeat(timeline = [], elapsedTime = 0) {
  return timeline.find((beat) => (beat.from ?? Number.POSITIVE_INFINITY) > elapsedTime) ?? null;
}

function findNextBoss(bossData = [], elapsedTime = 0) {
  return bossData.find((boss) => (boss?.at ?? Number.POSITIVE_INFINITY) > elapsedTime) ?? null;
}

export function createDefaultEncounterState() {
  return {
    currentBeat: null,
    nextBeat: null,
    nextBeatStartsIn: null,
    nextBossAt: null,
    nextBossStartsIn: null,
  };
}

export function resolveEncounterState({
  elapsedTime = 0,
  stage = null,
  bossData = [],
} = {}) {
  const timeline = Array.isArray(stage?.encounterTimeline) ? stage.encounterTimeline : [];
  const currentBeat = findCurrentBeat(timeline, elapsedTime) ?? {
    id: 'default',
    intensity: 'steady',
    label: '안정 구간',
    summaryText: '현재 전장은 비교적 안정적입니다.',
    spawnRateMult: 1,
    gimmickIntervalMult: 1,
  };
  const nextBeat = findNextBeat(timeline, elapsedTime);
  const nextBoss = findNextBoss(Array.isArray(bossData) ? bossData : [], elapsedTime);

  return {
    currentBeat,
    nextBeat,
    nextBeatStartsIn: nextBeat ? Math.max(0, Math.round((nextBeat.from ?? elapsedTime) - elapsedTime)) : null,
    nextBossAt: nextBoss?.at ?? null,
    nextBossStartsIn: nextBoss ? Math.max(0, Math.round((nextBoss.at ?? elapsedTime) - elapsedTime)) : null,
  };
}
