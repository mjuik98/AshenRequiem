const DEFAULT_START_WEAPON_ID = 'magic_bolt';

export function getAvailableStartWeapons(gameData, session) {
  const unlockedWeapons = new Set(session?.meta?.unlockedWeapons ?? [DEFAULT_START_WEAPON_ID]);
  return (gameData?.weaponData ?? []).filter((weapon) => (
    weapon
    && weapon.isEvolved !== true
    && unlockedWeapons.has(weapon.id)
  ));
}

export function getSelectedStartWeaponId(session, weapons) {
  const fallbackWeaponId = weapons.find((weapon) => weapon?.id === DEFAULT_START_WEAPON_ID)?.id
    ?? weapons[0]?.id
    ?? DEFAULT_START_WEAPON_ID;
  const selectedWeaponId = session?.meta?.selectedStartWeaponId ?? DEFAULT_START_WEAPON_ID;
  return weapons.some((weapon) => weapon?.id === selectedWeaponId)
    ? selectedWeaponId
    : fallbackWeaponId;
}

export function buildTitleLoadoutConfig(gameData, session, callbacks = {}) {
  const weapons = getAvailableStartWeapons(gameData, session);
  return {
    weapons,
    selectedWeaponId: getSelectedStartWeaponId(session, weapons),
    onCancel: callbacks.onCancel,
    onStart: callbacks.onStart,
  };
}
