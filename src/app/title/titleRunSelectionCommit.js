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
import { normalizeTitleRunOptions } from './titleRunOptions.js';

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
  const options = normalizeTitleRunOptions(ascensionLevelOrOptions);
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

  const ascensionResult = saveAscensionImpl(session, options.ascensionLevel, gameData);
  const accessoryResult = saveAccessoryImpl(session, options.startAccessoryId, gameData);
  const archetypeResult = saveArchetypeImpl(session, options.archetypeId, gameData);
  const riskRelicResult = saveRiskRelicImpl(session, options.riskRelicId, gameData);
  const stageResult = saveStageImpl(session, options.stageId, gameData);
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
