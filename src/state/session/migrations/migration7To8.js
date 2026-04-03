export const migration7To8 = {
  from: 7,
  migrate(sessionState) {
    return {
      ...sessionState,
      _version: 8,
      meta: {
        ...sessionState.meta,
        selectedArchetypeId: typeof sessionState.meta?.selectedArchetypeId === 'string'
          ? sessionState.meta.selectedArchetypeId
          : 'vanguard',
        selectedRiskRelicId: typeof sessionState.meta?.selectedRiskRelicId === 'string'
          ? sessionState.meta.selectedRiskRelicId
          : null,
      },
    };
  },
};
