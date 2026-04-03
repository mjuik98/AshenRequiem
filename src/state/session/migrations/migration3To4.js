export const migration3To4 = {
  from: 3,
  migrate(sessionState) {
    return {
      ...sessionState,
      _version: 4,
      meta: {
        ...sessionState.meta,
        enemyKills: sessionState.meta?.enemyKills ?? {},
        enemiesEncountered: sessionState.meta?.enemiesEncountered ?? [],
        killedBosses: sessionState.meta?.killedBosses ?? [],
        weaponsUsedAll: sessionState.meta?.weaponsUsedAll ?? [],
        accessoriesOwnedAll: sessionState.meta?.accessoriesOwnedAll ?? [],
        evolvedWeapons: sessionState.meta?.evolvedWeapons ?? [],
        totalRuns: sessionState.meta?.totalRuns ?? 0,
      },
    };
  },
};
