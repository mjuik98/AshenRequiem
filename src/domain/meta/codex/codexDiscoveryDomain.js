function toSet(values) {
  return new Set((values ?? []).filter(Boolean));
}

export function getDiscoveredWeaponIds(session) {
  return toSet(session?.meta?.weaponsUsedAll);
}

export function getDiscoveredAccessoryIds(session) {
  return toSet(session?.meta?.accessoriesOwnedAll);
}

export function getDiscoveredEvolutionIds(session) {
  return toSet(session?.meta?.evolvedWeapons);
}

export function getDiscoveredCodexWeaponIds(session) {
  return new Set([
    ...getDiscoveredWeaponIds(session),
    ...getDiscoveredEvolutionIds(session),
  ]);
}

export function isWeaponDiscovered(session, weaponId) {
  return Boolean(weaponId) && getDiscoveredWeaponIds(session).has(weaponId);
}

export function isAccessoryDiscovered(session, accessoryId) {
  return Boolean(accessoryId) && getDiscoveredAccessoryIds(session).has(accessoryId);
}

export function isEvolutionDiscovered(session, weaponId) {
  return Boolean(weaponId) && getDiscoveredEvolutionIds(session).has(weaponId);
}

export function isCodexWeaponDiscovered(session, weapon) {
  if (!weapon?.id) return false;
  return weapon?.isEvolved
    ? isEvolutionDiscovered(session, weapon.id)
    : isWeaponDiscovered(session, weapon.id);
}
