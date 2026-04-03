import { bindStartLoadoutInteractions } from './startLoadoutInteractions.js';
import { renderStartLoadoutMarkup } from './startLoadoutMarkup.js';

export function bindStartLoadoutViewRuntime(view) {
  return bindStartLoadoutInteractions(view?._el, {
    canStart: () => view?._canStart,
    getSelectedWeaponId: () => view?._selectedWeaponId,
    getSelectedAscensionLevel: () => view?._selectedAscensionLevel,
    getSelectedStartAccessoryId: () => view?._selectedStartAccessoryId,
    getSelectedArchetypeId: () => view?._selectedArchetypeId,
    getSelectedRiskRelicId: () => view?._selectedRiskRelicId,
    getSelectedStageId: () => view?._selectedStageId,
    getSelectedSeedMode: () => view?._selectedSeedMode,
    getSelectedSeedText: () => view?._selectedSeedText,
    onToggleAdvanced: () => {
      view._isAdvancedOpen = !view._isAdvancedOpen;
      view._render();
    },
    onSelectWeapon: (weaponId) => {
      view._selectedWeaponId = weaponId;
      view._render();
    },
    onSelectAscension: (ascensionLevel) => {
      view._selectedAscensionLevel = ascensionLevel;
      view._advancedSummary = view._buildAdvancedSummary();
      view._render();
    },
    onSelectAccessory: (accessoryId) => {
      view._selectedStartAccessoryId = accessoryId || null;
      view._render();
    },
    onSelectArchetype: (archetypeId) => {
      view._selectedArchetypeId = archetypeId;
      view._advancedSummary = view._buildAdvancedSummary();
      view._render();
    },
    onSelectRiskRelic: (riskRelicId) => {
      view._selectedRiskRelicId = riskRelicId || null;
      view._render();
    },
    onSelectStage: (stageId) => {
      view._selectedStageId = stageId;
      view._advancedSummary = view._buildAdvancedSummary();
      view._render();
    },
    onSelectSeedMode: (seedMode) => {
      view._selectedSeedMode = seedMode;
      if (seedMode !== 'custom') {
        view._selectedSeedText = '';
      }
      view._seedPreviewText = view._buildSeedPreviewText();
      view._render();
    },
    onChangeSeedText: (seedText) => {
      view._selectedSeedText = seedText;
      view._seedPreviewText = view._buildSeedPreviewText();
    },
    onCancel: () => {
      view.hide();
      view._onCancel?.();
    },
    onStart: (selectedWeaponId, runOptions) => {
      view.hide();
      view._onStart?.(selectedWeaponId, runOptions);
    },
  });
}

export function renderStartLoadoutViewRuntime(view, renderState = view._captureRenderState()) {
  view._el.innerHTML = renderStartLoadoutMarkup({
    weapons: view._weapons,
    accessories: view._accessories,
    archetypes: view._archetypes,
    riskRelics: view._riskRelics,
    selectedWeaponId: view._selectedWeaponId,
    ascensionChoices: view._ascensionChoices,
    selectedAscensionLevel: view._selectedAscensionLevel,
    selectedStartAccessoryId: view._selectedStartAccessoryId,
    selectedArchetypeId: view._selectedArchetypeId,
    selectedRiskRelicId: view._selectedRiskRelicId,
    stages: view._stages,
    selectedStageId: view._selectedStageId,
    selectedSeedMode: view._selectedSeedMode,
    selectedSeedText: view._selectedSeedText,
    seedPreviewText: view._seedPreviewText,
    advancedSummary: view._advancedSummary,
    isAdvancedOpen: view._isAdvancedOpen,
    canStart: view._canStart,
  });
  view._restoreRenderState(renderState);
}
