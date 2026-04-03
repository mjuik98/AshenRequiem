export const migration1To2 = {
  from: 1,
  migrate(sessionState) {
    return {
      ...sessionState,
      _version: 2,
      last: {
        kills: sessionState.last?.kills ?? 0,
        survivalTime: sessionState.last?.survivalTime ?? 0,
        level: sessionState.last?.level ?? 1,
        weaponsUsed: sessionState.last?.weaponsUsed ?? [],
      },
    };
  },
};
