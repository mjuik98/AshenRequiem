import { weaponData } from './weaponData.js';

export function getWeaponDataById(id) {
  return weaponData.find((weapon) => weapon.id === id) ?? null;
}
