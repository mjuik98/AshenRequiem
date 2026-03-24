import { accessoryData } from './accessoryData.js';
import { unlockData } from './unlockData.js';
import { weaponData } from './weaponData.js';

function getUnlockTargetSet(targetType, data = {}) {
  data = data ?? {};
  const source = data.unlockData ?? unlockData;
  return new Set(
    (source ?? [])
      .filter((entry) => entry?.targetType === targetType && typeof entry.targetId === 'string')
      .map((entry) => entry.targetId),
  );
}

export function getDefaultUnlockedWeaponIds(data = {}) {
  data = data ?? {};
  const weapons = data.weaponData ?? weaponData;
  const gatedWeaponIds = getUnlockTargetSet('weapon', data);

  return (weapons ?? [])
    .filter((weapon) => weapon && !weapon.isEvolved && !gatedWeaponIds.has(weapon.id))
    .map((weapon) => weapon.id);
}

export function getDefaultUnlockedAccessoryIds(data = {}) {
  data = data ?? {};
  const accessories = data.accessoryData ?? accessoryData;
  const gatedAccessoryIds = getUnlockTargetSet('accessory', data);

  return (accessories ?? [])
    .filter((accessory) => accessory && !gatedAccessoryIds.has(accessory.id))
    .map((accessory) => accessory.id);
}

export function mergeUnlockedWeaponIds(explicitIds, data = {}) {
  data = data ?? {};
  const merged = new Set(getDefaultUnlockedWeaponIds(data));
  for (const id of explicitIds ?? []) {
    if (typeof id === 'string' && id.length > 0) merged.add(id);
  }
  return [...merged];
}

export function mergeUnlockedAccessoryIds(explicitIds, data = {}) {
  data = data ?? {};
  const merged = new Set(getDefaultUnlockedAccessoryIds(data));
  for (const id of explicitIds ?? []) {
    if (typeof id === 'string' && id.length > 0) merged.add(id);
  }
  return [...merged];
}
