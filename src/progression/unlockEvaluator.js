function getTotalKills(session) {
  return Object.values(session?.meta?.enemyKills ?? {}).reduce((sum, value) => sum + value, 0);
}

function isUnlockSatisfied(unlock, session, runResult) {
  const conditionValue = unlock.conditionValue;
  const meta = session?.meta ?? {};

  switch (unlock.conditionType) {
    case 'total_kills_gte':
      return getTotalKills(session) >= conditionValue;
    case 'survival_time_gte':
      return (runResult?.survivalTime ?? 0) >= conditionValue;
    case 'boss_kills_gte':
      return (meta.killedBosses?.length ?? 0) >= conditionValue;
    case 'weapon_owned_once':
      return (meta.weaponsUsedAll ?? []).includes(conditionValue)
        || (runResult?.weaponsUsed ?? []).includes(conditionValue);
    case 'weapon_evolved_once':
      return (meta.evolvedWeapons ?? []).includes(conditionValue);
    default:
      return false;
  }
}

export function evaluateUnlocks({ session, runResult, unlockData }) {
  const completedUnlocks = new Set(session?.meta?.completedUnlocks ?? []);
  const unlockedWeapons = [];
  const unlockedAccessories = [];
  const newlyCompletedUnlocks = [];

  for (const unlock of unlockData ?? []) {
    if (!unlock?.id || completedUnlocks.has(unlock.id)) continue;
    if (!isUnlockSatisfied(unlock, session, runResult)) continue;

    newlyCompletedUnlocks.push(unlock.id);
    if (unlock.targetType === 'weapon') {
      unlockedWeapons.push(unlock.targetId);
    } else if (unlock.targetType === 'accessory') {
      unlockedAccessories.push(unlock.targetId);
    }
  }

  return {
    newlyCompletedUnlocks,
    newlyUnlockedWeapons: unlockedWeapons,
    newlyUnlockedAccessories: unlockedAccessories,
  };
}
