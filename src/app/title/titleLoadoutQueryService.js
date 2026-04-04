import { resolveStartWeaponSelection } from '../../domain/meta/loadout/startLoadoutDomain.js';
import {
  buildStartLoadoutAdvancedSummary,
  buildStartLoadoutSeedPreviewText,
} from '../../domain/meta/loadout/startLoadoutPresentation.js';
import { buildUnlockGuideEntries } from '../../domain/meta/progression/unlockGuidanceDomain.js';

export {
  buildStartLoadoutAdvancedSummary,
  buildStartLoadoutSeedPreviewText,
};

export function getAvailableStartWeapons(gameData, session) {
  return resolveStartWeaponSelection(gameData, session).availableStartWeapons;
}

export function buildTitleLoadoutConfig(gameData, session, callbacks = {}) {
  const resolved = resolveStartWeaponSelection(gameData, session);
  const recommendedGoals = buildUnlockGuideEntries(session, gameData?.unlockData ?? [])
    .filter((entry) => !entry.done)
    .slice(0, 3);

  return {
    weapons: resolved.availableStartWeapons,
    accessories: resolved.availableStartAccessories,
    archetypes: resolved.archetypes,
    riskRelics: resolved.riskRelics,
    canStart: resolved.canStart,
    selectedWeaponId: resolved.selectedStartWeaponId,
    selectedStartAccessoryId: resolved.selectedStartAccessoryId,
    selectedArchetypeId: resolved.selectedArchetypeId,
    selectedRiskRelicId: resolved.selectedRiskRelicId,
    ascensionChoices: resolved.ascensionChoices,
    selectedAscensionLevel: resolved.selectedAscensionLevel,
    selectedAscension: resolved.selectedAscension,
    stages: resolved.stages,
    selectedStageId: resolved.selectedStageId,
    selectedStage: resolved.selectedStage,
    selectedSeedMode: resolved.selectedSeedMode,
    selectedSeedText: resolved.selectedSeedText,
    selectedSeedLabel: resolved.selectedSeedLabel,
    seedPreviewText: resolved.seedPreviewText,
    advancedSummary: resolved.advancedSummary,
    recommendedGoals,
    onCancel: callbacks.onCancel,
    onStart: callbacks.onStart,
  };
}
