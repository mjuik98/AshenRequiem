export const migration6To7 = {
  from: 6,
  migrate(sessionState) {
    return {
      ...sessionState,
      _version: 7,
      meta: {
        ...sessionState.meta,
        selectedStartAccessoryId: typeof sessionState.meta?.selectedStartAccessoryId === 'string'
          ? sessionState.meta.selectedStartAccessoryId
          : null,
        selectedStageId: typeof sessionState.meta?.selectedStageId === 'string'
          ? sessionState.meta.selectedStageId
          : 'ash_plains',
        selectedSeedMode: typeof sessionState.meta?.selectedSeedMode === 'string'
          ? sessionState.meta.selectedSeedMode
          : 'none',
        selectedSeedText: typeof sessionState.meta?.selectedSeedText === 'string'
          ? sessionState.meta.selectedSeedText
          : '',
        recentRuns: Array.isArray(sessionState.meta?.recentRuns)
          ? sessionState.meta.recentRuns
          : [],
      },
      activeRun: sessionState.activeRun ?? null,
    };
  },
};
