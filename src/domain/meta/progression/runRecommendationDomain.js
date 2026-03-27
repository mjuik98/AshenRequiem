function humanizeId(value) {
  if (typeof value !== 'string' || value.length === 0) return '-';
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * @param {{ analytics?: any, limit?: number }} [options]
 */
export function buildRunRecommendations({ analytics = {}, limit = 3 } = {}) {
  const source = /** @type {any} */ (analytics ?? {});
  const recommendations = [];

  if (source.stageWeakness?.stageId) {
    recommendations.push({
      title: `${source.stageWeakness.stageName ?? source.stageWeakness.stageId} 회피`,
      description: `최근 ${source.stageWeakness.stageName ?? source.stageWeakness.stageId} 승률이 ${Math.round(source.stageWeakness.winRate ?? 0)}%로 낮습니다.`,
      tone: 'warning',
    });
  }

  if (source.deathCauseSummary?.[0]?.deathCause) {
    const topCause = source.deathCauseSummary[0];
    recommendations.push({
      title: '생존형 빌드 전환',
      description: `${topCause.deathCause}에 ${topCause.count}회 패배했습니다. 방어/회복 옵션을 우선 검토하세요.`,
      tone: 'danger',
    });
  }

  if (source.archetypeRecords?.[0]?.archetypeId) {
    const bestArchetype = source.archetypeRecords[0];
    recommendations.push({
      title: `${humanizeId(bestArchetype.archetypeId)} 재도전`,
      description: `최근 가장 안정적인 archetype은 ${humanizeId(bestArchetype.archetypeId)}입니다.`,
      tone: 'info',
    });
  }

  if ((source.dailyStats?.streak ?? 0) > 0) {
    recommendations.push({
      title: `데일리 연속 ${source.dailyStats.streak}일`,
      description: `최고 연속 기록은 ${source.dailyStats.bestStreak ?? source.dailyStats.streak}일입니다.`,
      tone: 'success',
    });
  }

  return recommendations.slice(0, limit);
}
