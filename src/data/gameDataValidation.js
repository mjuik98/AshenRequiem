function collectDuplicateIdErrors(items, label) {
  const ids = items.map((entry) => entry.id);
  return ids
    .filter((id, index) => ids.indexOf(id) !== index)
    .map((id) => `[validate] ${label} 중복 id: ${id}`);
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
