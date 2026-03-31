function collectDuplicateIdErrors(items, label) {
  const ids = items.map((entry) => entry.id);
  return ids
    .filter((id, index) => ids.indexOf(id) !== index)
    .map((id) => `[validate] ${label} 중복 id: ${id}`);
}

const ASSET_BUDGET_TIERS = new Set(['critical', 'standard', 'luxury']);
const ASSET_QUALITY_POLICIES = new Set(['fixed', 'scalable', 'fallback']);
const ASSET_SOURCE_TYPES = new Set(['dom', 'procedural', 'audio', 'image']);
const STAGE_BACKGROUND_MODES = new Set(['legacy_grid', 'seamless_tile']);

function validateAssetManifestEntries(assetManifest = []) {
  const errors = [];

  for (const entry of assetManifest) {
    if (!entry?.id) continue;
    if (typeof entry.preloadGroup !== 'string' || entry.preloadGroup.length <= 0) {
      errors.push(`[validate] assetManifest "${entry.id}" preloadGroup가 비어 있음`);
    }
    if (!ASSET_BUDGET_TIERS.has(entry.budgetTier)) {
      errors.push(`[validate] assetManifest "${entry.id}" budgetTier가 유효하지 않음`);
    }
    if (!Number.isFinite(entry.estimatedBytes) || entry.estimatedBytes <= 0) {
      errors.push(`[validate] assetManifest "${entry.id}" estimatedBytes가 유효하지 않음`);
    }
    if (!ASSET_QUALITY_POLICIES.has(entry.qualityPolicy)) {
      errors.push(`[validate] assetManifest "${entry.id}" qualityPolicy가 유효하지 않음`);
    }
    if (!ASSET_SOURCE_TYPES.has(entry.sourceType)) {
      errors.push(`[validate] assetManifest "${entry.id}" sourceType이 유효하지 않음`);
    }
  }

  return errors;
}

function validateStageBackground(stage = {}) {
  const errors = [];
  const background = stage.background;
  if (!background || typeof background !== 'object') return errors;

  const mode = background.mode ?? 'legacy_grid';
  if (!STAGE_BACKGROUND_MODES.has(mode)) {
    errors.push(`[validate] stageData "${stage.id}" background.mode가 유효하지 않음`);
    return errors;
  }

  if (mode !== 'seamless_tile') return errors;

  if (!Number.isFinite(background.tileSize) || background.tileSize <= 0) {
    errors.push(`[validate] stageData "${stage.id}" background.tileSize가 유효하지 않음`);
  }

  if (!background.palette || typeof background.palette !== 'object') {
    errors.push(`[validate] stageData "${stage.id}" background.palette가 없음`);
    return errors;
  }

  if (typeof background.palette.base !== 'string' || background.palette.base.length <= 0) {
    errors.push(`[validate] stageData "${stage.id}" background.palette.base가 비어 있음`);
  }
  if (typeof background.palette.ember !== 'string' || background.palette.ember.length <= 0) {
    errors.push(`[validate] stageData "${stage.id}" background.palette.ember가 비어 있음`);
  }

  return errors;
}

export function validateCoreGameData({
  upgradeData = [],
  weaponData = [],
  waveData = [],
  stageData = [],
  assetManifest = [],
} = {}) {
  const errors = [];
  const warnings = [];

  errors.push(...collectDuplicateIdErrors(upgradeData, 'upgradeData'));
  errors.push(...collectDuplicateIdErrors(weaponData, 'weaponData'));
  errors.push(...collectDuplicateIdErrors(assetManifest, 'assetManifest'));
  errors.push(...validateAssetManifestEntries(assetManifest));

  for (const upgrade of upgradeData) {
    if (!upgrade.weaponId) continue;
    if (!weaponData.some((weapon) => weapon.id === upgrade.weaponId)) {
      errors.push(`[validate] upgradeData "${upgrade.id}" → 존재하지 않는 weaponId "${upgrade.weaponId}"`);
    }
  }

  for (const weapon of weaponData) {
    if (weapon.maxLevel !== undefined && weapon.maxLevel < 1) {
      errors.push(`[validate] weaponData "${weapon.id}" maxLevel < 1`);
    }
    if (weapon.behaviorId && typeof weapon.behaviorId !== 'string') {
      errors.push(`[validate] weaponData "${weapon.id}" behaviorId가 문자열이 아님`);
    }
  }

  waveData.forEach((wave, index) => {
    if (wave.spawnPerSecond < 0) {
      errors.push(`[validate] waveData[${index}] spawnPerSecond < 0`);
    }
    if (wave.from >= wave.to) {
      errors.push(`[validate] waveData[${index}] from >= to`);
    }
  });

  const assetIds = new Set(assetManifest.map((entry) => entry?.id).filter(Boolean));
  for (const stage of stageData) {
    if (!stage?.id) continue;
    errors.push(...validateStageBackground(stage));
    if (!stage.assets?.backgroundKey) {
      errors.push(`[validate] stageData "${stage.id}" backgroundKey 없음`);
    } else if (!assetIds.has(stage.assets.backgroundKey)) {
      errors.push(`[validate] stageData "${stage.id}" → 존재하지 않는 backgroundKey "${stage.assets.backgroundKey}"`);
    }
    if (!stage.assets?.bossCueKey) {
      errors.push(`[validate] stageData "${stage.id}" bossCueKey 없음`);
    } else if (!assetIds.has(stage.assets.bossCueKey)) {
      errors.push(`[validate] stageData "${stage.id}" → 존재하지 않는 bossCueKey "${stage.assets.bossCueKey}"`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
