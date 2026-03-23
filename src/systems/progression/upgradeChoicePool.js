export function getActiveUpgradeData(data) {
  return data?.upgradeData ?? [];
}

export function getWeaponDef(id, data) {
  return data?.weaponData?.find((weapon) => weapon.id === id) ?? null;
}

export function getAccessoryDef(id, data) {
  return data?.accessoryData?.find((accessory) => accessory.id === id) ?? null;
}

export function getNextProgression(weapon, data) {
  const progressionMap = data?.weaponProgressionData;
  const nextLevel = (weapon?.level ?? 1) + 1;
  return progressionMap?.[weapon?.id]?.find((step) => step.level === nextLevel)
    ?? null;
}

export function buildUpgradeChoicePool(player, options = {}, data = {}) {
  const picks = [];

  const maxWeaponSlots = player.maxWeaponSlots ?? 3;
  const maxAccessorySlots = player.maxAccessorySlots ?? 3;
  const unlockedWeapons = Array.isArray(player.unlockedWeapons) ? player.unlockedWeapons : null;
  const unlockedAccessories = Array.isArray(player.unlockedAccessories) ? player.unlockedAccessories : null;
  const banishedUpgradeIds = new Set(options.banishedUpgradeIds ?? []);
  const excludeChoiceIds = new Set(options.excludeChoiceIds ?? []);

  for (const upgrade of getActiveUpgradeData(data)) {
    if (banishedUpgradeIds.has(upgrade.id) || excludeChoiceIds.has(upgrade.id)) continue;

    if (upgrade.type === 'weapon_new') {
      const definition = getWeaponDef(upgrade.weaponId, data);
      if (!definition?.isEvolved
          && (!unlockedWeapons || unlockedWeapons.includes(upgrade.weaponId))
          && player.weapons.length < maxWeaponSlots
          && !player.weapons.find((weapon) => weapon.id === upgrade.weaponId)) {
        picks.push(upgrade);
      }
      continue;
    }

    if (upgrade.type === 'weapon_upgrade') {
      const ownedWeapon = player.weapons.find((weapon) => weapon.id === upgrade.weaponId);
      if (!ownedWeapon) continue;
      const definition = getWeaponDef(upgrade.weaponId, data);
      const maxLevel = definition?.maxLevel ?? Infinity;
      if (ownedWeapon.level >= maxLevel) continue;
      const nextProgression = getNextProgression(ownedWeapon, data);
      if (!nextProgression) continue;
      picks.push({
        ...upgrade,
        description: nextProgression.description ?? upgrade.description,
      });
      continue;
    }

    if (upgrade.type === 'accessory') {
      if ((!unlockedAccessories || unlockedAccessories.includes(upgrade.accessoryId))
          && (player.accessories?.length ?? 0) < maxAccessorySlots) {
        const alreadyHas = player.accessories?.some((accessory) => accessory.id === upgrade.accessoryId);
        if (!alreadyHas) picks.push(upgrade);
      }
      continue;
    }

    if (upgrade.type === 'accessory_upgrade') {
      const ownedAccessory = player.accessories?.find((accessory) => accessory.id === upgrade.accessoryId);
      if (!ownedAccessory) continue;
      const definition = getAccessoryDef(upgrade.accessoryId, data);
      const maxLevel = definition?.maxLevel ?? 5;
      if ((ownedAccessory.level ?? 1) < maxLevel) picks.push(upgrade);
    }
  }

  return picks;
}
