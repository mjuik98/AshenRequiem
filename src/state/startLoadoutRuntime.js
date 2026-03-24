const DEFAULT_START_WEAPON_ID = 'magic_bolt';

function getWeaponCatalog(gameData = {}) {
  if (Array.isArray(gameData?.weaponData) && gameData.weaponData.length > 0) {
    return gameData.weaponData;
  }

  return [];
}

function getAccessoryCatalog(gameData = {}) {
  if (Array.isArray(gameData?.accessoryData) && gameData.accessoryData.length > 0) {
    return gameData.accessoryData;
  }

  return [];
}

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

function cloneStartWeapon(weapon) {
  return weapon ? [{ ...weapon, currentCooldown: 0, level: 1 }] : [];
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

function getAvailableStartWeapons(weaponCatalog, unlockedWeapons) {
  return weaponCatalog.filter((weapon) => (
    weapon
    && weapon.isEvolved !== true
    && unlockedWeapons.includes(weapon.id)
  ));
}

function getFallbackStartWeaponId(availableStartWeapons) {
  return availableStartWeapons.find((weapon) => weapon?.id === DEFAULT_START_WEAPON_ID)?.id
    ?? availableStartWeapons[0]?.id
    ?? null;
}

function normalizeRequestedWeaponId(availableStartWeapons, requestedWeaponId) {
  if (!availableStartWeapons.length) return null;
  return availableStartWeapons.some((weapon) => weapon?.id === requestedWeaponId)
    ? requestedWeaponId
    : getFallbackStartWeaponId(availableStartWeapons);
}

export function resolveSelectedStartWeaponId(gameData = {}, session = null, requestedWeaponId = null) {
  const { unlockedWeapons } = resolveUnlockedLoadoutIds(gameData, session);
  const weaponCatalog = getWeaponCatalog(gameData);
  const availableStartWeapons = getAvailableStartWeapons(weaponCatalog, unlockedWeapons);
  const nextRequestedWeaponId = requestedWeaponId ?? session?.meta?.selectedStartWeaponId ?? DEFAULT_START_WEAPON_ID;
  return normalizeRequestedWeaponId(availableStartWeapons, nextRequestedWeaponId);
}

export function resolveUnlockedLoadoutIds(gameData = {}, session = null) {
  const unlockedWeapons = getUnlockedWeaponIds(gameData, session);
  const unlockedAccessories = getUnlockedAccessoryIds(gameData, session);

  return {
    unlockedWeapons,
    unlockedAccessories,
  };
}

export function resolveStartWeaponSelection(gameData = {}, session = null) {
  const { unlockedWeapons } = resolveUnlockedLoadoutIds(gameData, session);
  const weaponCatalog = getWeaponCatalog(gameData);
  const availableStartWeapons = getAvailableStartWeapons(weaponCatalog, unlockedWeapons);
  const selectedStartWeaponId = resolveSelectedStartWeaponId(gameData, session);

  return {
    unlockedWeapons,
    availableStartWeapons,
    canStart: availableStartWeapons.length > 0,
    selectedStartWeaponId,
  };
}

export function buildPlayerStartWeapons(gameData = {}, session = null) {
  const selection = resolveStartWeaponSelection(gameData, session);
  const startWeapon = selection.availableStartWeapons.find((weapon) => weapon?.id === selection.selectedStartWeaponId);
  return cloneStartWeapon(startWeapon);
}
