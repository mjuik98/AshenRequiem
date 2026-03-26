import { hasRuntimeQueryFlag } from '../../adapters/browser/runtimeEnv.js';

export function shouldEnablePipelineProfiling(host = globalThis) {
  if (!host) return false;
  if (host.__ASHEN_PROFILE_PIPELINE__ === true) return true;
  return hasRuntimeQueryFlag('profilePipeline', host);
}

export function applyRunSessionState(world, session) {
  world.progression.runRerollsRemaining = session?.meta?.permanentUpgrades?.reroll_charge ?? 0;
  world.progression.runBanishesRemaining = session?.meta?.permanentUpgrades?.banish_charge ?? 0;
  world.progression.banishedUpgradeIds = [];
  world.progression.levelUpActionMode = 'select';
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

  world.progression.pendingEventQueue = pendingEvents.length > 0 ? pendingEvents : null;

  return world;
}
