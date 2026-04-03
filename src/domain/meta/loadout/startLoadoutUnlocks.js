import {
  getAccessoryCatalog,
  getWeaponCatalog,
} from './startLoadoutCatalog.js';

function getUnlockTargetSet(targetType, gameData = {}) {
  const unlockEntries = Array.isArray(gameData?.unlockData) ? gameData.unlockData : [];
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

function getUnlockedWeaponIds(gameData = {}, session = null) {
  const weaponCatalog = getWeaponCatalog(gameData);
  const gatedWeaponIds = getUnlockTargetSet('weapon', gameData);
  const defaultUnlockedWeaponIds = weaponCatalog
    .filter((weapon) => weapon && weapon.isEvolved !== true && !gatedWeaponIds.has(weapon.id))
    .map((weapon) => weapon.id);

  return mergeUnlockedIds(session?.meta?.unlockedWeapons, defaultUnlockedWeaponIds);
}

function getUnlockedAccessoryIds(gameData = {}, session = null) {
  const accessoryCatalog = getAccessoryCatalog(gameData);
  const gatedAccessoryIds = getUnlockTargetSet('accessory', gameData);
  const defaultUnlockedAccessoryIds = accessoryCatalog
    .filter((accessory) => accessory && !gatedAccessoryIds.has(accessory.id))
    .map((accessory) => accessory.id);

  return mergeUnlockedIds(session?.meta?.unlockedAccessories, defaultUnlockedAccessoryIds);
}

export function resolveUnlockedLoadoutIds(gameData = {}, session = null) {
  return {
    unlockedWeapons: getUnlockedWeaponIds(gameData, session),
    unlockedAccessories: getUnlockedAccessoryIds(gameData, session),
  };
}
