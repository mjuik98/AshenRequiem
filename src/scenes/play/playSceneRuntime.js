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

export function queueRunStartEvents(world, player) {
  if (!world || !player) return world;

  const pendingEvents = [
    ...(player.weapons ?? [])
      .map((weapon) => weapon?.id)
      .filter(Boolean)
      .map((weaponId) => ({ type: 'weaponAcquired', payload: { weaponId } })),
    ...(player.accessories ?? [])
      .map((accessory) => accessory?.id)
      .filter(Boolean)
      .map((accessoryId) => ({ type: 'accessoryAcquired', payload: { accessoryId } })),
  ];

  world.pendingEventQueue = pendingEvents.length > 0 ? pendingEvents : null;

  return world;
}
