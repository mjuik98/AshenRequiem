import {
  cloneStartAccessory,
  cloneStartWeapon,
} from './startLoadoutCatalog.js';
import { resolveStartWeaponSelection } from './startLoadoutSelection.js';

export function buildPlayerStartWeapons(gameData = {}, session = null) {
  const selection = resolveStartWeaponSelection(gameData, session);
  const startWeapon = selection.availableStartWeapons.find((weapon) => weapon?.id === selection.selectedStartWeaponId);
  return cloneStartWeapon(startWeapon);
}

export function buildPlayerStartAccessories(gameData = {}, session = null) {
  const selection = resolveStartWeaponSelection(gameData, session);
  const startAccessory = selection.availableStartAccessories.find((accessory) => accessory?.id === selection.selectedStartAccessoryId);
  return cloneStartAccessory(startAccessory);
}
