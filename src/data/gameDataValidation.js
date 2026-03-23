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
} = {}) {
  const errors = [];
  const warnings = [];

  errors.push(...collectDuplicateIdErrors(upgradeData, 'upgradeData'));
  errors.push(...collectDuplicateIdErrors(weaponData, 'weaponData'));

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

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
