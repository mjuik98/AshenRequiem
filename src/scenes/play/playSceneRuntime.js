export function shouldEnablePipelineProfiling(host = globalThis) {
  if (!host) return false;
  if (host.__ASHEN_PROFILE_PIPELINE__ === true) return true;

  const search = host.location?.search ?? '';
  return new URLSearchParams(search).has('profilePipeline');
}

export function applyRunSessionState(world, session) {
  world.runRerollsRemaining = session?.meta?.permanentUpgrades?.reroll_charge ?? 0;
  world.runBanishesRemaining = session?.meta?.permanentUpgrades?.banish_charge ?? 0;
  world.banishedUpgradeIds = [];
  world.levelUpActionMode = 'select';
  return world;
}

export function recordStartingWeapons(session, player, recordWeaponAcquired) {
  if (!player?.weapons?.length || typeof recordWeaponAcquired !== 'function') return;
  player.weapons.forEach((weapon) => {
    recordWeaponAcquired(session, weapon.id);
  });
}
