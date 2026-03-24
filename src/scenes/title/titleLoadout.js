import { resolveStartWeaponSelection } from '../../state/startLoadoutRuntime.js';

export function getAvailableStartWeapons(gameData, session) {
  return resolveStartWeaponSelection(gameData, session).availableStartWeapons;
}

export function buildTitleLoadoutConfig(gameData, session, callbacks = {}) {
  const resolved = resolveStartWeaponSelection(gameData, session);
  return {
    weapons: resolved.availableStartWeapons,
    canStart: resolved.canStart,
    selectedWeaponId: resolved.selectedStartWeaponId,
    onCancel: callbacks.onCancel,
    onStart: callbacks.onStart,
  };
}
