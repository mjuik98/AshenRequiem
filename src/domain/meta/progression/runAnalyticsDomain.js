function countValues(values = []) {
  const counts = new Map();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function getTopEntry(values = []) {
  const counts = countValues(values);
  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  return ranked[0]?.[0] ?? null;
}

export function buildRunAnalytics(meta = {}) {
  const recentRuns = Array.isArray(meta?.recentRuns) ? meta.recentRuns : [];
  const stageBuckets = new Map();
  const deathBuckets = new Map();

  for (const run of recentRuns) {
    const stageId = run?.stageId ?? 'unknown_stage';
    const current = stageBuckets.get(stageId) ?? {
      stageId,
      stageName: run?.stageName ?? stageId,
      runs: 0,
      victories: 0,
      bestSurvivalTime: 0,
    };
    current.runs += 1;
    if (run?.outcome === 'victory') current.victories += 1;
    current.bestSurvivalTime = Math.max(current.bestSurvivalTime, Number(run?.survivalTime) || 0);
    stageBuckets.set(stageId, current);

    if (run?.outcome !== 'victory' && run?.deathCause) {
      deathBuckets.set(run.deathCause, (deathBuckets.get(run.deathCause) ?? 0) + 1);
    }
  }

  const victories = recentRuns.filter((run) => run?.outcome === 'victory').length;
  const defeats = recentRuns.filter((run) => run?.outcome !== 'victory').length;
  const dailyRuns = recentRuns.filter((run) => run?.seedMode === 'daily').length;
  const dailyVictories = recentRuns.filter((run) => run?.seedMode === 'daily' && run?.outcome === 'victory').length;

  return {
    victories,
    defeats,
    winRate: recentRuns.length > 0 ? (victories / recentRuns.length) * 100 : 0,
    dailyStats: {
      runs: dailyRuns,
      victories: dailyVictories,
      winRate: dailyRuns > 0 ? (dailyVictories / dailyRuns) * 100 : 0,
    },
    stageRecords: [...stageBuckets.values()]
      .sort((left, right) => right.runs - left.runs || right.bestSurvivalTime - left.bestSurvivalTime),
    deathCauseSummary: [...deathBuckets.entries()]
      .map(([deathCause, count]) => ({ deathCause, count }))
      .sort((left, right) => right.count - left.count),
    favoriteLoadout: {
      weaponId: getTopEntry([
        ...(meta?.weaponsUsedAll ?? []),
        ...recentRuns.flatMap((run) => run?.weaponIds ?? []),
      ]),
      accessoryId: getTopEntry([
        ...(meta?.accessoriesOwnedAll ?? []),
        ...recentRuns.flatMap((run) => run?.accessoryIds ?? []),
      ]),
      archetypeId: getTopEntry(recentRuns.map((run) => run?.archetypeId)),
      riskRelicId: getTopEntry(recentRuns.map((run) => run?.riskRelicId)),
    },
  };
}
