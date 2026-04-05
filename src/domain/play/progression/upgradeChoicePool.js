function getUnlockTargetSet(targetType, data = {}) {
  const unlockEntries = Array.isArray(data?.unlockData) ? data.unlockData : [];
  return new Set(
    unlockEntries
      .filter((entry) => entry?.targetType === targetType && typeof entry?.targetId === 'string')
      .map((entry) => entry.targetId),
  );
}

function mergeUnlockedIds(explicitIds = [], defaults = []) {
  const merged = new Set(defaults);
  for (const id of explicitIds ?? []) {
    if (typeof id === 'string' && id.length > 0) {
      merged.add(id);
    }
  }
  return [...merged];
}

function getUnlockedWeaponIds(player, data = {}) {
  const weaponCatalog = Array.isArray(data?.weaponData) ? data.weaponData : [];
  const gatedWeaponIds = getUnlockTargetSet('weapon', data);
  const defaultUnlockedWeaponIds = weaponCatalog
    .filter((weapon) => weapon && weapon.isEvolved !== true && !gatedWeaponIds.has(weapon.id))
    .map((weapon) => weapon.id);

  return mergeUnlockedIds(player?.unlockedWeapons, defaultUnlockedWeaponIds);
}

function getUnlockedAccessoryIds(player, data = {}) {
  const accessoryCatalog = Array.isArray(data?.accessoryData) ? data.accessoryData : [];
  const gatedAccessoryIds = getUnlockTargetSet('accessory', data);
  const defaultUnlockedAccessoryIds = accessoryCatalog
    .filter((accessory) => accessory && !gatedAccessoryIds.has(accessory.id))
    .map((accessory) => accessory.id);

  return mergeUnlockedIds(player?.unlockedAccessories, defaultUnlockedAccessoryIds);
}

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

function getEvolutionResultWeapon(recipe, data) {
  return getWeaponDef(recipe?.resultWeaponId, data);
}

function isBaseWeaponBlockedByOwnedEvolution(weaponId, player, data) {
  const recipes = data?.weaponEvolutionData ?? [];
  return recipes.some((recipe) => {
    if (recipe?.requires?.weaponId !== weaponId) return false;
    const resultWeaponId = recipe?.resultWeaponId;
    if (!resultWeaponId) return false;
    return player?.weapons?.some((weapon) => weapon.id === resultWeaponId)
      || (player?.evolvedWeapons?.has?.(recipe.id) ?? false);
  });
}

function getAccessoryNames(accessoryIds = [], data) {
  return accessoryIds
    .map((accessoryId) => getAccessoryDef(accessoryId, data)?.name ?? accessoryId)
    .join(', ');
}

export function buildEvolutionChoicePool(player, options = {}, data = {}) {
  if (!player || !data?.weaponEvolutionData || !data?.weaponData) return [];

  const banishedUpgradeIds = new Set(options.banishedUpgradeIds ?? []);
  const excludeChoiceIds = new Set(options.excludeChoiceIds ?? []);
  const evolvedRecipeIds = player.evolvedWeapons ?? new Set();
  const picks = [];

  for (const recipe of data.weaponEvolutionData) {
    const recipeId = recipe?.id;
    if (!recipeId || banishedUpgradeIds.has(recipeId) || excludeChoiceIds.has(recipeId)) continue;
    if (evolvedRecipeIds.has(recipeId)) continue;

    const { weaponId, accessoryIds = [] } = recipe.requires ?? {};
    const ownedWeapon = player.weapons?.find((weapon) => weapon.id === weaponId);
    if (!ownedWeapon) continue;

    const baseWeaponDef = getWeaponDef(weaponId, data);
    const maxLevel = baseWeaponDef?.maxLevel ?? Infinity;
    if ((ownedWeapon.level ?? 1) < maxLevel) continue;

    const hasAllAccessories = accessoryIds.every((accessoryId) =>
      player.accessories?.some((accessory) => accessory.id === accessoryId)
    );
    if (!hasAllAccessories) continue;

    const resultWeapon = getEvolutionResultWeapon(recipe, data);
    if (!resultWeapon) continue;
    if (player.weapons?.some((weapon) => weapon.id === resultWeapon.id)) continue;

    const baseWeaponName = baseWeaponDef?.name ?? ownedWeapon.name ?? weaponId;
    const accessoryNames = getAccessoryNames(accessoryIds, data);
    const description = accessoryNames
      ? `${baseWeaponName}을 ${resultWeapon.name}로 진화. 필요 장신구: ${accessoryNames}`
      : `${baseWeaponName}을 ${resultWeapon.name}로 진화`;

    picks.push({
      id: recipeId,
      recipeId,
      type: 'weapon_evolution',
      weaponId,
      resultWeaponId: recipe.resultWeaponId,
      name: resultWeapon.name,
      description,
      announceText: recipe.announceText ?? `${resultWeapon.name}으로 진화했다!`,
    });
  }

  return picks;
}

export function buildUpgradeChoicePool(player, options = {}, data = {}) {
  const picks = [];

  const maxWeaponSlots = player.maxWeaponSlots ?? 3;
  const maxAccessorySlots = player.maxAccessorySlots ?? 3;
  const unlockedWeapons = getUnlockedWeaponIds(player, data);
  const unlockedAccessories = getUnlockedAccessoryIds(player, data);
  const banishedUpgradeIds = new Set(options.banishedUpgradeIds ?? []);
  const excludeChoiceIds = new Set(options.excludeChoiceIds ?? []);

  for (const upgrade of getActiveUpgradeData(data)) {
    if (banishedUpgradeIds.has(upgrade.id) || excludeChoiceIds.has(upgrade.id)) continue;

    if (upgrade.type === 'weapon_new') {
      const definition = getWeaponDef(upgrade.weaponId, data);
      if (!definition?.isEvolved
          && unlockedWeapons.includes(upgrade.weaponId)
          && player.weapons.length < maxWeaponSlots
          && !isBaseWeaponBlockedByOwnedEvolution(upgrade.weaponId, player, data)
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
      if (unlockedAccessories.includes(upgrade.accessoryId)
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
