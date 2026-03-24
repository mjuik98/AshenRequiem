import {
  normalizePauseSynergyRequirementId,
  toArray,
} from './pauseLoadoutFormatting.js';

function getEquippedIds(player, kind) {
  const source = kind === 'weapon' ? toArray(player?.weapons) : toArray(player?.accessories);
  return new Set(source.map((item) => item?.id).filter(Boolean));
}

export function getRelatedItems(selectedItem, player, data, indexes) {
  if (selectedItem?.kind !== 'weapon' && selectedItem?.kind !== 'accessory') {
    return [];
  }

  const isWeapon = selectedItem.kind === 'weapon';
  const sourceKind = isWeapon ? 'accessory' : 'weapon';
  const sourceMap = isWeapon ? indexes?.accessoryById ?? new Map() : indexes?.weaponById ?? new Map();
  const synergyMap = isWeapon ? indexes?.synergiesByWeaponId : indexes?.synergiesByAccessoryId;
  const equippedIds = getEquippedIds(player, sourceKind);
  const relationships = new Map();

  const addRelationship = (kind, id, reason) => {
    if (!id || !sourceMap.has(id)) return;
    const key = `${kind}:${id}`;
    const current = relationships.get(key) ?? {
      kind,
      id,
      name: sourceMap.get(id)?.name ?? id,
      equipped: equippedIds.has(id),
      reasons: new Set(),
    };
    current.reasons.add(reason);
    relationships.set(key, current);
  };

  for (const recipe of data?.weaponEvolutionData ?? []) {
    if (isWeapon && recipe?.requires?.weaponId === selectedItem.id) {
      for (const accessoryId of toArray(recipe?.requires?.accessoryIds)) {
        addRelationship('accessory', accessoryId, '진화 경로');
      }
    }
    if (!isWeapon && toArray(recipe?.requires?.accessoryIds).includes(selectedItem.id)) {
      addRelationship('weapon', recipe?.requires?.weaponId, '진화 경로');
    }
  }

  for (const synergy of synergyMap?.get(selectedItem.id) ?? []) {
    for (const requirement of synergy?.requires ?? []) {
      const requirementId = normalizePauseSynergyRequirementId(requirement);
      if (!requirementId || requirementId === selectedItem.id) continue;
      addRelationship(sourceKind, requirementId, '시너지 연결');
    }
  }

  return [...relationships.values()].sort((left, right) => {
    if (left.equipped !== right.equipped) return left.equipped ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

export function isEvolutionReady(item, player, data) {
  if (item?.kind !== 'weapon') return false;
  const recipes = toArray(data?.weaponEvolutionData);
  const recipe = recipes.find((candidate) => candidate?.requires?.weaponId === item.id);
  if (!recipe) return false;

  const ownedAccessoryIds = new Set(toArray(player?.accessories).map((accessory) => accessory?.id));
  const isMaxLevel = (item?.source?.level ?? 0) >= (item?.source?.maxLevel ?? Infinity);
  const hasAccessories = toArray(recipe?.requires?.accessoryIds).every((accessoryId) => ownedAccessoryIds.has(accessoryId));
  return isMaxLevel && hasAccessories;
}

export function hasSynergyActive(item, player, indexes) {
  if (item?.kind !== 'weapon' && item?.kind !== 'accessory') return false;
  const synergyMap = item.kind === 'weapon'
    ? indexes?.synergiesByWeaponId
    : indexes?.synergiesByAccessoryId;
  const synergies = synergyMap?.get(item?.id) ?? [];
  const activeSynergyIds = new Set(player?.activeSynergies ?? []);
  return synergies.some((synergy) => activeSynergyIds.has(synergy?.id));
}
