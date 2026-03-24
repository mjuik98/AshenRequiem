import { applyPermanentUpgrades as applyPermanentUpgradesToPlayer } from '../../data/permanentUpgradeData.js';
import {
  buildPlayerStartWeapons,
  resolveUnlockedLoadoutIds,
} from '../../state/startLoadoutRuntime.js';

export function resolvePlayerSpawnState(session = null, gameData = {}) {
  const { unlockedWeapons, unlockedAccessories } = resolveUnlockedLoadoutIds(gameData, session);
  return {
    startWeapons: buildPlayerStartWeapons(gameData, session),
    unlockedWeapons,
    unlockedAccessories,
    permanentUpgrades: { ...(session?.meta?.permanentUpgrades ?? {}) },
  };
}

export function applyPlayerPermanentUpgrades(
  player,
  permanentUpgrades = {},
  applyPermanentUpgradesImpl = applyPermanentUpgradesToPlayer,
) {
  if (!player || Object.keys(permanentUpgrades ?? {}).length === 0) return player;
  return applyPermanentUpgradesImpl(player, permanentUpgrades);
}
