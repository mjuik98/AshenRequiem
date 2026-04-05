export function normalizeTitleRunOptions(ascensionLevelOrOptions = null) {
  if (
    ascensionLevelOrOptions
    && typeof ascensionLevelOrOptions === 'object'
    && !Array.isArray(ascensionLevelOrOptions)
  ) {
    return {
      ascensionLevel: ascensionLevelOrOptions.ascensionLevel ?? null,
      startAccessoryId: ascensionLevelOrOptions.startAccessoryId ?? null,
      archetypeId: ascensionLevelOrOptions.archetypeId ?? null,
      riskRelicId: ascensionLevelOrOptions.riskRelicId ?? null,
      stageId: ascensionLevelOrOptions.stageId ?? null,
      seedMode: ascensionLevelOrOptions.seedMode ?? 'none',
      seedText: ascensionLevelOrOptions.seedText ?? '',
    };
  }

  return {
    ascensionLevel: ascensionLevelOrOptions,
    startAccessoryId: null,
    archetypeId: null,
    riskRelicId: null,
    stageId: null,
    seedMode: 'none',
    seedText: '',
  };
}

export function extractTitleRunDeps(ascensionLevelOrOptions, deps = {}) {
  if (
    ascensionLevelOrOptions
    && typeof ascensionLevelOrOptions === 'object'
    && !Array.isArray(ascensionLevelOrOptions)
  ) {
    return {
      commitSelectionImpl: ascensionLevelOrOptions.commitSelectionImpl ?? deps.commitSelectionImpl,
      createPlaySceneImpl: ascensionLevelOrOptions.createPlaySceneImpl ?? deps.createPlaySceneImpl,
    };
  }

  return deps;
}
