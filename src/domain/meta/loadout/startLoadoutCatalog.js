import {
  getArchetypeChoices,
} from '../../../data/archetypeData.js';
import {
  getRiskRelicChoices,
} from '../../../data/riskRelicData.js';
import {
  getStageChoices,
} from '../../../data/stageData.js';

export const DEFAULT_START_WEAPON_ID = 'magic_bolt';
export const DEFAULT_SEED_MODE = 'none';

export function getWeaponCatalog(gameData = {}) {
  if (Array.isArray(gameData?.weaponData) && gameData.weaponData.length > 0) {
    return gameData.weaponData;
  }

  return [];
}

export function getAccessoryCatalog(gameData = {}) {
  if (Array.isArray(gameData?.accessoryData) && gameData.accessoryData.length > 0) {
    return gameData.accessoryData;
  }

  return [];
}

export function getStageCatalog(gameData = {}) {
  if (Array.isArray(gameData?.stageData) && gameData.stageData.length > 0) {
    return gameData.stageData;
  }

  return getStageChoices();
}

export function getArchetypeCatalog(gameData = {}) {
  if (Array.isArray(gameData?.archetypeData) && gameData.archetypeData.length > 0) {
    return gameData.archetypeData;
  }

  return getArchetypeChoices();
}

export function getRiskRelicCatalog(gameData = {}) {
  if (Array.isArray(gameData?.riskRelicData) && gameData.riskRelicData.length > 0) {
    return gameData.riskRelicData;
  }

  return getRiskRelicChoices();
}

export function getAvailableStartWeapons(weaponCatalog, unlockedWeapons) {
  return weaponCatalog.filter((weapon) => (
    weapon
    && weapon.isEvolved !== true
    && unlockedWeapons.includes(weapon.id)
  ));
}

export function getAvailableStartAccessories(accessoryCatalog, unlockedAccessories) {
  return accessoryCatalog.filter((accessory) => (
    accessory
    && unlockedAccessories.includes(accessory.id)
  ));
}

export function getFallbackStartWeaponId(availableStartWeapons) {
  return availableStartWeapons.find((weapon) => weapon?.id === DEFAULT_START_WEAPON_ID)?.id
    ?? availableStartWeapons[0]?.id
    ?? null;
}

export function cloneStartWeapon(weapon) {
  return weapon ? [{ ...weapon, currentCooldown: 0, level: 1 }] : [];
}

export function cloneStartAccessory(accessory) {
  return accessory ? [{ ...accessory, level: 1 }] : [];
}
