function appendSelectedFields(result, saveResult = {}) {
  if (saveResult?.selectedWeaponId !== undefined) {
    result.selectedWeaponId = saveResult.selectedWeaponId;
  }
  if (saveResult?.selectedAscensionLevel != null) {
    result.selectedAscensionLevel = saveResult.selectedAscensionLevel;
  }
  if (saveResult?.selectedStartAccessoryId !== undefined) {
    result.selectedStartAccessoryId = saveResult.selectedStartAccessoryId;
  }
  if (saveResult?.selectedArchetypeId) {
    result.selectedArchetypeId = saveResult.selectedArchetypeId;
  }
  if (saveResult?.selectedRiskRelicId !== undefined) {
    result.selectedRiskRelicId = saveResult.selectedRiskRelicId;
  }
  if (saveResult?.selectedStageId) {
    result.selectedStageId = saveResult.selectedStageId;
  }
  if (saveResult?.selectedSeedMode) {
    result.selectedSeedMode = saveResult.selectedSeedMode;
  }
  if (saveResult?.selectedSeedText !== undefined) {
    result.selectedSeedText = saveResult.selectedSeedText;
  }
  return result;
}

export function buildTitleRunResult({
  saved = false,
  saveResult = null,
  nextScene = null,
} = {}) {
  const result = appendSelectedFields({ saved }, saveResult);
  result.nextScene = saved ? nextScene : null;
  return result;
}
