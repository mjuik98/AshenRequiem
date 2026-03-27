import {
  clearActiveRunAndSave,
} from '../session/sessionPersistenceService.js';
import {
  setRunSeedSelectionAndSave,
  setSelectedAscensionAndSave,
  setSelectedArchetypeAndSave,
  setSelectedRiskRelicAndSave,
  setSelectedStageAndSave,
  setSelectedStartAccessoryAndSave,
  setSelectedStartWeaponAndSave,
} from '../session/loadoutSelectionWriteService.js';

function normalizeRunOptions(ascensionLevelOrOptions = null) {
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

function extractStartRunDeps(ascensionLevelOrOptions, deps = {}) {
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

export function commitTitleStartWeaponSelection(
  session,
  weaponId,
  ascensionLevelOrOptions,
  gameData = {},
  {
    saveSelectionImpl = setSelectedStartWeaponAndSave,
    saveAscensionImpl = setSelectedAscensionAndSave,
    saveAccessoryImpl = setSelectedStartAccessoryAndSave,
    saveArchetypeImpl = setSelectedArchetypeAndSave,
    saveRiskRelicImpl = setSelectedRiskRelicAndSave,
    saveStageImpl = setSelectedStageAndSave,
    saveSeedImpl = setRunSeedSelectionAndSave,
    clearActiveRunImpl = clearActiveRunAndSave,
  } = {},
) {
  const options = normalizeRunOptions(ascensionLevelOrOptions);
  const weaponResult = saveSelectionImpl(session, weaponId, gameData);
  if (!weaponResult?.saved) {
    return {
      ...weaponResult,
      selectedAscensionLevel: session?.meta?.selectedAscensionLevel ?? 0,
      selectedStartAccessoryId: session?.meta?.selectedStartAccessoryId ?? null,
      selectedArchetypeId: session?.meta?.selectedArchetypeId ?? 'vanguard',
      selectedRiskRelicId: session?.meta?.selectedRiskRelicId ?? null,
      selectedStageId: session?.meta?.selectedStageId ?? 'ash_plains',
      selectedSeedMode: session?.meta?.selectedSeedMode ?? 'none',
      selectedSeedText: session?.meta?.selectedSeedText ?? '',
    };
  }

  const ascensionResult = saveAscensionImpl(session, options.ascensionLevel);
  const accessoryResult = saveAccessoryImpl(session, options.startAccessoryId, gameData);
  const archetypeResult = saveArchetypeImpl(session, options.archetypeId, gameData);
  const riskRelicResult = saveRiskRelicImpl(session, options.riskRelicId, gameData);
  const stageResult = saveStageImpl(session, options.stageId);
  const seedResult = saveSeedImpl(session, {
    seedMode: options.seedMode,
    seedText: options.seedText,
  });
  clearActiveRunImpl(session);
  return {
    saved: true,
    selectedWeaponId: weaponResult.selectedWeaponId,
    selectedAscensionLevel: ascensionResult?.selectedAscensionLevel ?? session?.meta?.selectedAscensionLevel ?? 0,
    selectedStartAccessoryId: accessoryResult?.selectedStartAccessoryId ?? session?.meta?.selectedStartAccessoryId ?? null,
    selectedArchetypeId: archetypeResult?.selectedArchetypeId ?? session?.meta?.selectedArchetypeId ?? 'vanguard',
    selectedRiskRelicId: riskRelicResult?.selectedRiskRelicId ?? session?.meta?.selectedRiskRelicId ?? null,
    selectedStageId: stageResult?.selectedStageId ?? session?.meta?.selectedStageId ?? 'ash_plains',
    selectedSeedMode: seedResult?.selectedSeedMode ?? session?.meta?.selectedSeedMode ?? 'none',
    selectedSeedText: seedResult?.selectedSeedText ?? session?.meta?.selectedSeedText ?? '',
  };
}

export function startTitleRun(
  game,
  weaponId,
  ascensionLevelOrOptions = null,
  deps = {},
) {
  const {
    commitSelectionImpl = commitTitleStartWeaponSelection,
    createPlaySceneImpl,
  } = extractStartRunDeps(ascensionLevelOrOptions, deps);

  const runOptions = normalizeRunOptions(ascensionLevelOrOptions);
  const saveResult = commitSelectionImpl(game?.session, weaponId, runOptions, game?.gameData);
  if (!saveResult?.saved) {
    return {
      saved: false,
      selectedWeaponId: saveResult?.selectedWeaponId ?? null,
      ...(saveResult?.selectedAscensionLevel != null ? { selectedAscensionLevel: saveResult.selectedAscensionLevel } : {}),
      ...(saveResult?.selectedStartAccessoryId !== undefined ? { selectedStartAccessoryId: saveResult.selectedStartAccessoryId } : {}),
      ...(saveResult?.selectedArchetypeId ? { selectedArchetypeId: saveResult.selectedArchetypeId } : {}),
      ...(saveResult?.selectedRiskRelicId !== undefined ? { selectedRiskRelicId: saveResult.selectedRiskRelicId } : {}),
      ...(saveResult?.selectedStageId ? { selectedStageId: saveResult.selectedStageId } : {}),
      ...(saveResult?.selectedSeedMode ? { selectedSeedMode: saveResult.selectedSeedMode } : {}),
      ...(saveResult?.selectedSeedText !== undefined ? { selectedSeedText: saveResult.selectedSeedText } : {}),
      nextScene: null,
    };
  }

  return {
    saved: true,
    selectedWeaponId: saveResult.selectedWeaponId,
    ...(saveResult?.selectedAscensionLevel != null ? { selectedAscensionLevel: saveResult.selectedAscensionLevel } : {}),
    ...(saveResult?.selectedStartAccessoryId !== undefined ? { selectedStartAccessoryId: saveResult.selectedStartAccessoryId } : {}),
    ...(saveResult?.selectedArchetypeId ? { selectedArchetypeId: saveResult.selectedArchetypeId } : {}),
    ...(saveResult?.selectedRiskRelicId !== undefined ? { selectedRiskRelicId: saveResult.selectedRiskRelicId } : {}),
    ...(saveResult?.selectedStageId ? { selectedStageId: saveResult.selectedStageId } : {}),
    ...(saveResult?.selectedSeedMode ? { selectedSeedMode: saveResult.selectedSeedMode } : {}),
    ...(saveResult?.selectedSeedText !== undefined ? { selectedSeedText: saveResult.selectedSeedText } : {}),
    nextScene: createPlaySceneImpl?.(game) ?? null,
  };
}

export function createTitleLoadoutApplicationService(
  game,
  {
    commitSelectionImpl = commitTitleStartWeaponSelection,
    createPlaySceneImpl,
  } = {},
) {
  return {
    commitSelection(weaponId, ascensionLevel = null) {
      return commitSelectionImpl(game?.session, weaponId, ascensionLevel, game?.gameData);
    },
    startRun(weaponId, ascensionLevelOrOptions = null) {
      return startTitleRun(game, weaponId, ascensionLevelOrOptions, {
        commitSelectionImpl,
        createPlaySceneImpl,
      });
    },
  };
}
