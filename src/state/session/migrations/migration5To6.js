export const migration5To6 = {
  from: 5,
  migrate(sessionState) {
    return {
      ...sessionState,
      _version: 6,
      meta: {
        ...sessionState.meta,
        selectedAscensionLevel: Number.isFinite(sessionState.meta?.selectedAscensionLevel)
          ? sessionState.meta.selectedAscensionLevel
          : 0,
        highestAscensionCleared: Number.isFinite(sessionState.meta?.highestAscensionCleared)
          ? sessionState.meta.highestAscensionCleared
          : 0,
      },
    };
  },
};
