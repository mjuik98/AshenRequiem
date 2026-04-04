function getTotalKills(session) {
  return Object.values(session?.meta?.enemyKills ?? {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function getBossKills(session) {
  return (session?.meta?.killedBosses ?? []).length;
}

function getRecentRuns(session) {
  return Array.isArray(session?.meta?.recentRuns) ? session.meta.recentRuns : [];
}

function getHighestCurrency(session) {
  return Math.max(0, ...getRecentRuns(session).map((entry) => Number(entry?.currencyEarned) || 0));
}

function getHighestCurse(session) {
  return Math.max(0, ...getRecentRuns(session).map((entry) => Number(entry?.highestCurse) || 0));
}

function getIconForUnlock(unlock) {
  if (unlock?.targetType === 'weapon') return '⚔';
  if (unlock?.targetType === 'accessory') return '◈';
  return '✦';
}

function buildPrimitiveMetrics(unlock, session) {
  const conditionValue = Number(unlock?.conditionValue) || 0;
  const meta = session?.meta ?? {};
  const best = session?.best ?? {};
  const weaponsUsed = new Set(meta.weaponsUsedAll ?? []);
  const evolvedWeapons = new Set(meta.evolvedWeapons ?? []);

  switch (unlock?.conditionType) {
    case 'total_kills_gte': {
      const totalKills = getTotalKills(session);
      return {
        pct: conditionValue > 0 ? Math.min(100, totalKills / conditionValue * 100) : 0,
        progressText: `${totalKills} / ${conditionValue}`,
      };
    }
    case 'survival_time_gte': {
      const bestTime = best.survivalTime ?? 0;
      return {
        pct: conditionValue > 0 ? Math.min(100, bestTime / conditionValue * 100) : 0,
        progressText: `${Math.floor(bestTime)} / ${conditionValue}초`,
      };
    }
    case 'boss_kills_gte': {
      const bossKills = getBossKills(session);
      return {
        pct: conditionValue > 0 ? Math.min(100, bossKills / conditionValue * 100) : 0,
        progressText: `${bossKills} / ${conditionValue}`,
      };
    }
    case 'weapon_owned_once': {
      const owned = weaponsUsed.has(unlock.conditionValue);
      return {
        pct: owned ? 100 : 0,
        progressText: owned ? '달성' : String(unlock.conditionValue),
      };
    }
    case 'weapon_evolved_once': {
      const evolved = evolvedWeapons.has(unlock.conditionValue);
      return {
        pct: evolved ? 100 : 0,
        progressText: evolved ? '달성' : String(unlock.conditionValue),
      };
    }
    case 'currency_earned_gte': {
      const highestCurrency = getHighestCurrency(session);
      return {
        pct: conditionValue > 0 ? Math.min(100, highestCurrency / conditionValue * 100) : 0,
        progressText: `${highestCurrency} / ${conditionValue}`,
      };
    }
    case 'curse_gte': {
      const highestCurse = getHighestCurse(session);
      return {
        pct: conditionValue > 0 ? Math.min(100, highestCurse / conditionValue * 100) : 0,
        progressText: `${Math.round(highestCurse * 100)}% / ${Math.round(conditionValue * 100)}%`,
      };
    }
    case 'ascension_clear_gte': {
      const highestAscension = meta.highestAscensionCleared ?? 0;
      return {
        pct: conditionValue > 0 ? Math.min(100, highestAscension / conditionValue * 100) : 0,
        progressText: `A${highestAscension} / A${conditionValue}`,
      };
    }
    default:
      return {
        pct: 0,
        progressText: '-',
      };
  }
}

export function buildUnlockProgressMetrics(unlock, session) {
  if (!unlock) {
    return { pct: 0, progressText: '-' };
  }

  if (unlock.conditionType === 'all_of' || unlock.conditionType === 'any_of') {
    const conditions = Array.isArray(unlock.conditions) ? unlock.conditions : [];
    const parts = conditions.map((condition) => buildUnlockProgressMetrics(condition, session));
    const pctValues = parts.map((entry) => entry?.pct ?? 0);
    return {
      pct: unlock.conditionType === 'all_of'
        ? (pctValues.length ? pctValues.reduce((sum, value) => sum + value, 0) / pctValues.length : 0)
        : (pctValues.length ? Math.max(...pctValues) : 0),
      progressText: parts.map((entry) => entry?.progressText ?? '-').join(
        unlock.conditionType === 'all_of' ? ' · ' : ' / ',
      ),
    };
  }

  return buildPrimitiveMetrics(unlock, session);
}

export function buildUnlockGuideEntries(session, entries = [], limit = Number.POSITIVE_INFINITY) {
  const completedUnlocks = new Set(session?.meta?.completedUnlocks ?? []);

  return (entries ?? [])
    .filter((unlock) => unlock?.id)
    .map((unlock) => {
      const metrics = buildUnlockProgressMetrics(unlock, session);
      const done = completedUnlocks.has(unlock.id);
      return {
        ...unlock,
        icon: getIconForUnlock(unlock),
        pct: done ? 100 : metrics.pct,
        progressText: done ? '해금 완료' : metrics.progressText,
        done,
      };
    })
    .sort((left, right) => {
      if (left.done !== right.done) return left.done ? 1 : -1;
      return (right.pct ?? 0) - (left.pct ?? 0);
    })
    .slice(0, limit);
}
